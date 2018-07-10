var winston = require('winston'),
    WinstonCloudWatch = require('../index');


// when you don't provide a name the default one
// is CloudWatch
winston.add(new WinstonCloudWatch({
  awsRegion: 'eu-west-1',
  awsOptions: {
    logStreamName: 'us-east-1'
  },
  logGroupName: 'testing',
  logStreamName: 'first'
}));

winston.error('1');
