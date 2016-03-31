var _ = require('lodash'),
    async = require('async'),
    cloudWatchIntegration = {};

function upload(cloudwatch, groupName, streamName, logEvents, cb) {
  getToken(cloudwatch, groupName, streamName, function(err, token) {
    if (err) {
      return console.log(err, err.stack);
    }

    if (logEvents.length <= 0) {
      return;
    }

    var payload = {
      logGroupName: groupName,
      logStreamName: streamName,
      logEvents: logEvents.splice(0, 20)
    };
    if (token) payload.sequenceToken = token;

    cloudwatch.putLogEvents(payload, cb);
  });
};

function getToken(aws, groupName, streamName, cb) {
  async.series([
    ensureGroupPresent.bind(null, aws, groupName),
    getStream.bind(null, aws, groupName, streamName)
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

function ensureGroupPresent(aws, name, cb) {
  var params = { logGroupName: name };
  aws.describeLogStreams(params, function(err, data) {
    if (err && err.code == 'ResourceNotFoundException') {
      return aws.createLogGroup(params, ignoreInProgress(function(err) {
        cb(err, err ? false : true);
      }));
    } else {
      cb(err, true);
    }
  });
}

function getStream(aws, groupName, streamName, cb) {
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
      }, ignoreInProgress(function(err, data) {
        if (err) return cb(err);
        getStream(aws, groupName, streamName, cb);
      }));
    } else {
      cb(null, stream);
    }
  });
}

function ignoreInProgress(cb) {
  return function(err, data) {
    if (err && (err.code == 'OperationAbortedException' ||
                err.code == 'ResourceAlreadyExistsException')) {
      cb(null, data);
    } else {
      cb(err, data);
    }
  };
}

module.exports = {
  upload: upload,
  getToken: getToken,
  ensureGroupPresent: ensureGroupPresent,
  getStream: getStream,
  ignoreInProgress: ignoreInProgress
};
