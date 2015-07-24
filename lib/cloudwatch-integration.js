var AWS = require('aws-sdk'),
    cloudwatchlogs,
    _ = require('lodash'),
    logEvents = [],
    logGroupName = '',
    logStreamName = '',
    messageAsJSON,
    intervalId;

module.exports.init = function(awsLogGroupName, awsLogStreamName, awsAccessKeyId, awsSecretKey, awsRegion, jsonMessage) {
  if (awsAccessKeyId && awsSecretKey && awsRegion) {
    cloudwatchlogs = new AWS.CloudWatchLogs({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey, region: awsRegion});
  } else {
    cloudwatchlogs = new AWS.CloudWatchLogs();
  }
  logGroupName = awsLogGroupName;
  logStreamName = awsLogStreamName;
  messageAsJSON = jsonMessage;
};

module.exports.add = function(log) {
  logEvents.push({
    //message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    message: messageAsJSON ? JSON.stringify(log, null, '  ') : [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()      
  });
  
  var lastFree = new Date().getTime();
  function upload() {
    if (new Date().getTime() - 2000 > lastFree) {
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
          lastFree = new Date().getTime();
        });
      });
    }    
  }
  if (!intervalId) {
    intervalId = setInterval(upload, 1000);
  }
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
