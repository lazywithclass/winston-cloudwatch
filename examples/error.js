var winston = require('winston'),
    WinstonCloudWatch = require('../index')


// when you don't provide a name the default one
// is CloudWatch
winston.add(new WinstonCloudWatch({
  logGroupName: 'testing',
  logStreamName: 'another',
  awsRegion: 'us-east-1'
}))

var error = new Error('are we doooooomed?')
winston.error({ message: error })

// or also

var error = new Error('definitely.')
winston.error(error)