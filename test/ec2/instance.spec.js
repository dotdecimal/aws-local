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
            var conf = {
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
            return ec2.runInstancesAsync(conf).then(function(data) {
                expect(data).to.have.keys('ReservationId', 'OwnerId', 'Groups', 'Instances');
                expect(data.ReservationId).to.be.a.string;
                expect(data.OwnerId).to.be.a.string;
                expect(data.Groups).to.be.an.array;
                expect(data.Instances).to.be.an.array;
                expect(data.Instances).to.have.length(1);
            });
        });
    });
});