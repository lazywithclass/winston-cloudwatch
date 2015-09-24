### 0.6.0

Added paging to `describeLogStreams`

### 0.5.0

Added `jsonMessage` in options for when you want to send the log object as JSON formatted string

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

Added a `setInterval` around the uploading function, to avoiding flooding AWS and thus getting rejected.

### 0.1.2

Work around to the AWS time limit for sending events.

### 0.1.1

First release

