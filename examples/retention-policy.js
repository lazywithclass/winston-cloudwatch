var winston = require('winston'),
    WinstonCloudWatch = require('../index');


// when you don't provide a name the default one
// is CloudWatch
winston.add(new WinstonCloudWatch({
  logGroupName: 'testing',
  logStreamName: 'another',
  awsRegion: 'us-east-1',
  retentionInDays: 14
}))

winston.error('1');
