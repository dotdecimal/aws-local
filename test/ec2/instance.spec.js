/*
 * Instances Unit Tests
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

describe('instance', function() {
    describe('runInstances', function() {
        it('should correctly run an instance', function() {
            var str = 'UserTestData';
            var params = {
                ImageId: 'testimage',
                MaxCount: 1,
                MinCount: 1,
                InstanceType: 't1.micro',
                KeyName: 'myuniquekey',
                Placement: {
                    AvailabilityZone: 'us-east-1a'
                },
                Monitoring: {
                    Enabled: true
                },
                IamInstanceProfile: {
                    Name: 'server'
                },
                SecurityGroupIds: ['aa-12341234'],
                UserData: (new Buffer(str)).toString('base64')
            };
            return ec2.runInstancesAsync(params).then(function(data) {
                expect(data).to.have.keys('ReservationId', 'OwnerId', 'Groups', 'Instances');
                expect(data.ReservationId).to.be.a.string;
                expect(data.OwnerId).to.be.a.string;
                expect(data.Groups).to.be.an.array;
                expect(data.Instances).to.be.an.array;
                expect(data.Instances).to.have.length(1);
            });
        });
    });

    describe('terminateInstances', function() {
        var id;

        before(function() {
            var str = 'UserTestData';
            var params = {
                ImageId: 'testimage2',
                MaxCount: 1,
                MinCount: 1,
                InstanceType: 't1.micro',
                KeyName: 'myuniquekey',
                Placement: {
                    AvailabilityZone: 'us-east-1a'
                },
                Monitoring: {
                    Enabled: true
                },
                IamInstanceProfile: {
                    Name: 'server'
                },
                SecurityGroupIds: ['aa-12341234'],
                UserData: (new Buffer(str)).toString('base64')
            };
            return ec2.runInstancesAsync(params).then(function(data) {
                id = data.Instances[0].InstanceId;
            });
        });

        it('should terminate the instance', function() {
            var params = {
                InstanceIds: [id]
            };
            return ec2.terminateInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('TerminatingInstances').and.have.length(1);
                expect(data.TerminatingInstances[0]).to.have.keys('InstanceId', 'CurrentState', 'PreviousState');
                expect(data.TerminatingInstances[0].InstanceId).to.eql(id);
                expect(data.TerminatingInstances[0].CurrentState).to.eql({
                    Code: 32,
                    Name: 'shutting-down'
                });
                expect(data.TerminatingInstances[0].PreviousState).to.have.property('Code').and.to.be.a.number;
                expect(data.TerminatingInstances[0].PreviousState).to.have.property('Name').and.to.be.a.string;
            });
        });

        it('should return an error', function() {
            var params = {
                InstanceIds: ['00000000']
            };
            // This should eventually check for a real Amazon error message
            return ec2.terminateInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('TerminatingInstances').and.to.eql([]);
            });
        });
    });

    describe('stopInstances', function() {
        var id;

        before(function() {
            var str = 'UserTestData';
            var params = {
                ImageId: 'testimage2',
                MaxCount: 1,
                MinCount: 1,
                InstanceType: 't1.micro',
                KeyName: 'myuniquekey',
                Placement: {
                    AvailabilityZone: 'us-east-1a'
                },
                Monitoring: {
                    Enabled: true
                },
                IamInstanceProfile: {
                    Name: 'server'
                },
                SecurityGroupIds: ['aa-12341234'],
                UserData: (new Buffer(str)).toString('base64')
            };
            return ec2.runInstancesAsync(params).then(function(data) {
                id = data.Instances[0].InstanceId;
            });
        });

        it('should stop the instance', function() {
            var params = {
                InstanceIds: [id]
            };
            return ec2.stopInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('StoppingInstances').and.have.length(1);
                expect(data.StoppingInstances[0]).to.have.keys('InstanceId', 'CurrentState', 'PreviousState');
                expect(data.StoppingInstances[0].InstanceId).to.eql(id);
                expect(data.StoppingInstances[0].CurrentState).to.eql({
                    Code: 64,
                    Name: 'stopping'
                });
                expect(data.StoppingInstances[0].PreviousState).to.have.property('Code').and.to.be.a.number;
                expect(data.StoppingInstances[0].PreviousState).to.have.property('Name').and.to.be.a.string;
            });
        });

        it('should return an error', function() {
            var params = {
                InstanceIds: ['00000000']
            };
            // This should eventually check for a real Amazon error message
            return ec2.stopInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('StoppingInstances').and.to.eql([]);
            });
        });
    });

    describe('startInstances', function() {
        var id;

        before(function() {
            var str = 'UserTestData';
            var params = {
                ImageId: 'testimage2',
                MaxCount: 1,
                MinCount: 1,
                InstanceType: 't1.micro',
                KeyName: 'myuniquekey',
                Placement: {
                    AvailabilityZone: 'us-east-1a'
                },
                Monitoring: {
                    Enabled: true
                },
                IamInstanceProfile: {
                    Name: 'server'
                },
                SecurityGroupIds: ['aa-12341234'],
                UserData: (new Buffer(str)).toString('base64')
            };
            return ec2.runInstancesAsync(params).then(function(data) {
                id = data.Instances[0].InstanceId;
                var stopParams = {
                    InstanceIds: [id]
                };
                return ec2.stopInstancesAsync(stopParams);
            });
        });

        it('should start the instance', function() {
            var params = {
                InstanceIds: [id]
            };
            return ec2.startInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('StartingInstances').and.have.length(1);
                expect(data.StartingInstances[0]).to.have.keys('InstanceId', 'CurrentState', 'PreviousState');
                expect(data.StartingInstances[0].InstanceId).to.eql(id);
                expect(data.StartingInstances[0].CurrentState).to.eql({
                    Code: 0,
                    Name: 'pending'
                });
                expect(data.StartingInstances[0].PreviousState).to.have.property('Code').and.to.be.a.number;
                expect(data.StartingInstances[0].PreviousState).to.have.property('Name').and.to.be.a.string;
            });
        });

        it('should return an error', function() {
            var params = {
                InstanceIds: ['00000000']
            };
            // This should eventually check for a real Amazon error message
            return ec2.startInstancesAsync(params).then(function(data) {
                expect(data).to.have.property('StartingInstances').and.to.eql([]);
            });
        });
    });
});