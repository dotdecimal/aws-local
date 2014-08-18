/* Local Amazon Web Services Module
 *
 * Copyright (c) 2014 .decimal, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Promise = require('bluebird');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');

var Manager = require('./manager');

/**
 * Represents the main server class
 *
 * @constructor
 */
function Server(root) {
    var app = express();

    app.use(bodyParser.urlencoded({ extended: false }));

    this._manager = new Manager(app, root);

    this._http = http.createServer(app);
    this._http_port = 80;
    this._http_listen = Promise.promisify(this._http.listen, this._http);
    this._http_close = Promise.promisify(this._http.close, this._http);
}

/**
 * Begin accepting connections on the specified port.
 *
 * @param {number} http - The port to listen for http connections.
 * @returns {Promise} A promise indicating that the underlying server has begun listening on the
 *    given port.
 */
Server.prototype.listen = function(http) {
    this._http_port = http || /* istanbul ignore next: Noop */ this._http_port;
    return this._http_listen(this._http_port);
};

/**
 * Stops the server from accepting new connections and keeps existing connections.
 *
 * @returns {Promise} A promise indicating when the underlying server has successfully been closed.
 */
Server.prototype.close = function() {
    return this._http_close();
};

exports = module.exports = Server;