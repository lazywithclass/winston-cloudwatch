var winston = require('winston'),
  options = {
    logGroupName: 'testing',
    logStreamName: 'testing',
    awsAccessKeyId: 'your-access-key-id',
    awsSecretKey: 'your-secret-key'
  };
winston.add(require('winston-cloudwatch'), options);

winston.silly('log this 1', { and: 'this too 1' });
winston.debug('log this 2', { and: 'this too 2' });
winston.verbose('log this 3', { and: 'this too 3' });
winston.info('log this 4', { and: 'this too 4' });
winston.warn('log this 5', { and: 'this too 5' });
winston.error('log this 6', { and: 'this too 6' });
