var util = require('util'),
    winston = require('winston'),
    cloudwatchIntegration = require('./lib/cloudwatch-integration');

var CloudWatch = winston.transports.CloudWatch = function(options) {
  this.name = 'CloudWatch';
  this.level = options.level || 'info';
  this.handleExceptions = options.handleExceptions || false;

  this.cw = cloudwatchIntegration.init(options.logGroupName, options.logStreamName,
                             options.awsAccessKeyId, options.awsSecretKey, options.awsRegion);
};

util.inherits(CloudWatch, winston.Transport);

Cloudwatch.prototype.log = function(level, msg, meta, callback) {
  var log = { level: level, msg: msg, meta: meta };
  this.cw.add(log);

  // do not wait, just return right away
  callback(null, true);
}

module.exports = CloudWatch;
