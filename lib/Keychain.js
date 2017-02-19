"use strict";

const _ = require("lodash");
const NodeRSA = require('node-rsa');

class Keychain
{
    constructor()
    {
        this.keypairs = [];
    }

    addNewAuthorKeypair(options)
    {
        options = _.extend({
            b: 2048
        }, options);
        this.addAuthorKeypair(new NodeRSA(options));
    }
    addNewReaderKeypair(options)
    {
        options = _.extend({
            b: 2048
        }, options);
        this.addReaderKeypair(options);
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
    }
    /**
     * Returns the first keypair that is authorized to write
     * @return {NodeRSA|undefined}
     */
    addReaderKeypair(nodeRSA)
    {

        let readerKeypair = new NodeRSA();
        readerKeypair.importKey(nodeRSA.exportKey('pkcs8-public-der'), 'pkcs8-public-der');

        this.keypairs.unshift(readerKeypair);
    }
    /**
     * Returns the first keypair that is authorized to write
     * @return {NodeRSA|undefined}
     */
    getPreferredWriteKey()
    {
        return this.keypairs.find(function(keypair){
            return keypair.isPrivate();
        });
    }

    /**
     * @return {boolean} true if there is at least one key authorized to write in this keychain.
     */
    get containsWriteKeys()
    {
        return this.keypairs.findIndex(function(keypair){ keypair.isPrivate(); }) >= 0;
    }
    /**
     * @borrows containsWriteKeys
     */
    get containsAuthorKeypair()
    {
        return this.containsWriteKeys();
    }
    /**
     * @return {boolean} true if there is at least one key authorized to read in this keychain.
     */
    get containsReadKeys()
    {
        return this.keypairs.findIndex(function(keypair){ keypair.isPublic(); }) >= 0;
    }
    /**
     * @borrows containsReadKeys
     */
    get containsReaderKeypair()
    {
        return this.containsReadKeys();
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
        _.each(exportedKeys, function(eKey){
            let keypair = new NodeRSA();
            let isPrivateKey = _.startsWith(eKey, '-----BEGIN PRIVATE KEY-----');
            keypair.importKey(eKey, isPrivateKey ? 'pkcs8-private-pem' : 'pkcs8-public-pem');
        });
    }
}

module.exports = Keychain;