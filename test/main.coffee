# no node core in stack trace
require 'clarify'

util = require 'util'
should = require 'should'
sinon = require 'sinon'
winston = require 'winston'

describe 'testing', -> it 'works', -> (42).should.equal 42

describe 'plugin', ->

  lib = require '../index'
  plugin = require '../lib/cloudwatch-integration'
  
  beforeEach ->
    sinon.stub(plugin, 'upload').yields()

  afterEach ->
    plugin.upload.restore()
    
  it 'could be required', -> should.exist lib

  it 'inherits from Winston', ->
    lib.super_.should.equal winston.Transport

  it 'uploads logs to Cloudwatch', ->
    winston.add(lib, {});
    winston.info 'testing'
    plugin.upload.calledOnce.should.be.true
