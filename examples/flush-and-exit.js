var winston = require('winston'),
    WinstonCloudWatch = require('../index');

var self = winston.add(new WinstonCloudWatch({
  name: 'using-kthxbye',
  logGroupName: 'testing',
  logStreamName: 'another',
  awsRegion: 'us-east-1'
}));

winston.error('1');

// flushes the logs and clears setInterval
var transport = self.transports.find((t) => t.name === 'using-kthxbye')
transport.kthxbye(function() {
  console.log('bye');
});
