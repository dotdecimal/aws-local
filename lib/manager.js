/* Local Amazon Web Services Module
 *
 * Copyright (c) 2014 .decimal, Inc.
 *
 * Description: Normalizes the requests and send back appropriate responses
 */

var fs = require('fs');
var xml2js = require('xml2js');
var builder = new xml2js.Builder();
var path = require('path');

var handlers = require('./handlers');

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Manager

/**
 * Represents the class for managing each request type (GET, PUT, POST, etc.)
 *
 * @constructor
 * @param {object} app - An express app
 * @param {string} root - The directory at which to place resource data
 */
function Manager(app, root) {
    var lookupFile = fs.readFileSync('./lib/lookup.json');
    var lookup = JSON.parse(lookupFile);
    app.post('/', handlers.post.handler(root, lookup));
}

exports = module.exports = Manager;