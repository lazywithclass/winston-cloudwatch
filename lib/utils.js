var chalk = require('chalk');

function stringify(o) { return JSON.stringify(o, null, '  '); }

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
