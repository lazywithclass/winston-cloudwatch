var winston = require('winston'),
    WinstonCloudWatch = require('../index');


// when you don't provide a name the default one
// is CloudWatch
winston.add(WinstonCloudWatch, {
  logGroupName: 'testing',
  logStreamName: 'first'
});

var error = new Error('we are doooooomed!');
winston.error('error', error)
