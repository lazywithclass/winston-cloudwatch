var sinon = require('sinon'),
    should = require('should'),
    mockery = require('mockery');


// the following does not, and should not, mock winston,
// to actually test the transport
describe.only('Transport', function() {

  var winston = require('winston'),
      WinstonCloudWatch = require('../index.js'),
      clock = sinon.useFakeTimers(),
      Transport = require('winston-transport'),
      transport;

  it('should derive from Winston transport', function() {
    transport = new WinstonCloudWatch({});
    transport.should.be.an.instanceOf(Transport)
  });
});

describe('index', function() {

  // TODO check that the API is still this one
  var stubbedWinston = {
    transports: {},
    Transport: function() {}
  };
  var stubbedAWS = {
    CloudWatchLogs: function(options) {
      this.fakeOptions = options;
    },
    config: {
      update: sinon.stub()
    }
  };
  var stubbedCloudwatchIntegration = {
    upload: sinon.spy(function(aws, groupName, streamName, logEvents, retention, cb) {
      this.lastLoggedEvents = logEvents.splice(0, 20);
      cb();
    })
  };
  var clock = sinon.useFakeTimers();

  var WinstonCloudWatch;

  before(function() {
    mockery.enable({
      warnOnReplace: false
    });
    mockery.registerAllowable('util');
    mockery.registerAllowable('lodash.find');
    mockery.registerAllowable('lodash.assign');
    mockery.registerAllowable('lodash.isempty');
    mockery.registerAllowable('lodash.iserror');
    mockery.registerAllowable('./lib/utils');

    mockery.registerMock('proxy-agent', function() { return 'fake' });
    mockery.registerMock('winston', stubbedWinston);
    mockery.registerMock('aws-sdk', stubbedAWS);
    mockery.registerMock('./lib/cloudwatch-integration', stubbedCloudwatchIntegration);

    mockery.registerAllowable('../index.js');
    WinstonCloudWatch = require('../index.js');
  });

  after(function() {
    mockery.deregisterAll();
    mockery.disable();
    clock.restore();
  });

  describe('construtor', function() {

    it('allows cloudWatchLogs', function() {
      var options = {
        cloudWatchLogs: { fakeOptions: { region: 'us-west-2' }}
      };
      var transport = new WinstonCloudWatch(options);
      transport.cloudwatchlogs.fakeOptions.region.should.equal('us-west-2');
    });

    it('allows awsOptions', function() {
      var options = {
        awsOptions: {
          region: 'us-east-1'
        }
      };
      var transport = new WinstonCloudWatch(options);
      transport.cloudwatchlogs.fakeOptions.region.should.equal('us-east-1');
    });

    it('merges awsOptions into existing ones', function() {
      var options = {
        region: 'eu-west-1',
        awsOptions: {
          region: 'us-east-1'
        }
      };
      var transport = new WinstonCloudWatch(options);
      transport.cloudwatchlogs.fakeOptions.region.should.equal('us-east-1');
    });

    it('configures httpOptions if a proxyServer has been defined', function() {
      var options = {
        awsOptions: {
          region: 'us-east-1'
        },
        proxyServer: 'http://test.com'
      };
      var transport = new WinstonCloudWatch(options);
      stubbedAWS.config.update.calledOnce.should.equal(true);
      stubbedAWS.config.update.args[0][0].httpOptions.agent.should.equal('fake');
    });

  });

  describe('log', function() {

    var transport;

    beforeEach(function(done) {
      transport = new WinstonCloudWatch({});
      transport.log({ level: 'level' }, function() {
        clock.tick(2000);
        done();
      });
    });

    it('does not upload if empty message', function(done) {
      stubbedCloudwatchIntegration.upload.called.should.equal(false);
      done();
    });

    it('flushes logs and exits in case of an exception', function(done) {
      transport = new WinstonCloudWatch({});
      transport.log({ message: 'uncaughtException: ' }, function() {
        clock.tick(2000);
        should.not.exist(transport.intervalId);
        // if done is called it means submit(callback) has been called
        done();
      });

    });

    describe('as json', function() {

      var transport;
      var options = {
        jsonMessage: true
      };

      before(function(done) {
        transport = new WinstonCloudWatch(options);
        transport.log({ level: 'level', message: 'message', something: 'else' }, 
          function() {
            clock.tick(2000);
            done();
          });
      });

      it('logs json', function() {
        var message = stubbedCloudwatchIntegration.lastLoggedEvents[0].message;
        var jsonMessage = JSON.parse(message);
        jsonMessage.level.should.equal('level');
	jsonMessage.message.should.equal('message');
	jsonMessage.something.should.equal('else');
      });
    });

    describe('as text', function() {

      var transport;

      describe('using the default formatter', function() {
        var options = {};
        before(function(done) {
          transport = new WinstonCloudWatch(options);
          transport.log({ level: 'level', message: 'message' }, done);
          clock.tick(2000);
        });

        it('logs text', function() {
          var message = stubbedCloudwatchIntegration.lastLoggedEvents[0].message;
          message.should.equal('level - message');
        });
      });

      describe('using a custom formatter', function() {

        var options = {
          messageFormatter: function(log) {
            return log.level + ' ' + log.message + ' ' + log.something; 
          }
        };

        before(function(done) {
          transport = new WinstonCloudWatch(options);
	  transport.log({ level: 'level', message: 'message', something: 'else' }, done);
          clock.tick(2000);
        });

        it('logs text', function() {
          var message = stubbedCloudwatchIntegration.lastLoggedEvents[0].message;
          message.should.equal('level message else');
        });
      });
    });

    describe('info object and a callback as arguments', function() {
      before(function(done) {
        transport = new WinstonCloudWatch({});
        transport.log({ level: 'level', message: 'message' }, function() {
          clock.tick(2000);
          done();
        });
      });

      it('logs text', function() {
        var message = stubbedCloudwatchIntegration.lastLoggedEvents[0].message;
        message.should.equal('level - message');
      });
    });

    describe('handles error', function() {

      beforeEach(function() {
        stubbedCloudwatchIntegration.upload = sinon.stub().yields('ERROR');
        mockery.registerMock('./lib/cloudwatch-integration', stubbedCloudwatchIntegration);
        sinon.stub(console, 'error');
      });

      afterEach(function() {
        stubbedCloudwatchIntegration.upload = sinon.spy();
        console.error.restore();
      });

      it('invoking errorHandler if provided', function() {
        var errorHandlerSpy = sinon.spy();
        var transport = new WinstonCloudWatch({
          errorHandler: errorHandlerSpy
        });
        transport.log({ level: 'level', message: 'message' }, sinon.stub());
        clock.tick(2000);
        errorHandlerSpy.args[0][0].should.equal('ERROR');
      });

      it('console.error if errorHandler is not provided', function() {
        var transport = new WinstonCloudWatch({});
        transport.log({ level: 'level', message: 'message' }, sinon.stub());
        clock.tick(2000);
        console.error.args[0][0].should.equal('ERROR');
      });

    });
  });

  describe('ktxhbye', function() {

    var transport;

    beforeEach(function() {
      sinon.stub(global, 'setInterval');
      sinon.stub(global, 'clearInterval');
      transport = new WinstonCloudWatch({});
      sinon.stub(transport, 'submit').callsFake(function(cb){
        this.logEvents.splice(0, 20);
        cb();
      });
    });

    afterEach(function() {
      global.setInterval.restore();
      global.clearInterval.restore();
      transport.submit.restore();
    });

    it('clears the interval', function(done) {
      transport.intervalId = 'fake';

      transport.kthxbye(function() {
        global.clearInterval.callCount.should.equal(1);
        should.not.exist(transport.intervalId);
        done();
      });
    });

    it('submit the logs', function(done) {
      transport.kthxbye(function() {
        transport.submit.callCount.should.equal(1);
        done();
      });
    });

    it('should not send all messages if called while posting', function(done) {
      for (var index = 0; index < 30; index++) {
        transport.add({ message: 'message' + index });
      }

      transport.kthxbye(function() {        
        transport.logEvents.length.should.equal(0);
        done();
      });

      clock.tick(1);
    });
    
    it('should exit if logs are not cleared by the timeout period', function(done) {            
      transport.add({ message: 'message' });
      transport.submit.callsFake(function(cb){
        clock.tick(500);
        cb(); // callback is called but logEvents is not cleared
      }); 

      transport.kthxbye(function(error) {
        error.should.be.Error();
        transport.logEvents.length.should.equal(1);
        done();
      });

      clock.tick(1);
    });
  });
});
