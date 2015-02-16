var AWS = require('aws-sdk'),
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
  this.intervalId = undefined;
};

module.exports.prototype.add = function(log) {
  this.logEvents.push({
    message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()
  });

  var lastFree = new Date().getTime();
  var self = this;
  function upload() {
    if (new Date().getTime() - 2000 > lastFree) {
      token(self.cloudwatchlogs, self.logGroupName, self.logStreamName, function(err, sequenceToken) {
        if (err) {
          return console.log(err, err.stack);
        }

        if (self.logEvents.length <= 0) {
          return;
        }

        var payload = {
          sequenceToken: sequenceToken,
          logGroupName: self.logGroupName,
          logStreamName: self.logStreamName,
          logEvents: self.logEvents.splice(0, 10)
        };

        self.cloudwatchlogs.putLogEvents(payload, function(err, data) {
          if (err) return console.log(err, err.stack);
          lastFree = new Date().getTime();
        });
      });
    }
  }
  if (!this.intervalId) {
    this.intervalId = setInterval(upload, 1000);
  }
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