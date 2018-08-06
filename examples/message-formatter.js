var winston = require('winston'),
    WinstonCloudWatch = require('../index');

winston.add(new WinstonCloudWatch({
  messageFormatter: function() {
    return 'will always log this text'
  },
  logGroupName: 'testing',
  logStreamName: 'first',
  awsRegion: 'us-east-1'
}));

winston.error('this will be always overwritten');
