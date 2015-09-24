var util = require('util'),
    winston = require('winston'),
    cloudwatchIntegration = require('./lib/cloudwatch-integration');

var CloudWatch = winston.transports.CloudWatch = function(options) {
  this.name = 'CloudWatch';
  this.level = options.level || 'info';

  cloudwatchIntegration.init(options.logGroupName, options.logStreamName,
                             options.awsAccessKeyId, options.awsSecretKey, options.awsRegion, options.jsonMessage);
};

util.inherits(CloudWatch, winston.Transport);

CloudWatch.prototype.log = function(level, msg, meta, callback) {
  var log = { level: level, msg: msg, meta: meta };
  cloudwatchIntegration.add(log);

  // do not wait, just return right away
  callback(null, true);
};

module.exports = CloudWatch;
