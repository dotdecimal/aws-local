/*
 * AWS Local EC2 - Instance
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

var Promise = require('bluebird');
var xml2js = require('xml2js');
var builder = new xml2js.Builder();
var builder2 = require('xmlbuilder');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var _ = require('lodash');

Promise.promisifyAll(fs);

function getXML(handle, obj) {
    for (var prop in obj) {
        if (typeof obj[prop] === 'object') {
            var myHandle = handle.ele(prop);
            getXML(myHandle, obj[prop]);
        } else {
            handle.ele(prop, obj[prop]);
        }
    }
}

/**
 * Runs a given instance
 *
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the ReservationId, OwnerId,
 *    RequestorId, Groups, and Instances
 */
function RunInstances(root, params, res) {
    var instances = {};
    for (i = 0; i < params.MinCount; i++) {
        var instanceid = crypto.randomBytes(4).toString('hex');
        var instance = {
            item: {
                instanceId: instanceid,
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
        instances[instanceid] = instance;
    }
    // Create a respose object that will be converted to xml later
    var responseObj = {
        RunInstancesResponse: {
            requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
            reservationId: crypto.randomBytes(4).toString('hex'),
            ownerId: crypto.randomBytes(4).toString('hex'),
            requestorId: crypto.randomBytes(4).toString('hex'),
            groupSet: [],
            instancesSet: _.values(instances)
        }
    };

    // Store the information for this instance in the <root>/ec2/instances directory
    var files = [];
    for (var id in instances) {
        files.push(path.join(root, 'ec2', 'instances', id));
    }

    return Promise.resolve(files).map(function(filename) {
        // The data that is stored, i.e. the data we want to remember
        var storeObj = {
            reservationId: responseObj.RunInstancesResponse.reservationId,
            ownerId: responseObj.RunInstancesResponse.ownerId,
            requestorId: responseObj.RunInstancesResponse.requestorId,
            groups: responseObj.RunInstancesResponse.groups,
            instance: instance.item
        };

        // Write the file to local storage, creates directories if missing
        return fs.writeFileAsync(filename, JSON.stringify(storeObj)).catch( /* istanbul ignore next */ function() {
            return fs.mkdirAsync(path.join(root, 'ec2', 'instances')).catch(function() {
                return fs.mkdirAsync(path.join(root, 'ec2')).then(function() {
                    return fs.mkdirAsync(path.join(root, 'ec2', 'instances'));
                });
            }).then(function() {
                return fs.writeFileAsync(filename, JSON.stringify(storeObj));
            });
        });
    }, {
        concurrency: 1
    }).then(function() {
        // Convert the response from a javascript object to xml
        var root = builder2.create('RunInstancesResponse');
        root.ele('requestId', {}, responseObj.RunInstancesResponse.requestId);
        root.ele('reservationId', {}, responseObj.RunInstancesResponse.reservationId);
        root.ele('ownerId', {}, responseObj.RunInstancesResponse.ownerId);
        root.ele('requestorId', {}, responseObj.RunInstancesResponse.requestorId);
        root.ele('groupSet');
        var instancesSet = root.ele('instancesSet');
        for (var i = 0; i < responseObj.RunInstancesResponse.instancesSet.length; ++i) {
            var item = responseObj.RunInstancesResponse.instancesSet[i].item;
            var handle = instancesSet.ele('item');
            getXML(handle, item);
        }
        var xml = root.end();
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

/**
 * Stops one or more instances
 *
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the stopped instances
 */
function StopInstances(root, params, res) {
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
                code: 64,
                name: 'stopping'
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
                        code: 64,
                        name: 'stopping'
                    },
                    previousState: info[i].state
                }
            };
            instances.push(instance);
        }
        // Create a response object that will be converted to xml
        var responseObj = {
            StopInstancesResponse: {
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
            StopInstancesResponse: {
                requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
                instancesSet: []
            }
        };
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    });
}
exports.StopInstances = StopInstances;

/**
 * Starts one or more instances
 *
 * @param {string} root - The directory at which to place resource data
 * @param {object} params - The parameters for the action
 * @param {object} res - The response object
 * @returns {string} The XML encoded response giving the started instances
 */
function StartInstances(root, params, res) {
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
                code: 0,
                name: 'pending'
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
                        code: 0,
                        name: 'pending'
                    },
                    previousState: info[i].state
                }
            };
            instances.push(instance);
        }
        // Create a response object that will be converted to xml
        var responseObj = {
            StartInstancesResponse: {
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
            StartInstancesResponse: {
                requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
                instancesSet: []
            }
        };
        var xml = builder.buildObject(responseObj);
        res.set('Content-Type', 'application/xml');
        res.send(xml).end();
    });
}
exports.StartInstances = StartInstances;

// /**
//  * Describe one or more instances
//  *
//  * @param {string} root - The directory at which to place resource data
//  * @param {object} params - The parameters for the action
//  * @param {object} res - The response object
//  * @returns {string} The XML encoded response giving a description of the
//  *    requested instances
//  */
// function DescribeInstances(root, params, res) {
//     var nameKeys = _.filter(_.keys(params), function(key) {
//         return /Filter\.[0-9]*\.Name/.test(key);
//     });
//     var valueKeys = _.filter(_.keys(params), function(key) {
//         return /Filter\.[0-9]*\.Value/.test(key);
//     });
//     var i, filters = [], filterIdx, valueIdx;
//     for (i = 0; i < nameKeys.length; ++i) {
//         filterIdx = parseInt(nameKeys[i].split('.')[1]) - 1;
//         filters[filterIdx] = {
//             name: params[nameKeys[i]],
//             values: []
//         };
//     }
//     for (i = 0; i < valueKeys.length; ++i) {
//         filterIdx = parseInt(valueKeys[i].split('.')[1]) - 1;
//         valueIdx = parseInt(valueKeys[i].split('.')[3]) - 1;
//         filters[filterIdx].values[valueIdx] = params[valueKeys[i]];
//     }

//     // Create a respose object that will be converted to xml later
//     var responseObj = {
//         DescribeInstancesResponse: {
//             requestId: 'b78e9654-3eb2-4b1c-98a8-01066cd4a310',
//             reservationSet: []
//         }
//     };

//     var instancesDir = path.join(root, 'ec2', 'instances');
//     return fs.readdirAsync(instancesDir).map(function(instanceName) {
//         var resolvedFilename = path.join(root, 'ec2', 'resources', instanceName);
//         return fs.readFileAsync(resolvedFilename).then(JSON.parse).then(function(obj) {
//             var tags = obj.tags;
//             for (var i = 0; i < filters.length; ++i) {
//                 if (tags.hasOwnProperty(filters[i].name)) {
//                     if (filters[i].values.length > 0) {
//                         if (filters[i].values.indexOf(tags[filters[i].name]) > -1) {
//                             return instanceName;
//                         }
//                     } else {
//                         return instanceName;
//                     }
//                 }
//             }
//             return null;
//         }).catch(function(e) {
//         })
//     }).filter(function(id) {
//         return typeof id === 'string';
//     }).map(function(id) {
//         return fs.readFileAsync(path.join(instancesDir, id)).then(JSON.parse);
//     }).map(function(instance) {
//         console.log(instance);
//         var reservation = {
//             reservationId: instance.reservationId,
//             ownerId: instance.ownerId,
//             groupSet: instance.groupSet,
//             instancesSet: {
//                 item: {
//                     instanceId: instance.item.instanceId,
//                     imageId: instance.item.imageId,
//                     instanceState: instance.item.instanceState,
//                     privateDnsName: instance.item.privateDnsName,
//                     dnsName: instance.item.privateDnsName,
//                     reason: instance.item.reason,
//                     keyName: instance.item.keyName,
//                     amiLaunchIndex: instance.item.amiLaunchIndex,
//                     productCodes: instance.item.productCodes,
//                     instanceType: instance.item.instanceType,
//                     launchTime: instance.item.launchTime,
//                     placement: instance.item.placement,
//                     kernelId: instance.item.kernelId,
//                     monitoring: instance.item.monitoring,
//                     subnetId: instance.item.subnetId,
//                     vpcId: instance.item.vpcId,
//                     privateIpAddress: instance.item.privateIpAddress,
//                     ipAddress: instance.item.privateIpAddress,
//                     sourceDestCheck: instance.item.sourceDestCheck,
//                     groupSet: instance.item.groupSet,
//                     architecture: instance.item.architecture,
//                     rootDeviceType: instance.item.rootDeviceType,
//                     rootDeviceName: instance.item.rootDeviceName,
//                     blockDeviceMapping: instance.item.blockDeviceMapping,
//                     virtualizationType: instance.item.virtualizationType,
//                     clientToken: instance.item.clientToken,
//                     hypervisor: instance.item.hypervisor,
//                     networkInterfaceSet: instance.item.networkInterfaceSet,
//                     iamInstanceProfile: instance.item.iamInstanceProfile,
//                     ebsOptimized: instance.item.ebsOptimized
//                 }
//             }
//         };
//         var id = instance.item.instanceId;
//         return fs.readFileAsync(path.join(root, 'ec2', 'resources', id)).then(JSON.parse).catch(function() {
//             return null;
//         }).then(function(data) {
//             if (data === null) {
//                 responseObj.DescribeInstancesResponse.reservationSet.push(reservation);
//             } else {
//                 reservation.tagSet = []
//                 for (var prop in data.tags) {
//                     reservation.tagSet.push({
//                         key: prop,
//                         value: data.tags[prop]
//                     });
//                 }
//                 responseObj.DescribeInstancesResponse.reservationSet.push(reservation);
//             }
//         });
//     }).then(function() {
//         // Convert the response from a javascript object to xml
//         var root = builder2.create('DescribeInstancesResponse');
//         root.ele('requestId', {}, responseObj.DescribeInstancesResponse.requestId);
//         var reservationSet = root.ele('reservationSet');
//         for (var i = 0; i < responseObj.DescribeInstancesResponse.reservationSet.length; ++i) {
//             var item = responseObj.DescribeInstancesResponse.reservationSet[i].item;
//             var handle = reservationSet.ele('item');
//             getXML(handle, item);
//         }
//         var xml = root.end();
//         res.set('Content-Type', 'application/xml');
//         res.send(xml).end();
//     }).catch(function(e) {

//     });
// }
// exports.DescribeInstances = DescribeInstances;