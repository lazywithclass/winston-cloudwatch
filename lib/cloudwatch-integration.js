var LIMITS = {
  MAX_EVENT_MSG_SIZE_BYTES: 256000,   // The real max size is 262144, we leave some room for overhead on each message
  MAX_BATCH_SIZE_BYTES: 1000000,      // We leave some fudge factor here too.
  MAX_BATCH_SIZE_COUNT : 100          // Bigger number means fewer requests to post.
};

var _ = require('lodash'),
    async = require('async'),
    stringify = require('./utils').stringify,
    debug = require('./utils').debug;

var lib = {};

lib.upload = function(aws, groupName, streamName, logEvents, cb) {
  debug('upload', logEvents);

  // Trying to send a batch before the last completed would cause InvalidSequenceTokenException.
  if (lib._postingEvents || logEvents.length <= 0) {
    debug('nothing to do or already doing something');
    return cb();
  }

  lib.getToken(aws, groupName, streamName, function(err, token) {

    if (err) {
      debug('error getting token', err, true);
      return cb(err);
    }

    var entryIndex = 0;
    var bytes = 0;
    while(entryIndex < logEvents.length && entryIndex <= LIMITS.MAX_BATCH_SIZE_COUNT) {
      var ev = logEvents[entryIndex];
      var evSize = ev ? Buffer.byteLength(ev.message, 'utf8') : 0; // Unit tests pass null elements
      // Handle single entries that are too big.
      if(evSize > LIMITS.MAX_EVENT_MSG_SIZE_BYTES) {
        evSize = LIMITS.MAX_EVENT_MSG_SIZE_BYTES;
        ev.message = ev.message.substring(0, evSize); // NOTE: For MBCS this may truncate the string more than needed
        const msgTooBigErr = new Error('Message Truncated because it exceeds the CloudWatch size limit');
        msgTooBigErr.logEvent = ev;
        cb(msgTooBigErr);
      }
      // Make sure batch size does not go above the limits.
      if(bytes + evSize > LIMITS.MAX_BATCH_SIZE_BYTES) break;
      bytes += evSize;
      entryIndex++;
    }

    var payload = {
      logGroupName: groupName,
      logStreamName: streamName,
      logEvents: logEvents.splice(0, entryIndex)
    };
    if (token) payload.sequenceToken = token;

    lib._postingEvents = true;
    debug('send to aws');
    aws.putLogEvents(payload, function(err) {
      if (err) {
        if (err.code === 'InvalidSequenceTokenException') {
          debug('InvalidSequenceTokenException, retrying', true)
          submitWithAnotherToken(aws, groupName, streamName, payload, cb)
        } else {
          debug('error during putLogEvents', err, true)
          retrySubmit(aws, payload, 3, cb)
        }
      } else  {
        lib._postingEvents = false;
        cb()
      }
    });
  });
};

function submitWithAnotherToken(aws, groupName, streamName, payload, cb) {
  lib.getToken(aws, groupName, streamName, function(err, token) {
    payload.sequenceToken = token;
    aws.putLogEvents(payload, function(err) {
      lib._postingEvents = false;
      cb(err)
    });
  })
}

function retrySubmit(aws, payload, times, cb) {
  debug('retrying to upload', times, 'more times')
  aws.putLogEvents(payload, function(err) {
    if (err && times > 0) {
      retrySubmit(aws, payload, times - 1, cb)
    } else {
      lib._postingEvents = false;
      cb(err)
    }
  })
}

lib.getToken = function(aws, groupName, streamName, cb) {
  async.series([
    lib.ensureGroupPresent.bind(null, aws, groupName),
    lib.getStream.bind(null, aws, groupName, streamName)
  ], function(err, resources) {
    var groupPresent = resources[0],
        stream = resources[1];
    if (groupPresent && stream) {
      debug('token found', stream.uploadSequenceToken);
      cb(err, stream.uploadSequenceToken);
    } else {
      debug('token not found', err);
      cb(err);
    }
  });
};

lib.ensureGroupPresent = function ensureGroupPresent(aws, name, cb) {
  debug('ensure group present');
  var params = { logGroupName: name };
  aws.describeLogStreams(params, function(err, data) {
    // TODO we should cb(err, false) if there's an error?
    if (err && err.code == 'ResourceNotFoundException') {
      debug('create group');
      return aws.createLogGroup(params, lib.ignoreInProgress(function(err) {
        cb(err, err ? false : true);
      }));
    } else {
      cb(err, true);
    }
  });
};

lib.getStream = function getStream(aws, groupName, streamName, cb) {
  var params = {
    logGroupName: groupName,
    logStreamNamePrefix: streamName
  };

  aws.describeLogStreams(params, function(err, data) {
    debug('ensure stream present');
    if (err) return cb(err);

    var stream = _.find(data.logStreams, function(stream) {
      return stream.logStreamName === streamName;
    });

    if (!stream) {
      debug('create stream');
      aws.createLogStream({
        logGroupName: groupName,
        logStreamName: streamName
      }, lib.ignoreInProgress(function(err, data) {
        if (err) return cb(err);
        getStream(aws, groupName, streamName, cb);
      }));
    } else {
      cb(null, stream);
    }
  });
};

lib.ignoreInProgress = function ignoreInProgress(cb) {
  return function(err, data) {
    if (err && (err.code == 'OperationAbortedException' ||
                err.code == 'ResourceAlreadyExistsException')) {
      debug('ignore operation in progress', err, data);
      cb(null, data);
    } else {
      cb(err, data);
    }
  };
};

module.exports = lib;
