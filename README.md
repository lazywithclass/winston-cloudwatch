winston-cloudwatch
==================

Send logs to Amazon Cloudwatch using Winston.

## Installing

```sh
$ npm install --save winston winston-cloudwatch
```

## Configuring

AWS configuration works using `~/.aws/credentials` as written in the Amazon guide.

I still have to check if everything works ok with ENV variables.

## Usage

```js
var winston = require('winston'),
  options = {
    logGroupName: 'your-log-group',
    logStreamName: 'your-log-stream'
  };
winston.add(require('winston-cloudwatch'), options);

winston.error('log this', { and: 'this too' });
```
