var LIMITS = {
  MAX_EVENT_MSG_SIZE_BYTES: 256000,   // The real max size is 262144, we leave some room for overhead on each message
  MAX_BATCH_SIZE_BYTES: 1000000,      // We leave some fudge factor here too.
}

// CloudWatch adds 26 bytes per log event based on their documentation:
// https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html
var BASE_EVENT_SIZE_BYTES = 26;

var find = require('lodash.find'),
    async = require('async'),
    debug = require('./utils').debug;

var lib = {
  _postingEvents: {}
};

lib.upload = function(aws, groupName, streamName, logEvents, retentionInDays, options, cb) {
  debug('upload', logEvents);

  // trying to send a batch before the last completed
  // would cause InvalidSequenceTokenException.
  if (lib._postingEvents[streamName] || logEvents.length <= 0) {
    debug('nothing to do or already doing something');
    return cb();
  }

  lib._postingEvents[streamName] = true;
  safeUpload(function(err) {
    lib._postingEvents[streamName] = false;
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
    lib.getToken(aws, groupName, streamName, retentionInDays, options, function(err, token) {

      if (err) {
        debug('error getting token', err, true);
        return cb(err);
      }

      var entryIndex = 0;
      var bytes = 0;
      while (entryIndex < logEvents.length) {
        var ev = logEvents[entryIndex];
        // unit tests pass null elements
        var evSize = ev ? Buffer.byteLength(ev.message, 'utf8') + BASE_EVENT_SIZE_BYTES : 0;
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

      lib._postingEvents[streamName] = true;
      debug('send to aws');
      aws.putLogEvents(payload, function(err, data) {
        debug('sent to aws, err: ', err, ' data: ', data)
        if (err) {
          // InvalidSequenceToken means we need to do a describe to get another token
          // also do the same if ResourceNotFound as that will result in the last token
          // for the group being set to null
          if (err.name === 'InvalidSequenceTokenException' || err.name === 'ResourceNotFoundException') {
            debug(err.name + ', retrying', true);
            lib.submitWithAnotherToken(aws, groupName, streamName, payload, retentionInDays, options, cb)
          } else {
            debug('error during putLogEvents', err, true)
            retrySubmit(aws, payload, 3, cb)
          }
        } else  {
          if (data && data.nextSequenceToken) {
            lib._nextToken[previousKeyMapKey(groupName, streamName)] = data.nextSequenceToken;
          }

          lib._postingEvents[streamName] = false;
          cb()
        }
      });
    });
  }
};

lib.submitWithAnotherToken = function(aws, groupName, streamName, payload, retentionInDays, options, cb) {
  lib._nextToken[previousKeyMapKey(groupName, streamName)] = null;
  lib.getToken(aws, groupName, streamName, retentionInDays, options, function(err, token) {
    payload.sequenceToken = token;
    aws.putLogEvents(payload, function(err) {
      lib._postingEvents[streamName] = false;
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
      lib._postingEvents[payload.logStreamName] = false;
      cb(err)
    }
  })
}

lib.getToken = function(aws, groupName, streamName, retentionInDays, options, cb) {
  var existingNextToken = lib._nextToken[previousKeyMapKey(groupName, streamName)];
  if (existingNextToken != null) {
    debug('using existing next token and assuming exists', existingNextToken);
    cb(null, existingNextToken);
    return;
  }

  const calls = options.ensureLogGroup !== false ? [
    lib.ensureGroupPresent.bind(null, aws, groupName, retentionInDays),
    lib.getStream.bind(null, aws, groupName, streamName)
  ] : [
    lib.getStream.bind(null, aws, groupName, streamName)
  ];

  async.series(calls, function(err, resources) {
    var groupPresent = calls.length>1 ? resources[0] : true,
        stream = calls.length === 1 ? resources[0] : resources[1];
    if (groupPresent && stream) {
      debug('token found', stream.uploadSequenceToken);
      cb(err, stream.uploadSequenceToken);
    } else {
      debug('token not found', err);
      cb(err);
    }
  });
};
lib._nextToken = {};

function previousKeyMapKey(group, stream) {
  return group + ':' + stream;
}

lib.ensureGroupPresent = function ensureGroupPresent(aws, name, retentionInDays, cb) {
  debug('ensure group present');
  var params = { logGroupName: name };
  aws.describeLogStreams(params, function(err, data) {
    // TODO we should cb(err, false) if there's an error?
    if (err && err.name == 'ResourceNotFoundException') {
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
  if (days > 0) {
    debug('setting retention policy for "' + groupName + '" to ' + days + ' days');
    aws.putRetentionPolicy(params, function(err, data) {
      if (err) console.error('failed to set retention policy for ' + groupName + ' to ' + days + ' days due to ' + err.stack);
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

    var stream = find(data.logStreams, function(stream) {
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
    if (err && (err.name == 'OperationAbortedException' ||
                err.name == 'ResourceAlreadyExistsException')) {
      debug('ignore operation in progress', err.message);
      cb(null, data);
    } else {
      cb(err, data);
    }
  };
};

module.exports = lib;
