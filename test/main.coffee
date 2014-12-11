# no node core in stack trace
require 'clarify'

should = require 'should'
sinon = require 'sinon'
winston = require 'winston'

describe 'testing', -> it 'works', -> (42).should.equal 42

sinon.stub winston, 'add'

describe 'plugin', ->

  lib = require '../index'
  plugin = require '../lib/cloudwatch-integration'
  
  beforeEach ->
    sinon.stub(plugin, 'upload').yields()

  afterEach ->
    plugin.upload.restore()
    
  it 'could be required', -> should.exist lib

  it 'inherits from Winston', ->
    cloudwatch = winston.add.args[0][0]
    cloudwatch.super_.should.equal winston.Transport

  it 'uploads logs to Cloudwatch', ->
    winston.add.restore()
    # refresh the module in cache so that we use
    # the correct winston.add
    name = require.resolve '../index'
    delete require.cache[name]
    require '../index'
    
    winston.info 'testing'
    plugin.upload.calledOnce.should.be.true
