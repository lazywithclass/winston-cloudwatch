var winston = require('winston'),
    // aws keys are optional
    options = {
      logGroupName: 'testing',
      logStreamName: 'testing',
      awsAccessKeyId: 'your-access-key-id',
      awsSecretKey: 'your-secret-key'
    };
winston.add(require('../index'), options);

winston.silly('silly', { and: 'this too 1' });
winston.debug('debug', { and: 'this too 2' });
winston.verbose('verbose', { and: 'this too 3' });
winston.info('info', { and: 'this too 4' });
winston.warn('warn', { and: 'this too 5' });
winston.error('error', { and: 'this too 6' });
