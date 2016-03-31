var winston = require('winston'),
    WinstonCloudWatch = require('../index');


// when you don't provide a namethe default one
// is CloudWatch
winston.add(WinstonCloudWatch, {
  logGroupName: 'testing',
  logStreamName: 'first'
});

winston.error('1');
