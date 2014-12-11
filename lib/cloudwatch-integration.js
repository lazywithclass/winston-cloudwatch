var AWS = require('aws-sdk'),
    cloudwatchlogs = new AWS.CloudWatchLogs(),
    _ = require('lodash');

var params = { logEvents: [] };

function token(cb) {
  cloudwatchlogs.describeLogStreams({
    logGroupName: params.logGroupName
  }, function(err, data) {
    if (err) return cb(err);
    var logStream = _.find(data.logStreams, function(logStream) {
      return logStream.logStreamName === params.logStreamName;
    });
    cb(err, logStream.uploadSequenceToken);
  });
}

module.exports.upload = function(log, conf, done) {
  params.logGroupName = conf.logGroupName;
  params.logStreamName = conf.logStreamName;
  
  token(function(err, sequenceToken) {
    params.sequenceToken = sequenceToken;
    params.logEvents.push({
      message: [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
      timestamp: new Date().getTime()      
    });
    cloudwatchlogs.putLogEvents(params, function(err, data) {
      if (err) return console.log(err, err.stack);
      done();
    });
  });
};
