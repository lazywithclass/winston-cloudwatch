var winston = require('winston');

// aws keys are optional
winston.add(require('../index'), {
  logGroupName: 'test',
  logStreamName: '1',
  awsRegion: 'us-east-1'
});
winston.error('error', { testing: 1 });

// changing the name allows for more transports
winston.add(require('../index'), {
  logGroupName: 'test',
  logStreamName: '2',
  awsRegion: 'us-east-1',
  name: 'CloudWatch2'
});
winston.error('error', {
  testing: 2
}, {
  customLoggerName: 'CloudWatch2'
});
