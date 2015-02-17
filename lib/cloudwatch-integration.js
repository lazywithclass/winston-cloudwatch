var AWS = require('aws-sdk'),
  async = require('async'),
  _ = require('lodash');

module.exports = function(awsLogGroupName, awsLogStreamName, awsAccessKeyId, awsSecretKey, awsRegion) {
  if (awsAccessKeyId && awsSecretKey && awsRegion) {
    this.cloudwatchlogs = new AWS.CloudWatchLogs({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretKey,
      region: awsRegion
    });
  } else {
    this.cloudwatchlogs = new AWS.CloudWatchLogs();
  }
  this.logGroupName = awsLogGroupName;
  this.logStreamName = awsLogStreamName;
  this.logEvents = [];

  var self = this;
  async.forever(function(next) {
    setTimeout(function() {
      upload.call(self, next);
    }, 1000);
  }, function (err) {
    console.log(err);
  });
};

function upload(next) {
  if(this.logEvents.length <= 0) return next();

  var self = this;

  token(this.cloudwatchlogs, this.logGroupName, this.logStreamName, function(err, sequenceToken) {
    if(err) return next(err);

    var payload = {
      sequenceToken: sequenceToken,
      logGroupName: self.logGroupName,
      logStreamName: self.logStreamName,
      logEvents: self.logEvents.splice(0, 10)
    };

    self.cloudwatchlogs.putLogEvents(payload, next);
  });
}

module.exports.prototype.add = function(log) {
  this.logEvents.push({
    message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()
  });
};

function token(cloudwatchlogs, logGroupName, logStreamName, cb) {
  cloudwatchlogs.describeLogStreams({
    logGroupName: logGroupName
  }, function(err, data) {
    if (err) return cb(err);
    var logStream = _.find(data.logStreams, function(logStream) {
      return logStream.logStreamName === logStreamName;
    });
    cb(err, logStream.uploadSequenceToken);
  });
};