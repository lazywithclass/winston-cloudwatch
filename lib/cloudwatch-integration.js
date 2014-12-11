var AWS = require('aws-sdk'),
    cloudwatchlogs = new AWS.CloudWatchLogs(),
    _ = require('lodash');


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

module.exports.upload = function(log, conf, done) {
  
  token(conf.logGroupName, conf.logStreamName, function(err, sequenceToken) {
    var logEvent = {
      logGroupName: conf.logGroupName,
      logStreamName: conf.logStreamName,
      logEvents: [{
        message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
        timestamp: new Date().getTime()      
      }],
      sequenceToken: sequenceToken
    };
    cloudwatchlogs.putLogEvents(logEvent, function(err, data) {
      if (err) return console.log(err, err.stack);
      done();
    });
  });
};
