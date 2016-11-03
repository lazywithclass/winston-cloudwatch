var winston = require('winston');
    WinstonCloudwatch = require('../index'),
    crypto = require('crypto');

// Give ourselves a randomized (time-based) hash to append to our stream name
// so multiple instances of the server running don't log to the same
// date-separated stream.
var startTime = new Date().toISOString();

winston.loggers.add('access-log', {
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true,
      level: 'info'
    }),
    new WinstonCloudwatch({
      logGroupName: 'app-name',
      logStreamName: function() {
        // Spread log streams across dates as the server stays up
        let date = new Date().toISOString().split('T')[0];
        return 'express-server-' + date + '-' +
          crypto.createHash('md5')
          .update(startTime)
          .digest('hex');
      },
      awsRegion: 'us-west-2',
      jsonMessage: true
    })
  ]
});
var logg = winston.loggers.get('access-log');

logg.info('This is a test');
