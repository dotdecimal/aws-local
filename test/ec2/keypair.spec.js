/*
 * Key Pair Unit Tests
 *
 * Author(s):  Kyle Burnett <kburnett@dotdecimal.com>
 *
 * Copyright:  (c) 2014 .decimal, Inc. All rights reserved.
 */

describe('keypair', function() {
    describe('createKeyPair', function() {
        it('should correctly insert a Key Pair', function() {
            var conf = {
                KeyName: 'myuniquekey'
            };
            return ec2.createKeyPairAsync(conf).then(function(data) {
                expect(data.KeyName).to.be.a.string;
                expect(data).to.have.keys('KeyName', 'KeyFingerprint', 'KeyMaterial');
                expect(data.KeyName).to.be.a.string;
                expect(data.KeyName).to.eql(conf.KeyName);
                expect(data.KeyFingerprint).to.be.a.string;
                expect(data.KeyMaterial).to.be.a.string;
            });
        });
    });
});