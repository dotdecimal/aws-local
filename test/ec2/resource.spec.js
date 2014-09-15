/*
 * Resources Unit Tests
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

describe('resource', function () {
    describe('createTags', function() {
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

        it('should tag the instance', function() {
            var params = {
                Resources: [id],
                Tags: [{
                    Key: 'key',
                    Value: 'value'
                }]
            };
            return ec2.createTagsAsync(params).then(function(data) {
                expect(data).to.be.an.object;
                expect(data).to.be.empty;
            });
        });

        it('should overwrite the tag value', function () {
            var params = {
                Resources: [id],
                Tags: [{
                    Key: 'key',
                    Value: 'value2'
                }]
            };
            return ec2.createTagsAsync(params).then(function(data) {
                expect(data).to.be.an.object;
                expect(data).to.be.empty;
            });
        });

        it('should be able to provide tag without value', function() {
            var params = {
                Resources: [id],
                Tags: [{
                    Key: 'key2'
                }]
            };
            return ec2.createTagsAsync(params).then(function(data) {
                expect(data).to.be.an.object;
                expect(data).to.be.empty;
            });
        });
    });
});