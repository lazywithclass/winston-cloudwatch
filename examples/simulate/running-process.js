console.log(process.pid);

var winston = require('winston'),
    WinstonCloudWatch = require('../../index');

winston.transports.CloudWatch1 = WinstonCloudWatch;
winston.transports.CloudWatch2 = WinstonCloudWatch;

winston.loggers.add('category1', {
  CloudWatch1: {
    logGroupName: 'test',
    logStreamName: 'test'
  }
});
winston.loggers.add('category2', {
  CloudWatch2: {
    logGroupName: 'test',
    logStreamName: 'test'
  }
});

winston.loggers.get('category1').error(new Date());
winston.loggers.get('category2').error(new Date());

process.on('SIGUSR1', function() {
  winston.loggers.get('category1').error(new Date());
  winston.loggers.get('category2').error(new Date());
});

