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

lib.upload = function(aws, groupName, streamName, logEvents, retentionInDays, cb) {
  debug('upload', logEvents);

  // trying to send a batch before the last completed
  // would cause InvalidSequenceTokenException.
  if (lib._postingEvents || logEvents.length <= 0) {
    debug('nothing to do or already doing something');
    return cb();
  }

  lib._postingEvents = true;
  safeUpload(function(err) {
    lib._postingEvents = false;
    return cb(err);
  });

  // safeUpload introduced after https://github.com/lazywithclass/winston-cloudwatch/issues/55
  // Note that calls to upload() can occur at a greater frequency
  // than getToken() responses are processed. By way of example, consider if add() is
  // called at 0s and 1.1s, each time with a single event, and upload() is called
  // at 1.0s and 2.0s, with the same logEvents array, but calls to getToken()
  // take 1.5s to return. When the first call to getToken() DOES return,
  // it will send both events and empty the array. Then, when the second call
  // go getToken() returns, without this check also here, it would attempt to send
  // an empty array, resulting in the InvalidParameterException.
  function safeUpload(cb) {
    lib.getToken(aws, groupName, streamName, retentionInDays, function(err, token) {

      if (err) {
        debug('error getting token', err, true);
        return cb(err);
      }

      var entryIndex = 0;
      var bytes = 0;
      while (entryIndex < logEvents.length &&
             entryIndex <= LIMITS.MAX_BATCH_SIZE_COUNT) {
        var ev = logEvents[entryIndex];
        // unit tests pass null elements
        var evSize = ev ? Buffer.byteLength(ev.message, 'utf8') : 0;
        if(evSize > LIMITS.MAX_EVENT_MSG_SIZE_BYTES) {
          evSize = LIMITS.MAX_EVENT_MSG_SIZE_BYTES;
          ev.message = ev.message.substring(0, evSize);
          const msgTooBigErr = new Error('Message Truncated because it exceeds the CloudWatch size limit');
          msgTooBigErr.logEvent = ev;
          cb(msgTooBigErr);
        }
        if (bytes + evSize > LIMITS.MAX_BATCH_SIZE_BYTES) break;
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
            lib.submitWithAnotherToken(aws, groupName, streamName, payload, retentionInDays, cb)
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
  }
};

lib.submitWithAnotherToken = function(aws, groupName, streamName, payload, retentionInDays, cb) {
  lib.getToken(aws, groupName, streamName, retentionInDays, function(err, token) {
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

lib.getToken = function(aws, groupName, streamName, retentionInDays, cb) {
  async.series([
    lib.ensureGroupPresent.bind(null, aws, groupName, retentionInDays),
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

lib.ensureGroupPresent = function ensureGroupPresent(aws, name, retentionInDays, cb) {
  debug('ensure group present');
  var params = { logGroupName: name };
  aws.describeLogStreams(params, function(err, data) {
    // TODO we should cb(err, false) if there's an error?
    if (err && err.code == 'ResourceNotFoundException') {
      debug('create group');
      return aws.createLogGroup(params, lib.ignoreInProgress(function(err) {
        if(!err) lib.putRetentionPolicy(aws, name, retentionInDays);
        cb(err, err ? false : true);
      }));
    } else {
      lib.putRetentionPolicy(aws, name, retentionInDays);
      cb(err, true);
    }
  });
};

lib.putRetentionPolicy = function putRetentionPolicy(aws, groupName, days) {
  var params = {
    logGroupName: groupName,
    retentionInDays: days
  };
  if(days > 0) {
    aws.putRetentionPolicy(params, function(err, data) {
      if (err) debug('failed to set retention policy for ' + groupName + ' to ' + days + ' days due to ' + err.stack);
      else     debug('setting retention policy for ' + groupName + ' to ' + days + ' days');
    });
  }
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
      }, lib.ignoreInProgress(function(err) {
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
      debug('ignore operation in progress', err.message);
      cb(null, data);
    } else {
      cb(err, data);
    }
  };
};

module.exports = lib;
