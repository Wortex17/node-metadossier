/*!
 * node-metadossier
 * https://github.com/wortex17/node-metadossier
 * Created 10.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

let
    path = require("path"),
    fs = require("fs")
    ;
let
    _ = require("lodash"),
    mkdirp = require("mkdirp"),
    BufferSerializer = require("buffer-serializer"),
    BSON = require("bson")
    ;
let
    FSRawStorage = require("./FSRawStorage"),
    MetadossierVersion = require("./Version")
    ,Util = require("./Util")
    ;

let topic = "F:/DWPersonal/Projekte/dws/Infrablack/node-metadossier/testbox";


class MetadossierPacker {
    constructor()
    {
        this.version = this.constructor.VERSION;
        this.module = "default";
        /**
         * The document is the primary, version-controlled data.
         * @type {*}
         */
        this.document = {};
        /**
         * The appendix is a storage for loosely coupled data e.g.
         * serialized images or other things that are NOT version controlled to save space.
         * @type {Object<*>}
         */
        this.appendix = {};
    }

    /**
     * @return {string}
     */
    static get HEADERSTRING_WITHOUT_VERSION()
    {
        return "#!METADOSSIER";
    }
    static get VERSION()
    {
        return 0x0001;
    }

    generateHeader(targetBuffer, targetOffset)
    {

        if(!_.isBuffer(targetBuffer))
        {
            let buffer = Buffer.alloc(15);
            return this.generateHeader(buffer);
        }

        if(_.isUndefined(targetOffset))
            targetOffset = (_.isSafeInteger(targetOffset)) ? targetOffset : 0;

        let headerString = this.constructor.HEADERSTRING_WITHOUT_VERSION;

        function toInteger(x) {
            x = Number(x);
            return x < 0 ? Math.ceil(x) : Math.floor(x);
        }
        function modulo(a, b) {
            return a - Math.floor(a/b)*b;
        }
        function toUint16(x) {
            return modulo(toInteger(x), Math.pow(2, 16));
        }

        let version16 = toUint16(this.version);

        targetBuffer.write(headerString, 0, headerString.length);
        targetBuffer.writeUInt16BE(version16, 13);

        return targetBuffer;
    }

    readHeader(headerBuffer)
    {
        let hasCorrectHashbang = headerBuffer.slice(0, 13).toString() == this.constructor.HEADERSTRING_WITHOUT_VERSION;
        if(hasCorrectHashbang)
        {
            this.version = headerBuffer.readUInt16BE(13);
        }

        return hasCorrectHashbang;
    }

    /**
     * Creates the plain javascript object that should be packed beneath the header
     */
    toSerializedObject()
    {
        return {
            module: this.module,
            document: this.document,
            appendix: this.appendix
        }
    }

    fillFromSerializedObject(serializedObject)
    {
        this.module = serializedObject.module;
        this.document = serializedObject.document;
        this.appendix = serializedObject.appendix;
    }

    toBuffer()
    {
        let bson = new BSON();
        let serializedObject = this.toSerializedObject();
        let serializedBuffer = bson.serialize(serializedObject);

        let headerBuffer = this.generateHeader();

        return Buffer.concat([headerBuffer, serializedBuffer]);
    }

    fillFromBuffer(serializedBuffer)
    {
        let bson = new BSON();

        let correctHeader = this.readHeader(serializedBuffer);

        if(correctHeader)
        {
            let contentView = serializedBuffer.slice(15);
            let deserialized = bson.deserialize(contentView, {
                'promoteBuffers': true,
                'promoteValues': true
            });
            this.fillFromSerializedObject(deserialized);
        }
    }
}
/*
let md = new MetadossierPacker();
md.document['testD'] = 42;
md.appendix['testA'] = new Buffer("hello");
let mdBuffer = md.toBuffer();
let md2 = new Metadossier();
md2.fillFromBuffer(mdBuffer);
console.log(md);
console.log(mdBuffer);
console.log(md2);
*/


const crypto = require('crypto');
const assert = require('assert');
const NodeRSA = require('node-rsa');

class MetadossierCipher
{
    constructor()
    {
        this.internalKeyPair = new NodeRSA();
        this.symmetric = null;
        this.encryptedContent = null;
        this.encryptedSymmetricKey = null;
    }

    /**
     * Sets writeKey and readKey to a newly generated keypair
     */
    generateKeys()
    {
        this.internalKeyPair.generateKeyPair(512, 65537);
    }

    /**
     * This cipher is able to read (decrypt & verify)
     */
    get canRead()
    {
        this.internalKeyPair.isPublic();
    }
    /**
     * This cipher is able to write (encrypt & sign)
     */
    get canWrite()
    {
        this.internalKeyPair.isPrivate();
    }

    encrypt(content)
    {
        let rsa = this.internalKeyPair;
        this.symmetricKey = crypto.randomBytes(rsa.getKeySize());

        this.encryptedSymmetricKey = rsa.encryptPrivate(this.symmetricKey);
        this.encryptedSymmetricKeySignature = rsa.sign(this.encryptedSymmetricKey);

        let cipher = crypto.createCipher('aes192', this.symmetricKey);
        this.encryptedContent = cipher.update(content);
        this.encryptedContent = Buffer.concat([this.encryptedContent, cipher.final()]);

        this.encryptedContentSignature = rsa.sign(this.encryptedContent);
        return this;
    }

    decrypt()
    {

    }
}

class LockedContent
{
    constructor()
    {
        /**
         * Content that was locked down with a symmetric key
         */
        this.encryptedContent = undefined;
        /**
         * Used to verify that the content was encrypted by a valid writeKey
         */
        this.encryptedContentSignature = undefined;
        this.encryptedSymmetricKey = undefined;
        /**
         * Used to verify that the symmetric key was generated by a valid writeKey
         */
        this.encryptedSymmetricKeySignature = undefined;
    }

    /**
     *
     * @param {*} content
     * @param {NodeRSA|Keychain} keypair
     * @return {LockedContent}
     */
    static lock(content, keypair)
    {
        if(keypair instanceof Keychain)
        {
            keypair = keypair.getPreferredWriteKey();
        }

        if(_.isUndefined(keypair)) //May happen if keychain is given
            return undefined;

        let locked = new LockedContent();

        let symmetricKey = crypto.randomBytes(keypair.getMaxMessageSize());

        locked.encryptedSymmetricKey = keypair.encryptPrivate(symmetricKey);
        locked.encryptedSymmetricKeySignature = keypair.sign(locked.encryptedSymmetricKey);

        let cipher = crypto.createCipher('aes192', symmetricKey);
        let encryptedContent = cipher.update(content);
        locked.encryptedContent = Buffer.concat([encryptedContent, cipher.final()]);

        locked.encryptedContentSignature = keypair.sign(locked.encryptedContent);

        return locked;
    }

    /**
     * @param {NodeRSA|Keychain} keypair
     * @return {*}
     */
    unlock(keypair)
    {
        let writersSymmetricKey;

        if(keypair instanceof Keychain)
        {
            keypair = keypair.getVerifyingKeypair(locked.encryptedSymmetricKey, locked.encryptedSymmetricKeySignature);
            writersSymmetricKey = !_.isUndefined(keypair);
        } else {
            writersSymmetricKey = keypair.verify(locked.encryptedSymmetricKey, locked.encryptedSymmetricKeySignature);
        }

        if(_.isUndefined(keypair)) //May happen if keychain is given
        {
            console.log("No valid key available");
            return undefined;
        }
        if(!writersSymmetricKey)
        {
            console.log("Symmetric Key could not be verified");
            return undefined;
        }
        let writersLock = keypair.verify(locked.encryptedContent, locked.encryptedContentSignature);
        if(!writersLock)
        {
            console.log("ContentLock could not be verified");
            return undefined;
        }

        let symmetricKey = keypair.decryptPublic(this.encryptedSymmetricKey);

        let cipher = crypto.createDecipher('aes192', symmetricKey);
        let decryptedContent = cipher.update(this.encryptedContent);
        decryptedContent = Buffer.concat([decryptedContent, cipher.final()]);

        return decryptedContent;
    }
}

class Keychain
{
    constructor()
    {
        this.keypairs = [];
    }

    addNewAuthorKeypair()
    {
        this.addAuthorKeypair(new NodeRSA({
            b: 2048
        }));
    }
    addNewReaderKeypair()
    {
        this.addReaderKeypair(new NodeRSA({
            b: 2048
        }));
    }
    addKeypair(nodeRSA)
    {
        if(nodeRSA.isPrivate())
            this.addAuthorKeypair(nodeRSA);
        else
            this.addReaderKeypair(nodeRSA);
    }
    addAuthorKeypair(nodeRSA)
    {
        let authorKeypair = new NodeRSA();
        authorKeypair.importKey(nodeRSA.exportKey('pkcs8-private-der'), 'pkcs8-private-der');

        this.keypairs.unshift(authorKeypair);


        let keypair = new NodeRSA();
        //TODO: WTF why doesnt this work? (this is the reason why importKeychain doesnt work either)
        let exp = authorKeypair.exportKey('pkcs8-public-pem').trim('\n');
        exp = exp.split("\n").join();
        console.log(exp);
        keypair.importKey(exp, 'pkcs8');
    }
    addReaderKeypair(nodeRSA)
    {

        let readerKeypair = new NodeRSA();
        readerKeypair.importKey(nodeRSA.exportKey('pkcs8-public-der'), 'pkcs8-public-der');

        this.keypairs.unshift(readerKeypair);
    }
    /**
     * Returns the first keypair is authorized to write
     * @return {NodeRSA|undefined}
     */
    getPreferredWriteKey()
    {
        return this.keypairs.find(function(keypair){
            return keypair.isPrivate();
        });
    }

    get containsWriteKeys()
    {
        return this.keypairs.findIndex(function(keypair){ keypair.isPrivate(); }) >= 0;
    }
    get containsReadKeys()
    {
        return this.keypairs.findIndex(function(keypair){ keypair.isPublic(); }) >= 0;
    }

    /**
     * Returns the first keypair that verifies the given signature
     */
    getVerifyingKeypair(buffer, signature, source_encoding, signature_encoding)
    {
        return this.keypairs.find(function(keypair){
            return keypair.isPublic() && keypair.verify(buffer, signature, source_encoding, signature_encoding);
        });
    }

    exportKeychain()
    {
        return _.map(this.keypairs, function(keypair) {
            return keypair.exportKey(keypair.isPrivate() ? 'pkcs8-private-pem' : 'pkcs8-public-pem');
        }).join("\n");
    }

    importKeychain(exportedKeychain)
    {
        let exportedKeys = exportedKeychain.split("\n-----BEGIN");
        exportedKeys = _.map(exportedKeys, function(key, i){return ((i > 0)?"-----BEGIN":"")+key;});
        console.log(exportedKeys);
        /*
        _.each(exportedKeys, function(eKey){
            let keypair = new NodeRSA();
            keypair.importKey(eKey, 'pkcs8');
        });
        */
    }
}


let content = "Hello Woooorld!!";
/*
for(let i = 0; i < 100000; i++)
{
    content += "Hello\n";
}
*/

let keychain = new Keychain;
keychain.addNewAuthorKeypair();
//keychain.addNewReaderKeypair();

keychain.importKeychain(keychain.exportKeychain());

let locked = LockedContent.lock(content, keychain);

console.log(content);

//console.log(locked.symmetricKey);
console.log(locked.encryptedSymmetricKey);
console.log(locked.encryptedSymmetricKeySignature);
console.log(locked.encryptedContent);
console.log(locked.encryptedContentSignature);

let unlocked = locked.unlock(keychain).toString('utf-8');


console.log(unlocked == content);

console.log(unlocked);

//console.log(encrypted);
//let decrypted = cipher.internalKeyPair.decryptPublic(encrypted, 'utf-8');
//console.log(decrypted);
