/*
 * AWS-Local Test Common Module
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var fs = require('fs');
var Promise = require('bluebird');
var path = require('path');

// Setup
var configFile = fs.readFileSync('config/test_aws.json');
var config = JSON.parse(configFile);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Chai

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

chai.should();
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.assert = chai.assert;


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Amazon Web Services SDK

var aws = require('aws-sdk');
aws.config.update(config.aws);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// EC2

global.ec2 = Promise.promisifyAll(new aws.EC2(config.ec2));
