/*
 * AWS Local EC2 - KeyPair
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

Promise.promisifyAll(fs);

/**
 * Creates a key pair with the given keypair name
 * 
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the KeyName, KeyFingerprint,
 *    and KeyMaterial
 */
function CreateKeyPair(root, params, res) {
    // Create a respose object that will be converted to xml later
    var responseObj = {
        CreateKeyPairResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            keyName: params.KeyName,
            keyFingerprint: 'AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA',
            keyMaterial: '-----BEGIN RSA PRIVATE KEY-----\nSampleRSAPrimvateKey\n-----END RSA PRIVATE KEY-----'
        }
    };
    // Store the information for this keypair in the <root>/ec2/keypairs directory
    var filename = path.join(root, 'ec2', 'keypairs', params.KeyName);
    // The data that is stored, i.e. the data we want to remember
    var storeObj = {
        keyName: responseObj.CreateKeyPairResponse.keyName,
        keyFingerprint: responseObj.CreateKeyPairResponse.keyFingerprint
    };
    return Promise.bind({}).then(function() {
        // Write the file to local storage, creates directories if missing
        return fs.writeFileAsync(filename, JSON.stringify(storeObj)).catch(/* istanbul ignore next */ function() {
            return fs.mkdirAsync(path.join(root, 'ec2', 'keypairs')).catch(function() {
                return fs.mkdirAsync(path.join(root, 'ec2')).then(function() {
                    return fs.mkdirAsync(path.join(root, 'ec2', 'keypairs'));
                }).then(function() {
                    return fs.writeFileAsync(filename, JSON.stringify(storeObj));
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
exports.CreateKeyPair = CreateKeyPair;