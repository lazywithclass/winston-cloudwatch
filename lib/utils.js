var chalk = require('chalk');
var safeStringify = require('fast-safe-stringify')

function handleErrorObject(key, value) {
  if (value instanceof Error) {
    return Object.getOwnPropertyNames(value).reduce(function(error, key) {
      error[key] = value[key]
      return error
    }, {})
  }
  return value
}

function stringify(o) { return safeStringify(o, handleErrorObject, '  '); }

function debug() {
  if (!process.env.WINSTON_CLOUDWATCH_DEBUG) return;
  var args = [].slice.call(arguments);
  var lastParam = args.pop();
  var color = chalk.red;
  if (lastParam !== true) {
    args.push(lastParam);
    color = chalk.green;
  }

  args[0] = color(args[0]);
  args.unshift(chalk.blue('DEBUG:'));
  console.log.apply(console, args);
}

module.exports = {
  stringify: stringify,
  debug: debug
};

