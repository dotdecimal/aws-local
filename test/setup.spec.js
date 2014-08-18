/*
 * AWSLocal Test Setup
 *
 * Author(s):  Salvadore Gerace <sgerace@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var path = require('path');

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Before

before(function() {

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // AWS Local

    var AWSLocal = require('../lib/server');
    global.awsLocal = new AWSLocal(path.resolve('../test_root'));

    return awsLocal.listen(4242);
});

after(function() {
    return awsLocal.close();
});