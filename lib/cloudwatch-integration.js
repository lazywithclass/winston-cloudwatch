var AWS = require('aws-sdk'),
    cloudwatchlogs,
    _ = require('lodash'),
    logEvents = [],
    logGroupName = '',
    logStreamName = '',
    intervalId;

module.exports.init = function(awsLogGroupName, awsLogStreamName, awsProfile, awsAccessKeyId, awsSecretKey, awsRegion) {
  if (awsProfile && awsRegion) {
    var credentials = new AWS.SharedIniFileCredentials({profile: awsProfile});
    AWS.config.credentials = credentials;
    cloudwatchlogs = new AWS.CloudWatchLogs({region: awsRegion});
  } else if (awsAccessKeyId && awsSecretKey && awsRegion) {
    cloudwatchlogs = new AWS.CloudWatchLogs({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey, region: awsRegion});
  } else {
    cloudwatchlogs = new AWS.CloudWatchLogs();
  }
  logGroupName = awsLogGroupName;
  logStreamName = awsLogStreamName;
};

function upload(logEvents) {
  token(function(err, sequenceToken) {
    if (err) {
      return console.log(err, err.stack);
    }
    if (logEvents.length <= 0) {
      return;
    }
    var payload = {
      sequenceToken: sequenceToken,
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      logEvents: logEvents.splice(0, 20)
    };

    cloudwatchlogs.putLogEvents(payload, function(err, data) {
      if (err) return console.log(err, err.stack);
    });
  });
}

var throttledUpload = _.throttle(upload, 2000);

module.exports.add = function(log) {
  logEvents.push({
    message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()      
  });

  throttledUpload(logEvents);
};

function token(cb) {
  cloudwatchlogs.describeLogStreams({
    logGroupName: logGroupName
  }, function(err, data) {
    if (err) return cb(err);
    var logStream = _.find(data.logStreams, function(logStream) {
      return logStream.logStreamName === logStreamName;
    });
    cb(err, logStream.uploadSequenceToken);
  });
}
