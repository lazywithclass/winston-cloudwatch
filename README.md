# winston-cloudwatch [v1.10.0](https://github.com/lazywithclass/winston-cloudwatch/blob/master/CHANGELOG.md#1100)

[![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) [![Coverage Status](https://coveralls.io/repos/github/lazywithclass/winston-cloudwatch/badge.svg?branch=master)](https://coveralls.io/github/lazywithclass/winston-cloudwatch?branch=master) [![Dependency Status](https://david-dm.org/lazywithclass/winston-cloudwatch.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch) [![dev dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/dev-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=devDependencies) [![peer dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/peer-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=peerDependencies)
==================

Send logs to Amazon Cloudwatch using Winston.

 * [Features](#features)
 * [Installing](#installing)
 * [Configuring](#configuring)
 * [Usage](#usage)
 * [Options](#options)
 * [Examples](#examples)
 * [Simulation](#simulation)

### Features

 * logging to AWS CloudWatchLogs
 * logging to multiple streams
 * logging with multiple levels
 * creates group / stream if they don't exist
 * doesn't try to buffer your unsent logs (you should use more streams)
 * waits for an upload to suceed before trying the next
 * truncates messages that are too big
 * batches messages taking care of the AWS limit
 * support for Winston's uncaught exception handler
 * support for TypeScript, see https://github.com/lazywithclass/winston-cloudwatch/blob/master/typescript/winston-cloudwatch.d.ts
 * [see options for more](#options)

### Installing

```sh
$ npm install --save winston winston-cloudwatch
```

### Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

As specified [in the docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_the_Region):

 > The AWS SDK for Node.js doesn't select the region by default.

so you should take care of that. See the examples below.

If either the group or the stream do not exist they will be created for you.

For displaying time in AWS CloudWatch UI you should click on the gear in the top right corner in the page with your logs and enable checkbox "Creation Time".

### Usage

Please refer to [AWS CloudWatch Logs documentation](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) for possible contraints that might affect you.
Also have a look at [AWS CloudWatch Logs limits](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_limits.html).

```js
var winston = require('winston'),
    WinstonCloudWatch = require('../index');

winston.add(WinstonCloudWatch, {
  logGroupName: 'testing',
  logStreamName: 'first'
});

winston.error('1');
```

You could also log to multiple streams with / without different log levels, have a look at [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/multiple-loggers.js).

You can also specify a function for the `logGroupName` and `logStreamName` options. This is handy if you are using this module in a server, say with [express](https://github.com/bithavoc/express-winston), as it enables you to easily split streams across dates, for example. There is an example of this [here](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/function-config.js).

You could also have winston-cloudwatch to flush and stop the setInterval loop (thus exiting), have a look
at [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/flush-and-exit.js).

### Options

This is the list of options you could pass as argument to `winston.add`:

 * level - defaults to `info`
 * logGroupName - `string` or `function`
 * logStreamName - `string` or `function`
 * awsAccessKeyId
 * awsSecretKey
 * awsRegion
 * awsOptions - `object`, params as per [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatchLogs.html#constructor-property), values in `awsOptions` are overridden by any other if specified, run [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/simple-with-aws-options.js) to have a look
 * jsonMessage - `boolean`, format the message as JSON
 * messageFormatter - `function`, format the message the way you like. This function will receive a `log` object that has the following properties: `level`, `msg`, and `meta`, which are passed by winston to the `log` function (see [CustomLogger.prototype.log as an example](https://github.com/winstonjs/winston#adding-custom-transports))
 * proxyServer - `String`, use `proxyServer` as proxy in httpOptions
 * uploadRate - `Number`, how often logs have to be sent to AWS. Be careful of not hitting [AWS CloudWatch Logs limits](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_limits.html), the default is 2000ms.
 * errorHandler - `function`, invoked with an error object, if not provided the error is sent to `console.error`

AWS keys are usually picked by aws-sdk so you don't have to specify them, I provided the option just in case. Remember that `awsRegion` should still be set if you're using IAM roles.

### Examples

Please refer to [the provided examples](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples) for more hints.

Note that when running the examples the process will not exit because of the [`setInterval`](https://github.com/lazywithclass/winston-cloudwatch/blob/master/index.js#L73)

### Simulation

You could simulate how winston-cloudwatch runs by using the files in 
`examples/simulate`:

 * `running-process.js` represents a winston-cloudwatch process that sits there,
 sends a couple logs then waits for a signal to send more
 * `log.sh` is a script that you could run to send logs to the above
 
At this point you could for example run `log.sh` in a tight loop, like so

```bash
$ while true; do ./examples/simulate/log.sh $PID; sleep 0.2; done
```

and see what happens in the library, this might be useful to test if you need
more streams for example, all you need to do is change `running-process.js` to
better reflect your needs.

If you want more detailed information you could do

```bash
$ WINSTON_CLOUDWATCH_DEBUG=true node examples/simulate/running-process.js
```

which will print lots of debug statements as you might've guessed.
