var winston = require('winston'),
    WinstonCloudWatch = require('../index');


// when you don't provide a name the default one
// is CloudWatch
winston.add(new WinstonCloudWatch({
  logGroupName: 'testing',
  logStreamName: 'first',
  awsRegion: 'us-east-1'
}));

winston.error('1');
