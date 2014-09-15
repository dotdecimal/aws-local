/*
 * AWS Local EC2 - Resource
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var Promise = require('bluebird');
var xml2js = require('xml2js');
var builder = new xml2js.Builder();
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var _ = require('lodash');

Promise.promisifyAll(fs);

/**
 * Tags the given resources with the provided keys
 *
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the handle to the
 *    operation request for subsequent event callback registration
 */
function CreateTags(root, params, res) {
    // Extract resource ids from params
    var resourceIds = _.filter(_.keys(params), function(key) {
        return key.indexOf('ResourceId') > -1;
    });
    // Extract tag data and construct tag array
    var tagData = _.map(_.filter(_.keys(params), function(key) {
        return key.indexOf('Tag') > -1;
    }), function(tag) {
        var data = tag.split('.');
        return {
            num: parseInt(data[1]) - 1,
            type: data[2],
            value: params[tag]
        };
    });
    var tags = [];
    for (var i = 0; i < tagData.length; ++i) {
        if (!tags[tagData[i].num]) {
            tags[tagData[i].num] = {};
        }
        tags[tagData[i].num][tagData[i].type] = tagData[i].value;
    }

    // Store tags in their respective files
    var files = [];
    for (var id in resourceIds) {
        files.push(path.join(root, 'ec2', 'resources', id));
    }

    // Create a respose object that will be converted to xml later
    var responseObj = {
        CreateTagsResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            'return': true
        }
    };

    return Promise.resolve(files).map(function(filename) {
        return fs.readFileAsync(filename).then(JSON.parse).catch(function() {
            // The data that is stored, i.e. the data we want to remember
            return {
                requestId: responseObj.CreateTagsResponse.requestId,
                tags: {}
            };
        }).then(function(store) {
            var currentTags = store.tags;
            for (var i = 0; i < tags.length; ++i) {
                currentTags[tags[i].Key] = tags[i].Value || null;
            }

            // Write the file to local storage, creates directories if missing
            return fs.writeFileAsync(filename, JSON.stringify(store)).catch( /* istanbul ignore next */ function() {
                return fs.mkdirAsync(path.join(root, 'ec2', 'resources')).catch(function() {
                    return fs.mkdirAsync(path.join(root, 'ec2')).then(function() {
                        return fs.mkdirAsync(path.join(root, 'ec2', 'resources'));
                    }).then(function() {
                        return fs.writeFileAsync(filename, JSON.stringify(storeObj));
                    });
                });
            });
        });
    }).then(function() {
        // Convert the response from a javascript object to xml
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    });
}
exports.CreateTags = CreateTags;