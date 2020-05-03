const winston = require('winston'),
      Transport = require('winston-transport'),
      AWS = require('aws-sdk'),
      { LEVEL, MESSAGE } = require('triple-beam'),
      cloudWatchIntegration = require('./lib/cloudwatch-integration'),
      isEmpty = require('lodash.isempty'),
      assign = require('lodash.assign'),
      isError = require('lodash.iserror'),
      stringify = require('./lib/utils').stringify,
      debug = require('./lib/utils').debug

const defaultFlushTimeoutMs = 10000


module.exports = class WinstonCloudwatch extends Transport {
  constructor(opts) {
    super(opts)
    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail, 
    //   logentries, etc.).
    //

    this.setOptions(opts)
    debug('constructor finished')
  }

  log(info, callback) {
    debug('log (called by winston)', info);
    
    // setImmediate(() => {
    //   this.emit('logged', info)
    // })

    if (!isEmpty(info.message) || isError(info.message)) { 
      this.add(info);
    }

    if (!/^uncaughtException: /.test(info.message)) {
      // do not wait, just return right away
      return callback(null, true);
    }

    debug('message not empty, proceeding')

    // clear interval and send logs immediately
    // as Winston is about to end the process
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.submit(callback);

    // Perform the writing to the remote service
    callback()
  }

  add(log) {
    debug('add log to queue', log);

    if (!isEmpty(log.message) || isError(log.message)) {
      this.logEvents.push({
        message: this.formatMessage(log),
        timestamp: new Date().getTime()
      });
    }

    if (!this.intervalId) {
      debug('creating interval');
      this.intervalId = setInterval(() => {
        this.submit((err) => {
          if (err) {
            debug('error during submit', err, true);
            this.errorHandler ? this.errorHandler(err) : console.error(err);
          }
        });
      }, this.uploadRate);
    }
  }

  submit(callback) {
    var groupName = typeof this.logGroupName === 'function' ?
        this.logGroupName() : this.logGroupName
    var streamName = typeof this.logStreamName === 'function' ?
        this.logStreamName() : this.logStreamName
    var retentionInDays = this.retentionInDays

    if (isEmpty(this.logEvents)) {
      return callback()
    }

    cloudWatchIntegration.upload(
      this.cloudwatchlogs,
      groupName,
      streamName,
      this.logEvents,
      retentionInDays,
      callback
    )
  }

  kthxbye(callback) {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.flushTimeout = this.flushTimeout || (Date.now() + defaultFlushTimeoutMs);

    this.submit(((error) => {    
      if (error) return callback(error);
      if (isEmpty(this.logEvents)) return callback();
      if (Date.now() > this.flushTimeout) return callback(new Error('Timeout reached while waiting for logs to submit'));
      else setTimeout(this.kthxbye.bind(this, callback), 0);
    }));
  }

  setOptions(options) {
    this.level = options.level || 'info';
    this.name = options.name || 'CloudWatch';
    this.logGroupName = options.logGroupName;
    this.retentionInDays = options.retentionInDays || 0;
    this.logStreamName = options.logStreamName;

    var awsAccessKeyId = options.awsAccessKeyId;
    var awsSecretKey = options.awsSecretKey;
    var awsRegion = options.awsRegion;
    var messageFormatter = options.messageFormatter ?
        options.messageFormatter : (log) => log[MESSAGE]
    this.formatMessage = options.jsonMessage ? stringify : messageFormatter;
    this.proxyServer = options.proxyServer;
    this.uploadRate = options.uploadRate || 2000;
    this.logEvents = [];
    this.errorHandler = options.errorHandler;

    if (options.cloudWatchLogs) {
      this.cloudwatchlogs = options.cloudWatchLogs;
    } else {
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

      if (options.awsOptions) {
        config = assign(config, options.awsOptions);
      }

      this.cloudwatchlogs = new AWS.CloudWatchLogs(config);
    }
  }
}
