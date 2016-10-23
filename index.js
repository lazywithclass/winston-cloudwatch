'use strict';

var util = require('util'),
    winston = require('winston'),
    AWS = require('aws-sdk'),
    cloudWatchIntegration = require('./lib/cloudwatch-integration'),
    _ = require('lodash');


var WinstonCloudWatch = function(options) {
  winston.Transport.call(this, options);
  this.level = options.level || 'info';
  this.name = options.name || 'CloudWatch';
  this.logGroupName = options.logGroupName;
  this.logStreamName = options.logStreamName;
  var awsAccessKeyId = options.awsAccessKeyId;
  var awsSecretKey = options.awsSecretKey;
  var awsRegion = options.awsRegion;
  var messageFormatter = options.messageFormatter ? options.messageFormatter : function(log) {
    return [ log.level, log.msg, stringify(log.meta) ].join(' - ');
  };
  this.formatMessage = options.jsonMessage ? stringify : messageFormatter;
  var proxyServer = this.proxyServer = options.proxyServer;
  this.uploadRate = options.uploadRate || 2000;
  this.logEvents = [];
  this.errorHandler = options.errorHandler;

  if (this.proxyServer) {
    AWS.config.update({
      httpOptions: {
        agent: require('proxy-agent')(this.proxyServer)
      }
    });
  }

  var config = {};

  if (awsAccessKeyId && awsSecretKey && awsRegion) {
    config = { accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey, region: awsRegion };
  } else if (awsRegion && !awsAccessKeyId && !awsSecretKey) {
    // Amazon SDK will automatically pull access credentials
    // from IAM Role when running on EC2 but region still
    // needs to be configured
    config = { region: awsRegion };
  }

  if(options.awsOptions){
    config = _.assign(config, options.awsOptions);
  }

  this.cloudwatchlogs = new AWS.CloudWatchLogs(config);
};

util.inherits(WinstonCloudWatch, winston.Transport);

WinstonCloudWatch.prototype.log = function(level, msg, meta, callback) {
  var log = { level: level, msg: msg, meta: meta };
  this.add(log);

  if (!/^uncaughtException: /.test(msg)) {
    // do not wait, just return right away
    return callback(null, true);
  }

  // clear interval and send logs immediately
  // as Winston is about to end the process
  clearInterval(this.intervalId);
  this.intervalId = null;
  this.submit(callback);
};

WinstonCloudWatch.prototype.add = function(log) {
  var self = this;

  self.logEvents.push({
    message: self.formatMessage(log),
    timestamp: new Date().getTime()
  });

  if (!self.intervalId) {
    self.intervalId = setInterval(function() {
      self.submit(function(err) {
        if (err) {
          self.errorHandler ? self.errorHandler(err) : console.error(err);
        }
      });
    }, self.uploadRate);
  }
};

WinstonCloudWatch.prototype.submit = function(callback) {
  var self = this;

  cloudWatchIntegration.upload(
    self.cloudwatchlogs,
    self.logGroupName,
    self.logStreamName,
    self.logEvents,
    callback
  );
};

function stringify(o) { return JSON.stringify(o, null, '  '); }

module.exports = WinstonCloudWatch;
