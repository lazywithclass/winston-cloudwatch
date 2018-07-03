var winston = require('winston'),
    WinstonCloudWatch = require('../index');


const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      name: 'first-stream',
      logGroupName: 'testing',
      logStreamName: 'first',
      awsRegion: 'us-east-1'
    }),
    new WinstonCloudWatch({
      name: 'second-stream',
      logGroupName: 'testing',
      logStreamName: 'second',
      awsRegion: 'us-east-1'
    })
  ]
});

// both logs will be logged to both streams
logger.error('something')
logger.error('happened')

const singleLogger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      name: 'first-stream',
      logGroupName: 'testing',
      logStreamName: 'first',
      awsRegion: 'us-east-1'
    })
  ]
});

singleLogger.error('only on the first')