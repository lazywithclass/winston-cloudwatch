### 2.0.8

updated TS definitions

### 2.0.7

updated TS definitions

### 2.0.6

updated TS definitions

### 2.0.5

updated TS definitions

### 2.0.4

updated TS definitions

### 2.0.3

stringify supports circular references

### 2.0.2

New version just because I forgot to add silent property to TS definition

### 2.0.1

Remove unused variables; example on how to use messageFormatter

### 2.0.0

Update to Winston 3.0. Update dependencies.
(thanks to @nfantone and @patrickrgaffney for the precious help)

### 1.13.1

Fix TypeScript type https://github.com/lazywithclass/winston-cloudwatch/issues/79

### 1.13.0

Save nextSequenceToken and reuse it for calls to AWS

### 1.12.0

Added ability to specify a retention policy

### 1.11.4

Correctly stringifies Error objects preserving stuff like the message and the stack

Fixes https://github.com/lazywithclass/winston-cloudwatch/issues/54

### 1.11.3

Fixes https://github.com/lazywithclass/winston-cloudwatch/issues/55

### 1.11.2

Increased coverage

### 1.11.1

Fixed a silly bug due to having left `self` instead of `this`

### 1.11.0

Making sure that we don't try to send empty logs (again), added a simulation tool
so that we could easily test error conditions, retrying to submit if we get an
error, retrying with another token if we get an InvalidSequenceTokenException

### 1.10.0

Added TypeScript definitions

### 1.9.0

Added kthxbye, to allow the user to stop setInterval and flush the logs

### 1.8.0

Not sending logs or meta information if they are emtpy

### 1.7.0

Added ability to use functions in config for groupname and streamname

### 1.6.0

Send logs immediately in case we are dealing with an uncaught exception handled
by Winston

### 1.5.1

Updated dependencies and small code refactoring

### 1.5.0

Fixes a bug when under heavy load and and adds batching and truncating features
(thanks @npahucki)

### 1.4.0

accepts `awsOptions` in the constructor and configures AWS accordingly

### 1.3.2

using `logStreamNamePrefix` in `getStream`

### 1.3.1

added `npm run update-dependencies` to automatically update all deps in 
package.json and node_modules

### 1.3.0

Added messageFormatter to format the log

### 1.2.0

Added error handler

### 1.1.0

Fixed typo in jsonMessage. Introduced testing for index.js

### 1.0.1

Update dependencies

### 1.0.0

Almost a complete rewrite. Not compatible with previous versions.
It's now possible to log to multiple streams and to have different
log levels.
100% test covered the lib layer.

### 0.10.0

Added support for proxy

### 0.9.0

Updated dependencies

### 0.8.0

Group or stream are created if they are not found

### 0.7.0

Support Winston 2.0

### 0.6.1

Dealing with a bug that prevented to push logs

### 0.6.0

Added paging to `describeLogStreams`

### 0.5.0

Added `jsonMessage` in options for when you want to send the log object as JSON 
formatted string

### 0.4.0

Introduced winston as peer dependency

### 0.3.1

Fixed region config to allow SDK to pull from IAM role when running on EC2

### 0.3.0

Increase `logEvents` batch upload to 20 items

### 0.2.5

Construct the AWS object, don't update it.

### 0.2.3

Updated winston.

### 0.2.2

Updated dependencies.

### 0.2.1

Checking if logs are empty before splicing them.
Logging if getting an error while fetching the token from AWS.

### 0.2.0

Added a `setInterval` around the uploading function, to avoiding flooding AWS 
and thus getting rejected.

### 0.1.2

Work around to the AWS time limit for sending events.

### 0.1.1

First release
