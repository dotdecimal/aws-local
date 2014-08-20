/*
 * AWS Local EC2 Local - KeyPair
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
 * @param {object} params - The parameters for the action
 * @returns {string} The XML encoded response giving the KeyName, KeyFingerprint,
 *    and KeyMaterial
 */
function CreateKeyPair(root, params, res) {
    var responseObj = {
        CreateKeyPairResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            keyName: params.KeyName,
            keyFingerprint: 'AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA',
            keyMaterial: '-----BEGIN RSA PRIVATE KEY-----\nSampleRSAPrimvateKey\n-----END RSA PRIVATE KEY-----'
        }
    };
    var filename = path.join(root, 'keypairs', params.KeyName);
    var storeObj = {
        keyName: responseObj.CreateKeyPairResponse.keyName,
        keyFingerprint: responseObj.CreateKeyPairResponse.keyFingerprint
    };
    return Promise.bind({}).then(function() {
        return fs.writeFileAsync(filename, JSON.stringify(storeObj)).catch(function() {
            return fs.mkdirAsync(path.join(root, 'keypairs'));
        });
    }).then(function() {
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    });
}
exports.CreateKeyPair = CreateKeyPair;