/*!
 * node-metadossier
 * https://github.com/wortex17/node-metadossier
 * Created 10.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */

"use strict";

let
    chai = require('chai')
    ,expect = chai.expect
;
describe('Self-Test: null', function() {

    describe('#null', function() {
        context("always", function(){
            it('should be null', function() {
                expect(null).to.equal(null);
            });
        });
    });
});
