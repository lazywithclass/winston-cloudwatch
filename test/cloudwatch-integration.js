describe('cloudwatch-integration', function() {

  var lib = require('../lib/cloudwatch-integration'),
      AWS = require('aws-sdk'),
      sinon = require('sinon'),
      awsMock = require('aws-sdk-mock');

  describe('init', function() {

    it('can configure a proxy', function() {
      var results = lib.init(
        'groupname',
        'streamName',
        'accesskey',
        'secretkey',
        'region',
        true,
        'http://test.com/',
        {}
      );
      var href = AWS.config.httpOptions.agent.proxy.href;
      href.should.equal('http://test.com/');
    });

    describe('configures CloudWatchLogs', function() {

      it('with access secret and region', function() {
        var cloudwatchlogs = lib.init(
          'groupname',
          'streamName',
          'accesskey',
          'secretkey',
          'region',
          true,
          'http://test.com/',
          {}
        )[0];
        var config = cloudwatchlogs.config;
        config.accessKeyId.should.equal('accesskey');
        config.secretAccessKey.should.equal('secretkey');
        config.region.should.equal('region');
      });

      it('with region', function() {
        var cloudwatchlogs = lib.init(
          'groupname',
          'streamName',
          null,
          null,
          'region',
          true,
          'http://test.com/',
          {}
        )[0];
        var config = cloudwatchlogs.config;
        config.region.should.equal('region');
      });

      it('with env variables', function() {
        process.env.AWS_ACCESS_KEY_ID = 'accesskey';
        process.env.AWS_SECRET_ACCESS_KEY = 'secretkey';
        process.env.AWS_REGION = 'region';

        var cloudwatchlogs = lib.init(
          'groupname',
          'streamName',
          null,
          null,
          null,
          true,
          null,
          {}
        )[0];
        var config = cloudwatchlogs.config;
        config.region.should.equal('region');
        // TODO for some reason accesskey and secretkey dont show up
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_REGION;
      });

    });

    it('keeps configuration defined per transport', function() {
      var transports = lib.init(
        'groupname',
        'streamName',
        'accesskey',
        'secretkey',
        'region',
        true,
        'http://test.com/',
        { name: 'lazy' }
      )[1];
      transports.lazy.should.eql({
        logEvents: [],
        logGroupName: 'groupname',
        logStreamName: 'streamName',
        messagesAsJSON: true,
        intervalId: null
      });
    });

  });

});
