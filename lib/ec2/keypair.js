/*
 * AWS Local EC2 Local - KeyPair
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var xml2js = require('xml2js');
var builder = new xml2js.Builder();

/**
 * Creates a key pair with the given keypair name
 * 
 * @param {object} params - The parameters for the action
 * @returns {string} The XML encoded response giving the KeyName, KeyFingerprint,
 *    and KeyMaterial
 */
function CreateKeyPair(params, res) {
    var obj = {
        CreateKeyPairResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            keyName: params.KeyName,
            keyFingerprint: 'AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA',
            keyMaterial: '-----BEGIN RSA PRIVATE KEY-----\nSampleRSAPrimvateKey\n-----END RSA PRIVATE KEY-----'
        }
    };
    var xml = builder.buildObject(obj);
    res.set('Content-Type', 'application/xml');
    res.send(xml).end();
}
exports.CreateKeyPair = CreateKeyPair;