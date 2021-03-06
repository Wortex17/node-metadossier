/*!
 * node-metadossier
 * https://github.com/wortex17/node-metadossier
 * Created 15.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

let
    chai = require('chai')
    ,expect = chai.expect
    ;
let
    _ = require("lodash"),
    NodeRSA = require("node-rsa")
    ;
let
    LockedContent = require("../lib/LockedContent"),
    Keychain = require("../lib/Keychain")
    ;

describe('Internal Module: LockedContent', function() {

    let testContent = "CONTENT";
    let authorKeychain = new Keychain();
    authorKeychain.addNewAuthorKeypair({b: 1024});
    let authorKeypair = authorKeychain.keypairs[0];
    let readerKeychain = new Keychain();
    readerKeychain.addReaderKeypair(authorKeypair);
    let readerKeypair = readerKeychain.keypairs[0];


    let alternativeAuthorKeychain = new Keychain();
    alternativeAuthorKeychain.addNewAuthorKeypair({b: 1024});
    let alternativeAuthorKeypair = alternativeAuthorKeychain.keypairs[0];

    describe('construction', function() {
        describe('#lock', function() {
            context('when no arguments are given', function(){
                it('should throw an error', function(){
                    expect(function(){
                        LockedContent.lock();
                    }).to.throw();
                });
            });
            context('when no options are given', function(){
                it('should throw an error', function(){
                    expect(function(){
                        LockedContent.lock(testContent);
                    }).to.throw();
                });
            });
            context('when no options.keys are given', function(){
                it('should throw an error', function(){
                    expect(function(){
                        LockedContent.lock(testContent, {});
                    }).to.throw();
                });
            });
            context('when options.keys are unsupported', function(){
                function execution(){
                    return LockedContent.lock(testContent, {keys: false});
                }
                it('should throw an error', function(){
                    expect(execution).to.throw();
                });
            });
            context('when options.keys is a private NodeRSAKey', function(){
                function execution(){
                    return LockedContent.lock(testContent, {keys: authorKeypair});
                }
                it('should not throw an error', function(){
                    expect(execution).to.not.throw();
                });
            });
            context('when options.keys is a public NodeRSAKey', function(){
                function execution(){
                    return LockedContent.lock(testContent, {keys: readerKeypair});
                }
                it('should throw an error', function(){
                    expect(execution).to.throw();
                });
            });
            context('when options.keys is a Keychain with a writekey', function(){
                function execution(){
                    return LockedContent.lock(testContent, {keys: authorKeychain});
                }
                it('should not throw an error', function(){
                    expect(execution).to.not.throw();
                });
                it('should return a LockedContent instance', function(){
                    expect(execution()).to.be.an.instanceof(LockedContent);
                });
            });
            context('when options.keys is a keychain with only readkeys', function(){
                function execution(){
                    return LockedContent.lock(testContent, {keys: readerKeychain});
                }
                it('should throw an error', function(){
                    expect(execution).to.throw();
                });
            });
            context('when encryption fails because of unknown errors', function(){
                it('should throw an error', function(){
                    expect(function(){
                        LockedContent.lock(testContent, {keys: readerKeychain, debugFailEncryption: true});
                    }).to.throw();
                });
            });
        });
    });

    describe('instance methods', function() {

        let c = {};

        beforeEach(function() {
            c.instance = LockedContent.lock(testContent, {keys: authorKeychain});
        });

        describe('#erase', function() {

            it('should not throw an error', function(){
                expect(function(){
                    c.instance.erase();
                }).to.not.throw();
            });

            it('should remove the encrypted content', function(){
                c.instance.erase();
                expect(c.instance.encryptedContent).to.be.undefined;
            });
            it('should remove the encrypted symmetric key', function(){
                c.instance.erase();
                expect(c.instance.encryptedSymmetricKey).to.be.undefined;
            });
            it('should remove the encrypted content signature', function(){
                c.instance.erase();
                expect(c.instance.encryptedContentSignature).to.be.undefined;
            });
            it('should remove the encrypted symmetric key signature ', function(){
                c.instance.erase();
                expect(c.instance.encryptedSymmetricKeySignature).to.be.undefined;
            });
        });

        describe('#unlock', function() {
            context('when no options are given', function(){
                function execution(){
                    return c.instance.unlock();
                }
                it('should throw an error', function(){
                    expect(execution).to.throw();
                });
            });
            context('when no options.keys are given', function(){
                function getExecution(options)
                {
                    return function execution(){
                        return c.instance.unlock(_.extend(options, {}));
                    }
                }
                it('should throw an error', function(){
                    expect(getExecution()).to.throw();
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
                it('should return undefined if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })()).to.be.an('undefined');
                });
            });
            context('when options.keys are unsupported', function(){
                function getExecution(options)
                {
                    return function execution(){
                        return c.instance.unlock(_.extend(options, {keys:false}));
                    }
                }
                it('should throw an error', function(){
                    expect(getExecution()).to.throw();
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
                it('should return undefined if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })()).to.be.an('undefined');
                });
            });
            context('when options.keys is a matching NodeRSA keypair', function(){
                function execution(){
                    return c.instance.unlock({keys:readerKeypair});
                }
                it('should not throw an error', function(){
                    expect(execution).to.not.throw();
                });
                it('should return a buffer', function(){
                    expect(execution()).to.be.an.instanceof(Buffer);
                });
                it('should return a copy of the content', function(){
                    expect(execution()).to.deep.equal(new Buffer(testContent));
                });
            });
            context('when options.keys is a Keychain with a matching keypair', function(){
                function execution(){
                    return c.instance.unlock({keys:readerKeychain});
                }
                it('should not throw an error', function(){
                    expect(execution).to.not.throw();
                });
                it('should return a buffer', function(){
                    expect(execution()).to.be.an.instanceof(Buffer);
                });
                it('should return a copy of the content', function(){
                    expect(execution()).to.deep.equal(new Buffer(testContent));
                });
            });
            context('when options.keys is a not-matching NodeRSA keypair', function(){
                function getExecution(options)
                {
                    return function execution(){
                        return c.instance.unlock(_.extend(options, {keys:alternativeAuthorKeypair}));
                    }
                }
                it('should throw a KeyMatchError', function(){
                    expect(getExecution()).to.throw(LockedContent.KeyMatchError);
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
                it('should return undefined if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })()).to.be.an('undefined');
                });
            });
            context('when options.keys is a Keychain with no matching keypair', function(){
                function getExecution(options)
                {
                    return function execution(){
                        return c.instance.unlock(_.extend(options, {keys:alternativeAuthorKeychain}));
                    }
                }
                it('should throw an error', function(){
                    expect(getExecution()).to.throw();
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
                it('should return undefined if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })()).to.be.an('undefined');
                });
            });
            context('when decryption fails because of unknown errors', function(){
                it('should throw a ContentDecryptionError', function(){
                    expect(function(){
                        return c.instance.unlock({keys:readerKeypair, debugFailDecryption: true});
                    }).to.throw(LockedContent.ContentDecryptionError);
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(function(){
                        return c.instance.unlock({keys:readerKeypair, debugFailDecryption: true, throwError: false});
                    }).to.not.throw();
                });
            });
            context('when tampering with the encryptedContentSignature', function(){
                function getExecution(options){
                    return function(){
                        /** @type {LockedContent} */
                        let tamperedInstance = _.clone(c.instance);
                        tamperedInstance.encryptedContentSignature[0] += 4;
                        return c.instance.unlock(_.extend(options, {keys:readerKeypair}));
                    };
                }
                it('should throw a ContentAuthenticityError', function(){
                    expect(getExecution()).to.throw(LockedContent.ContentAuthenticityError);
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
            });
            context('when tampering with the encryptedContent', function(){
                function getExecution(options){
                    return function(){
                        /** @type {LockedContent} */
                        let tamperedInstance = _.clone(c.instance);
                        tamperedInstance.encryptedContent[0] += 4;
                        return c.instance.unlock(_.extend(options, {keys:readerKeypair}));
                    };
                }
                it('should throw a ContentAuthenticityError', function(){
                    expect(getExecution()).to.throw(LockedContent.ContentAuthenticityError);
                });
                it('should not throw an error if options.throwError is false', function(){
                    expect(getExecution({
                        throwError:false
                    })).to.not.throw();
                });
            });
        });
    });
});
