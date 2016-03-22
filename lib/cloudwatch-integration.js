var AWS = require('aws-sdk'),
    cloudwatchlogs,
    _ = require('lodash'),
    transports = {};

module.exports.init = function(awsLogGroupName, awsLogStreamName, awsAccessKeyId, awsSecretKey, awsRegion, jsonMessage, proxyServer, self) {

  if (proxyServer) {
    AWS.config.update({
      httpOptions: {
        agent: require('proxy-agent')(proxyServer)
      }
    });
  }
  if (awsAccessKeyId && awsSecretKey && awsRegion) {
    cloudwatchlogs = new AWS.CloudWatchLogs({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey, region: awsRegion});
  } else if (awsRegion && !awsAccessKeyId && !awsSecretKey) {
    // Amazon SDK will automatically pull access credentials from IAM Role when running on EC2 but region still needs to be configured
    cloudwatchlogs = new AWS.CloudWatchLogs({region: awsRegion});
  } else {
    cloudwatchlogs = new AWS.CloudWatchLogs();
  }

  transports[self.name] = {
    logEvents: [],
    logGroupName: awsLogGroupName,
    logStreamName: awsLogStreamName,
    messagesAsJSON: jsonMessage,
    intervalId: null
  };

  // for testing
  return [cloudwatchlogs, transports];
};

/* istanbul ignore next */
module.exports.add = function(log) {
  var transport = transports[log.meta.customLoggerName || 'CloudWatch'],
      logEvents = transport.logEvents,
      messageAsJSON = transports.messagesAsJSON,
      logGroupName = transport.logGroupName,
      logStreamName = transport.logStreamName,
      intervalId = transport.intervalId;

  logEvents.push({
    message: messageAsJSON ? JSON.stringify(log, null, '  ') : [log.level, log.msg, JSON.stringify(log.meta, null, '  ')].join(' - '),
    timestamp: new Date().getTime()
  });

  var lastFree = new Date().getTime();
  function upload() {
    if (new Date().getTime() - 2000 > lastFree) {
      token(logGroupName, logStreamName, function(err, sequenceToken) {
        if (err) {
          return console.log(err, err.stack);
        }

        if (logEvents.length <= 0) {
          return;
        }

        var payload = {
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          logEvents: logEvents.splice(0, 20)
        };
        if (sequenceToken) payload.sequenceToken = sequenceToken;

        cloudwatchlogs.putLogEvents(payload, function(err, data) {
          if (err) return console.log(err, err.stack);
          lastFree = new Date().getTime();
        });
      });
    }
  }
  if (!intervalId) {
    intervalId = setInterval(upload, 1000);
    transport.intervalId = intervalId;
  }
};

/* istanbul ignore next */
function findLogStream(logGroupName, logStreamName, cb) {
  function next(token) {
    var params = {
      logStreamNamePrefix: logStreamName,
      logGroupName: logGroupName
    };
    cloudwatchlogs.describeLogStreams(params, function(err, data) {
      if (err) {
        if(err.code === 'ResourceNotFoundException'){
          return cloudwatchlogs.createLogGroup({logGroupName: logGroupName}, function(err) {
            findLogStream(logGroupName, logStreamName, cb);
          });
        }
        return cb(err);
      }

      var matches = _.find(data.logStreams, function(logStream) {
        return (logStream.logStreamName === logStreamName);
      });
      if (matches) {
        cb(null, matches);
      } else if (!data.nextToken) {
        cb(new Error('Stream not found'));
      } else {
        next(data.nextToken);
      }
    });
  }
  next();
}

/* istanbul ignore next */
function token(logGroupName, logStreamName, cb) {
  findLogStream(logGroupName, logStreamName, function(err, logStream) {
    if (err) {
      if(err.message === 'Stream not found'){
        cloudwatchlogs.createLogStream({
          logGroupName: logGroupName,
          logStreamName: logStreamName
        }, function(err, data){
          if(err) cb(err);
          else token(logGroupName, logStreamName, cb);
        });
      }
      return cb(err);
    }
    cb(null, logStream.uploadSequenceToken);
  });
}
