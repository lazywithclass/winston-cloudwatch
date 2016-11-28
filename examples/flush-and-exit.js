var winston = require('winston'),
    WinstonCloudWatch = require('../index');

var self = winston.add(WinstonCloudWatch, {
  logGroupName: 'testing',
  logStreamName: 'first'
});

winston.error('1');

// flushes the logs and clears setInterval
self.transports.CloudWatch.kthxbye(function() {
  console.log('bye');
});
