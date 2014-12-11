var util = require('util'),
    winston = require('winston'),
    cloudwatchIntegration = require('./lib/cloudwatch-integration'),
    suppressLogs = process.env.SUPPRESS_LOGS && true;

var CloudWatch = winston.transports.CloudWatch = function(options) {
  this.name = 'CloudWatch';
  this.level = options.level || 'info';
};

util.inherits(CloudWatch, winston.Transport);

CloudWatch.prototype.log = function(level, msg, meta, callback) {
  cloudwatchIntegration.upload({
     level: level,
     msg: msg,
     meta: meta
  }, function() {
    callback(null, true);
  });
};

module.exports = CloudWatch;
