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
var _ = require('lodash');

Promise.promisifyAll(fs);

/**
 * Runs a given instance an instance
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
    // Store the information for this instance in the <root>/ec2/instances directory
    var filename = path.join(root, 'ec2', 'instances', instance.item.instanceId);
    // The data that is stored, i.e. the data we want to remember
    var storeObj = {
        reservationId: responseObj.RunInstancesResponse.reservationId,
        ownerId: responseObj.RunInstancesResponse.ownerId,
        requestorId: responseObj.RunInstancesResponse.requestorId,
        groups: responseObj.RunInstancesResponse.groups,
        instance: instance.item
    };

    return Promise.bind({}).then(function() {
        // Write the file to local storage, creates directories if missing
        return fs.writeFileAsync(filename, JSON.stringify(storeObj)).catch( /* istanbul ignore next */ function() {
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

/**
 * Terminates one or more instances
 *
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the terminated instances
 */
function TerminateInstances(root, params, res) {
    var keys = _.filter(_.keys(params), function(key) {
        return key.indexOf('InstanceId') > -1;
    });
    var ids = [];
    for (var i = 0; i < keys.length; ++i) {
        ids.push(params[keys[i]]);
    }
    return Promise.all(ids).map(function(id) {
        var filename = path.join(root, 'ec2', 'instances', id);
        return Promise.bind({}).then(function() {
            return fs.readFileAsync(filename);
        }).then(function(data) {
            return JSON.parse(data.toString());
        }).then(function(obj) {
            this.prevState = JSON.parse(JSON.stringify(obj.instance.instanceState));
            obj.instanceState = {
                code: 32,
                name: 'shutting-down'
            };
            // Write back to file with new state
            return fs.writeFileAsync(filename, JSON.stringify(obj));
        }).then(function() {
            return {
                id: id,
                state: this.prevState
            };
        }).catch(function(e) {
            throw e;
        });
    }).then(function(info) {
        var instances = [];
        for (var i = 0; i < info.length; ++i) {
            var instance = {
                item: {
                    instanceId: info[i].id,
                    currentState: {
                        code: 32,
                        name: 'shutting-down'
                    },
                    previousState: info[i].state
                }
            };
            instances.push(instance);
        }
        // Create a response object that will be converted to xml
        var responseObj = {
            TerminateInstancesResponse: {
                requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
                instancesSet: instances
            }
        };
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    }).catch(function(e) {
        // Create a response object that will be converted to xml
        var responseObj = {
            TerminateInstancesResponse: {
                requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
                instancesSet: []
            }
        };
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    });

}
exports.TerminateInstances = TerminateInstances;