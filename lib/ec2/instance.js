/*
 * AWS Local EC2 Local - Instance
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

Promise.promisifyAll(fs);

/**
 * Creates a key pair with the given keypair name
 * 
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the ReservationId, OwnerId,
 *    RequestorId, Groups, and Instances
 */
function RunInstances(root, params, res) {
    var instance = {
        item: {
            instanceId: crypto.randomBytes(4).toString('hex'),
            imageId: params.ImageId,
            instanceState: {
                code: 0,
                name: 'pending'
            },
            privateDnsName: 'ip-172-0-0-0.ecs.internal',
            dnsName: '',
            reason: '',
            keyName: params.KeyName,
            amiLaunchIndex: 0,
            productCodes: [],
            instanceType: params.InstanceType,
            launchTime: '2014-08-22T16:34:50.000Z',
            placement: {
                availabilityZone: params['Placement.AvailabilityZone'],
                groupName: '',
                tenancy: 'default'
            },
            kernelId: crypto.randomBytes(4).toString('hex'),
            monitoring: {
                state: 'pending'
            },
            subnetId: crypto.randomBytes(4).toString('hex'),
            vpcId: crypto.randomBytes(4).toString('hex'),
            privateIpAddress: '172.168.0.0',
            sourceDestCheck: true,
            groupSet: [],
            stateReason: {
                code: 'pending',
                message: 'pending'
            },
            architecture: 'x86_64',
            rootDeviceType: 'ebs',
            rootDeviceName: '/dev/sda1',
            blockDeviceMapping: '',
            virtualizationType: 'paravirtual',
            clientToken: '',
            hypervisor: 'zen',
            networkInterfaceSet: [],
            iamInstanceProfile: {
                arn: 'arn:aws:iam::319623489395:instance-profile/testserver',
                id: crypto.randomBytes(4).toString('hex')
            },
            ebsOptimized: false
        }
    };
    // Create a respose object that will be converted to xml later
    var responseObj = {
        RunInstancesResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            reservationId: crypto.randomBytes(4).toString('hex'),
            ownerId: crypto.randomBytes(4).toString('hex'),
            requestorId: crypto.randomBytes(4).toString('hex'),
            groupSet: [],
            instancesSet: [instance]
        }
    };
    // Store the information for this keypair in the <root>/ec2/instances directory
    var filename = path.join(root, 'ec2', 'instances', instance.item.instanceId);
    // The data that is stored, i.e. the data we want to remember
    var storeObj = {
        reservationId: responseObj.RunInstancesResponse.reservationId,
        ownerId: responseObj.RunInstancesResponse.ownerId,
        requestorId: responseObj.RunInstancesResponse.requestorId,
        groups: responseObj.RunInstancesResponse.groups,
        instances: responseObj.RunInstancesResponse.instances
    };
    return Promise.bind({}).then(function() {
        // Write the file to local storage, creates directories if missing
        return fs.writeFileAsync(filename, JSON.stringify(storeObj)).catch(/* istanbul ignore next */ function() {
            return fs.mkdirAsync(path.join(root, 'ec2', 'instances')).catch(function() {
                return fs.mkdirAsync(path.join(root, 'ec2')).then(function() {
                    return fs.mkdirAsync(path.join(root, 'ec2', 'instances'));
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
exports.RunInstances = RunInstances;