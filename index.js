'use strict';

var util = require('util'),
    winston = require('winston'),
    AWS = require('aws-sdk'),
    cloudWatchIntegration = require('./lib/cloudwatch-integration');


class WinstonCloudWatch extends winston.Transport {

  constructor(options) {
    super(options);
    this.level = options.level || 'info';
    this.name = options.name || 'CloudWatch';
    this.logGroupName = options.logGroupName;
    this.logStreamName = options.logStreamName;
    var awsAccessKeyId = this.aswAccessKeyId = options.awsAccessKeyId;
    var awsSecretKey = this.aswSecretKey = options.awsSecretKey;
    var awsRegion = this.awsRegion = options.awsRegion;
    this.jsonMessage = options.jsonMessage;
    var proxyServer = this.proxyServer = options.proxyServer;
    this.uploadRate = options.uploadRate || 2000;
    this.logEvents = [];

    if (this.proxyServer) {
      AWS.config.update({
        httpOptions: {
          agent: require('proxy-agent')(this.proxyServer)
        }
      });
    }

    if (awsAccessKeyId && awsSecretKey && awsRegion) {
      this.cloudwatchlogs = new AWS.CloudWatchLogs({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretKey, region: awsRegion});
    } else if (awsRegion && !awsAccessKeyId && !awsSecretKey) {
      // Amazon SDK will automatically pull access credentials
      // from IAM Role when running on EC2 but region still
      // needs to be configured
      this.cloudwatchlogs = new AWS.CloudWatchLogs({region: awsRegion});
    } else {
      this.cloudwatchlogs = new AWS.CloudWatchLogs();
    }
  }

  log(level, msg, meta, callback) {
    var log = { level: level, msg: msg, meta: meta };
    this.add(log);

    // do not wait, just return right away
    callback(null, true);
  };

  add(log) {
    var self = this;

    self.logEvents.push({
      message: self.jsonMessage ?
        stringify(log) :
        [ log.level, log.msg, stringify(log.meta) ].join(' - '),
      timestamp: new Date().getTime()
    });

    if (!self.intervalId) {
      self.intervalId = setInterval(function() {
        cloudWatchIntegration.upload(
          self.cloudwatchlogs,
          self.logGroupName,
          self.logStreamName,
          self.logEvents,
          function(err) {
            if (err) return console.log(err, err.stack);
          });
      }, self.uploadRate);
    }
  };
}

function stringify(o) { return JSON.stringify(o, null, '  '); }

module.exports = WinstonCloudWatch;
