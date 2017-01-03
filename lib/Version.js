"use strict";

let
    _ = require("lodash")
    ;

class MetadossierVersion {
    /**
     *
     * @param {string|MetadossierVersion} [version]
     */
    constructor(version)
    {
        this.major = 0;
        this.minor = 0;
        this.patch = 0;
        if(version instanceof MetadossierVersion)
        {
            this.major = version.major;
            this.minor = version.minor;
            this.patch = version.patch;
        } else if(_.isString(version))
        {
            this.setFromString(version);
        }
    }

    static validate(major, minor, patch)
    {
        if(!_.isSafeInteger(major))
            throw new TypeError("'Major' part of version does not represent a safe integer. (Is " + major + ")");
        if(!_.isSafeInteger(minor))
            throw new TypeError("'Minor' part of version does not represent a safe integer. (Is " + minor + ")");
        if(!_.isSafeInteger(patch))
            throw new TypeError("'Patch' part of version does not represent a safe integer. (Is " + patch + ")");
    }

    setVersion(major, minor, patch)
    {
        this.constructor.validate(major, minor, patch);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    setFromArray(version)
    {
        if(!_.isArray(version))
            throw new TypeError("Expected an array, received " + typeof version);
        this.setVersion(version[0], version[1], version[2]);
    }

    setFromString(version)
    {
        if(!_.isString(version))
            throw new TypeError("Expected a string, received " + typeof version);
        version = version.split('.');

        version[0] = (version.length > 0) ? parseInt(version[0]) : 0;
        version[1] = (version.length > 1) ? parseInt(version[1]) : 0;
        version[2] = (version.length > 2) ? parseInt(version[2]) : 0;
        this.setFromArray(version);
    }

    toArray()
    {
        return [this.major, this.minor, this.patch];
    }

    toBuffer()
    {
        return new Buffer(this.toArray());
    }
}

module.exports = MetadossierVersion;