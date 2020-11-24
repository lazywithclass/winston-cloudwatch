var winston = require('winston'),
    WinstonCloudWatch = require('../index');

function format(message, ...rest) {
  // I am inventing a custom formatter
  return `
    ${message}
    ${rest.map(r => ` * ${r}`).join('\n')}
  `
}

function customFormatter({level, message, [Symbol.for('splat')]: args = []}) {
  return `${level} - ${format(message, ...args)}`;
}

var transport = winston.createLogger({
  exitOnError: false,
  transports: [
    new WinstonCloudWatch({
      logGroupName: 'testing',
      logStreamName: 'first',
      awsRegion: 'us-east-1',
    })],
  format: winston.format.printf(customFormatter)
});

transport.info('some text', {foo: 'bar'}, new Error('wtf'));
