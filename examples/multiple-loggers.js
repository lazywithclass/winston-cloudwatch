var winston = require('winston'),
    WinstonCloudWatch = require('../index');


winston.transports.CloudWatch1 = WinstonCloudWatch;
winston.transports.CloudWatch2 = WinstonCloudWatch;

winston.loggers.add('category1', {
  // note that this is the same property name
  // that we've added to winston.transports
  CloudWatch1: {
    logGroupName: 'testing',
    logStreamName: 'first'
  }
});
winston.loggers.add('category2', {
  // note that this is the same property name
  // that we've added to winston.transports
  CloudWatch2: {
    logGroupName: 'testing',
    logStreamName: 'second'
  }
});

winston.loggers.get('category1').error('1');
winston.loggers.get('category2').error('2');
