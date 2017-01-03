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

let serializer = new BufferSerializer();
let myThing = {
    key: "value",
    number: 123.456,
    date: new Date(),
    buffer: new Buffer(10)
};

let start = new Date();
let hrstart = process.hrtime();
console.log("BufferSerializer");
console.log("before serialization", myThing);
let aBuffer = serializer.toBuffer(myThing);
console.log("serialized", aBuffer.toString("hex"));
console.log("buffer bytes", aBuffer.length);
let result = serializer.fromBuffer(aBuffer);
console.log("after serialization", result);

let end = new Date() - start;
let hrend = process.hrtime(hrstart);
console.info("Execution time: %dms", end);
console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);

start = new Date();
hrstart = process.hrtime();
console.log("BSON");
// Create a bson parser instance
let bson = new BSON();
aBuffer = bson.serialize(myThing);
console.log("serialized", aBuffer.toString("hex"));
console.log("buffer bytes", aBuffer.length);
result = bson.deserialize(aBuffer);
console.log("after serialization", result);

end = new Date() - start;
hrend = process.hrtime(hrstart);
console.info("Execution time: %dms", end);
console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);


class MetadossierPacker {

    constructor()
    {
        this.version = this.constructor.VERSION;
        this.module = "default";
        this.version = new MetadossierVersion();
        this.blocks = [];
    }

    /**
     * Reads & deserializes given header & block (indices) into this packer.
     * @param blob
     * @param {number} start - The reading position in the blob
     * @return {number} The reading position after reading
     */
    readIndex(blob, start)
    {
        let pivot = start;
        pivot = this.readHeader(blob, pivot);
        pivot = this.readBlockIndex(blob, pivot);
        return pivot;
    }

    /**
     * Reads & deserializes given header into this packer.
     * @return {number} index of the blob after the last read byte.
     */
    readHeader(blob, start)
    {
        let pivot = start;
        pivot = this.readFixedHeader(blob, pivot);
        pivot = this.readVersion(blob, pivot);
        pivot = this.readModuleHeader(blob, pivot);

        return pivot;
    }

    /**
     * Reads & deserializes the fixed-header part of the given header into this packer.
     * @param blob
     * @param {number} start - The reading position in the blob
     * @return {number} The reading position after reading the fixed header
     */
    readFixedHeader(blob, start)
    {
        let pivot = start;
        let fixedHeader = this.constructor.FIXED_HEADER;
        if(blob.length < pivot + fixedHeader.length)
            throw Error("Could not find fixed header, blob was too short to contain it.");
        pivot += fixedHeader.length;
        let sliced = _.slice(blob, start, pivot).join('');
        if(sliced != fixedHeader)
            throw Error("Could not find expected fixed header in blob. Found " + sliced);
        return pivot;
    }

    /**
     * Reads & deserializes the version part of the given header into this packer.
     * @param blob
     * @param {number} start - The reading position in the blob
     * @return {number} The reading position after reading the version.
     */
    readVersion(blob, start)
    {
        let pivot = start + 3;
        if(blob.length < pivot)
            throw Error("Could not find version, blob was too short to contain it.");
        let sliced = _.slice(blob, start, pivot);
        sliced = sliced.map(function(item){
            return item.charCodeAt(0);
        });
        this.version.setFromArray(sliced);

        return pivot;
    }

    /**
     * Reads & deserializes the module-header part of the given header into this packer.
     * @param blob
     * @param {number} start - The reading position in the blob
     * @return {number} The reading position after reading the module header.
     */
    readModuleHeader(blob, start)
    {
        let pivot = start+1;
        let module = "";
        if(blob[start] != '!')
            throw Error("Could not find module, blob section did not start with '!' but " + blob[start]);
        for(; pivot < blob.length; pivot++)
        {
            let char = blob[pivot];
            if(char == '\n')
            {
                break;
            }
            module += blob[pivot];
        }
        this.module = module;
        return pivot;
    }


    /**
     * Reads & deserialized the indexes of available blocks
     * @param blob
     * @param {number} start - The start of the reading position in the blob
     * @return {number} The reading position after reading the module header. Should be the index right after the blobs end
     */
    readBlockIndex(blob, start)
    {
        let pivot = start;
        while(pivot < blob.length)
        {
            pivot = this.readSingleBlockIndex(blob, pivot);
        }
        return pivot;
    }
    /**
     * Reads & deserialized a single block index into this packer
     * @param blob
     * @param {number} start - The start of the reading position in the blob
     * @return {number} The reading position after the block (not only the index)
     */
    readSingleBlockIndex(blob, start)
    {
        if(blob.length < start)
            return start; //Nothing left to read
        let blockType = blob[start];
        let blockLength = _.slice(blob, start+1, start+9);

        if(blob.length < start+9+blockLength)
            throw new Error("Could not read block, blob ended too soon");

        this.blocks.push({start: start, type: blockType, length: blockLength});
    }

    /**
     * @return {string}
     */
    static get FIXED_HEADER()
    {
        return "#!METADOSSIER\n";
    }

    static createHeader(version, module)
    {
        let header = this.FIXED_HEADER;

        version = new MetadossierVersion(version);
        module = this.createModuleHeader(module);

        header += version.toBuffer().toString();
        header += module;

        return header;
    }

    static createModuleHeader(module)
    {
        return "!"+module.toString()+"\n".toLowerCase();
    }
}

/*
 let packed = MetadossierPacker.createHeader("3.4.6", "lvl2").toString();
 console.log(packed);

 let packer = new MetadossierPacker();
 packer.readHeader(packed, 0);

 console.log(packer);

 */

/*
let proto = {

    createFileHeader: function(modulePrefix, version)
    {
        var dossierHeader = "";
        dossierHeader += proto.FIXED_HEADER;

        version = new MetadossierVersion(version);
        dossierHeader += version.toBuffer().toString();

        dossierHeader += proto.get_MODULE_HEADER(modulePrefix);

        return dossierHeader;
    },

    createDossier: function(topic, modulePrefix, owner, workspace, callback){




        FSRawStorage.writeDossierRaw(topic, modulePrefix, owner, workspace,
            dossierHeader,
            function(){
            callback();
        });
    },

    FIXED_HEADER: "#!METADOSSIER\n",
    get_MODULE_HEADER: function(modulePrefix){
        return "!"+modulePrefix+"\n".toLowerCase();
    },


    openDossier: function(topic, modulePrefix, owner, workspace, callback){
        FSRawStorage.readDossierRaw(topic, modulePrefix, owner, workspace, function(err, raw){
            if(err)
            {
                return Util.invoke(callback, err, raw);
            }
            if(raw) //There are file contents, now validate them
            {
                let fp = 0;
                //Validate header
                let fixedHeader = proto.FIXED_HEADER;
                if(raw.length < fp + fixedHeader.length)
                    return Util.invoke(callback, new Error("Header mismatch; Wrong length"), raw);
                if(_.slice(raw, 0, fixedHeader.length).toString() == fixedHeader)
                    return Util.invoke(callback, new Error("Header mismatch; Wrong signature"), raw);
                fp += fixedHeader.length;

                //Validate module header
                let moduleHeader = proto.get_MODULE_HEADER(modulePrefix);
                if(raw.length < fp + moduleHeader.length)
                    return Util.invoke(callback, new Error("Module header mismatch; Wrong length"), raw);
                if(_.slice(raw, fp, moduleHeader.length).toString() == fixedHeader)
                    return Util.invoke(callback, new Error("Module header mismatch; Wrong signature"), raw);
                fp += moduleHeader.length;

            }
        });
    }


};
*/


/*
proto.createDossier(topic, "lvl2", "wortex17", "a0", function(err, xx){
    if(err)
        return console.error(err);
    proto.openDossier(topic, "lvl2", "wortex17", "a0", function(err, xx){
        if(err)
            return console.error(err);
    })
});

/*
FSRawStorage.writeDossierRaw(topic, "lvl2", "wortex17", "a0", 'BLOB', function(err){
    if(err)
    {
        console.error(err);
    } else {
        FSRawStorage.readDossierRaw(topic, "lvl2", "wortex17", "a0", function(err, dossier){

            if(err) {
                console.error(err);
            } else {
                console.log(dossier);
            }
        });
    }
});
    */