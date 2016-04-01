var _ = require('lodash'),
    async = require('async');

var lib = {};

lib.upload = function(aws, groupName, streamName, logEvents, cb) {
  lib.getToken(aws, groupName, streamName, function(err, token) {
    if (err) {
      return cb(err);
    }

    if (logEvents.length <= 0) {
      return cb();
    }

    var payload = {
      logGroupName: groupName,
      logStreamName: streamName,
      logEvents: logEvents.splice(0, 20)
    };
    if (token) payload.sequenceToken = token;

    aws.putLogEvents(payload, cb);
  });
};

lib.getToken = function(aws, groupName, streamName, cb) {
  async.series([
    lib.ensureGroupPresent.bind(null, aws, groupName),
    lib.getStream.bind(null, aws, groupName, streamName)
  ], function(err, resources) {
    var groupPresent = resources[0],
        stream = resources[1];
    if (groupPresent && stream) {
      cb(err, stream.uploadSequenceToken);
    } else {
      cb(err);
    }
  });
};

lib.ensureGroupPresent = function ensureGroupPresent(aws, name, cb) {
  var params = { logGroupName: name };
  aws.describeLogStreams(params, function(err, data) {
    if (err && err.code == 'ResourceNotFoundException') {
      return aws.createLogGroup(params, lib.ignoreInProgress(function(err) {
        cb(err, err ? false : true);
      }));
    } else {
      cb(err, true);
    }
  });
};

lib.getStream = function getStream(aws, groupName, streamName, cb) {
  var params = { logGroupName: groupName };

  aws.describeLogStreams(params, function(err, data) {
    if (err) return cb(err);

    var stream = _.find(data.logStreams, function(stream) {
      return stream.logStreamName === streamName;
    });

    if (!stream) {
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
      cb(null, data);
    } else {
      cb(err, data);
    }
  };
};

module.exports = lib;
