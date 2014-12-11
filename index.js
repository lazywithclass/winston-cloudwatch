var util = require('util'),
    winston = require('winston'),
    cloudwatchIntegration = require('./lib/cloudwatch-integration');

var CloudWatch = winston.transports.CloudWatch = function(options) {
  this.name = 'CloudWatch';
  this.level = options.level || 'info';
  this.logGroupName = options.logGroupName || 'default-log-group-name';
  this.logStreamName = options.logStreamName || 'default-log-stream-name';
};

util.inherits(CloudWatch, winston.Transport);

CloudWatch.prototype.log = function(level, msg, meta, callback) {

  var log = { level: level, msg: msg, meta: meta };
  var conf = { logGroupName: this.logGroupName, logStreamName: this.logStreamName };
  
  cloudwatchIntegration.upload(log, conf, function() {
    callback(null, true);
  });
};

module.exports = CloudWatch;
