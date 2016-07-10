/*!
 * jsodvcs
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
    fswin = require("fswin")
    ;

function _invoke(callback)
{
    if(_.isFunction(callback))
    {
        let args = _.toArray(arguments);
        args.shift();
        return callback.apply(this, args);
    }
}

console.log("Helloooo");

/**
 * Raw access to file-system dossier storage
 */
let raw = {
    /**
     * Returns the file-system directory path where dossiers would be stored
     * for a specific topic and module.
     * @param {string} topic - The topic of the dossier. For file-system dossiers, this would be a directory path.
     * @param {string} modulePrefix - The module-prefix that is used separate dossiers for different modules.
     */
    getDossierDirectoryPath: function(topic, modulePrefix)
    {
        topic = ""+topic;
        modulePrefix = ""+modulePrefix;
        return path.join(topic, "."+modulePrefix);
    },
    /**
     * Returns the file-system path where a dossier for a specific topic, owner and workspace
     * would be stored relative to the dossier directory path.
     * @param {string} topic - The topic of the dossier. For file-system dossiers, this would be a directory path.
     * @param {string} owner - UserID of owner of the dossier. Dossiers are separated by owners.
     * @param {string} workspace - Workspace of the dossier. Dossiers of a single owner are separated by workspaces.
     */
    getDossierBlobPath: function(topic, owner, workspace)
    {
        owner = ""+owner;
        workspace = ""+workspace;
        return path.join(owner, workspace);
    },
    /**
     * Returns the file-system path where the dossier for a specific topic would be stored.
     * @param {string} topic - The topic of the dossier. For file-system dossiers, this would be a directory path.
     * @param {string} modulePrefix - The module-prefix that is used separate dossiers for different modules.
     * @param {string} owner - UserID of owner of the dossier. Dossiers are separated by owners.
     * @param {string} workspace - Workspace of the dossier. Dossiers of a single owner are separated by workspaces.
     */
    getDossierPath: function(topic, modulePrefix, owner, workspace)
    {
        return path.join(
            raw.getDossierDirectoryPath(topic, modulePrefix),
            raw.getDossierBlobPath(topic, owner, workspace)
        );
    },

    getTopicStats: function(topic, callback)
    {
        fs.stat(topic, function (err, stats) {
            if(err)
            {
                switch (err.code) {
                    case 'ENOENT':
                        err.message = "No such topic for a dossier exists; " + err.code + "@'" + err.path + "'";
                        break;
                    default:
                        err.message = "Topic does not allow a dossier to exist; " + err.code + "@'" + err.path + "'";
                        break;
                }
            }
            callback(err, stats);
        });
    },

    /**
     * Raw reads the dossier storage
     */
    readDossierBlob: function (topic, modulePrefix, owner, workspace, callback)
    {
        raw.getTopicStats(topic, function (err, stats) {
            if (err) {
                err.message = "Dossier is not accessible; " + err.message;
                err.topic = topic;
                return _invoke(callback, err);
            }
            if (stats.isDirectory()) {
                let dossierFSPath = raw.getDossierPath(topic, modulePrefix,owner, workspace);
                fs.readFile(dossierFSPath, function(err, blobContents){
                    if(err)
                    {
                        switch (err.code) {
                            case 'ENOENT':
                                //Not considered an error (just a "new" dossier)
                                err = null;
                                break;
                            default:
                                err.message = "Dossier is not accessible; " + err.code + "@'" + err.path + "'";
                                break;
                        }
                        err.topic = topic;
                    }
                    return _invoke(callback, err, blobContents);
                });
            } else {
                return _invoke(callback, new Error("Topic does not allow a dossier to exist; Topic needs to be a valid directory."));
            }
        });
    },
    /**
     * Raw overwrites the dossier storage
     */
    writeDossierBlob: function (topic, modulePrefix, owner, workspace, blobContents, callback)
    {
        raw.getTopicStats(topic, function (err, stats) {
            if(err)
            {
                err.message = "Dossier is not accessible; " + err.message;
                err.topic = topic;
                return _invoke(callback, err);
            }
            if (stats.isDirectory()) {
                let dossierDirPath = raw.getDossierDirectoryPath(topic, modulePrefix);
                let dossierFSPath = raw.getDossierPath(topic, modulePrefix,owner, workspace);
                mkdirp(path.dirname(dossierFSPath), function(err){
                    if(err)
                    {
                        err.message = "Dossier is not accessible; " + err.code + "@'" + err.path + "'";
                        return _invoke(callback, err);
                    }
                    fswin.setAttributes(dossierDirPath,{
                        IS_ARCHIVED:true,
                        IS_HIDDEN:true,
                        IS_NOT_CONTENT_INDEXED:true
                        //IS_SYSTEM:true //Required for icons
                    },function(success){
                        //Ignore win attribute success
                        fs.writeFile(dossierFSPath, blobContents, function(err){
                            return _invoke(callback, err);
                        });
                    });
                });
            } else {
                return _invoke(callback, new Error("Topic does not allow a dossier to exist; Topic needs to be a valid directory."));
            }
        });
    }
};



let topic = "F:/DWPersonal/Projekte/dws/Infrablack/node-metadossier/testbox";


raw.writeDossierBlob(topic, "lvl2", "wortex17", "a0", 'BLOB', function(err){
    if(err)
    {
        console.error(err);
    } else {
        raw.readDossierBlob(topic, "lvl2", "wortex17", "a0", function(err, dossier){

            if(err) {
                console.error(err);
            } else {
                console.log(dossier);
            }
        });
    }
});

