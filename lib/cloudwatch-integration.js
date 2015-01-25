var AWS = require('aws-sdk'),
    cloudwatchlogs = new AWS.CloudWatchLogs(),
    _ = require('lodash');

module.exports.initAws = function(awsAccessKeyId, awsSecretKey, awsRegion) {
  if (awsAccessKeyId && awsSecretKey && awsRegion) {
    AWS.config.update({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey});
    AWS.config.update({region: awsRegion});
  }
};

var lastSent = new Date().getTime();
var logEvent = {};
module.exports.upload = function(log, conf, done) {
  logEvent.logGroupName = conf.logGroupName;
  logEvent.logStreamName = conf.logStreamName;
  logEvent.logEvents = logEvent.logEvents || [];
  logEvent.logEvents.push({
    message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()      
  });
  
  if (new Date().getTime() < lastSent + 5000) {
    return;
  }
  
  token(conf.logGroupName, conf.logStreamName, function(err, sequenceToken) {
    logEvent.sequenceToken = sequenceToken;
    
    cloudwatchlogs.putLogEvents(logEvent, function(err, data) {
      if (err) return console.log(err, err.stack);
      
      lastSent = new Date().getTime();
      logEvent.logEvents = [];
      
      done();
    });
  });
};

function token(logGroupName, logStreamName, cb) {
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
