/*
 * AWSLocal Test Setup
 *
 * Author(s):  Salvadore Gerace <sgerace@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');

Promise.promisifyAll(fs);

function removeDir(dir) {
    return fs.readdirAsync(dir).each(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            return removeDir(path.join(dir, file));
        } else {
            return fs.unlinkAsync(path.join(dir, file));
        }
    }).then(function() {
        return fs.rmdirAsync(dir);
    });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Before

before(function() {

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // AWS Local

    var AWSLocal = require('../lib/server');
    global.awsLocal = new AWSLocal(path.resolve('./test_root'));

    return fs.mkdirAsync(path.resolve('./test_root')).then(function() {
        return awsLocal.listen(4242);
    });
});

after(function() {
    return removeDir(path.resolve('./test_root')).then(function() {
        return awsLocal.close();
    });
});