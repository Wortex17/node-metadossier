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


const Keychain = require('./Keychain');
const LockedContent = require('./LockedContent');

let content = "Hello Woooorld!!";
/*
for(let i = 0; i < 100000; i++)
{
    content += "Hello\n";
}
*/

let keychain = new Keychain;
keychain.addNewAuthorKeypair();
keychain.addNewReaderKeypair();

keychain.importKeychain(keychain.exportKeychain());

console.log(keychain.keypairs.length);

let locked = LockedContent.lock(content, {keys:keychain});

console.log(content);

/*
//console.log(locked.symmetricKey);
console.log(locked.encryptedSymmetricKey);
console.log(locked.encryptedSymmetricKeySignature);
console.log(locked.encryptedContent);
console.log(locked.encryptedContentSignature);
*/

let unlocked = locked.unlock({keys:keychain}).toString('utf-8');


console.log(unlocked == content);

console.log(unlocked);

//console.log(encrypted);
//let decrypted = cipher.internalKeyPair.decryptPublic(encrypted, 'utf-8');
//console.log(decrypted);
