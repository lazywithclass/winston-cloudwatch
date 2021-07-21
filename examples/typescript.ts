/// <reference path="../typescript/winston-cloudwatch.d.ts" />

import WinstonCloudwatch from "../typescript/winston-cloudwatch"

const winston = require('winston'),
    WinstonCloudWatch = require('../index')

const me = winston.add(new WinstonCloudwatch({
  name: 'using-kthxbye',
  logGroupName: 'testing',
  logStreamName: 'another',
  awsRegion: 'us-east-1'
}))

winston.error('1')

// flushes the logs and clears setInterval
let transport = me.transports.find(t => t.name === 'using-kthxbye')
transport.kthxbye(() => console.log('bye'))
