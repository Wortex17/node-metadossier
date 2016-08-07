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
    fswin = require("fswin")
    ;
let
    Util = require("./Util")
    ;


let FSRawStorage = {
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
            FSRawStorage.getDossierDirectoryPath(topic, modulePrefix),
            FSRawStorage.getDossierBlobPath(topic, owner, workspace)
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
                    /* istanbul ignore next */
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
    readDossierRaw: function (topic, modulePrefix, owner, workspace, callback)
    {
        FSRawStorage.getTopicStats(topic, function (err, stats) {
            if (err) {
                err.message = "Dossier is not accessible; " + err.message;
                err.topic = topic;
                return Util.invoke(callback, err);
            }
            if (stats.isDirectory()) {
                let dossierFSPath = FSRawStorage.getDossierPath(topic, modulePrefix,owner, workspace);
                fs.readFile(dossierFSPath, function(err, rawContents){
                    if(err)
                    {
                        switch (err.code) {
                            case 'ENOENT':
                                //Not considered an error (just a "new" dossier)
                                err = null;
                                break;
                            /* istanbul ignore next */
                            default:
                                err.message = "Dossier is not accessible; " + err.code + "@'" + err.path + "'";
                                break;
                        }

                        /* istanbul ignore if */
                        if(err)
                            err.topic = topic;
                    }
                    return Util.invoke(callback, err, rawContents);
                });
            } else {
                return Util.invoke(callback, new Error("Topic does not allow a dossier to exist; Topic needs to be a valid directory."));
            }
        });
    },
    /**
     * Raw overwrites the dossier storage
     */
    writeDossierRaw: function (topic, modulePrefix, owner, workspace, rawContents, callback)
    {
        FSRawStorage.getTopicStats(topic, function (err, stats) {
            if(err)
            {
                err.message = "Dossier is not accessible; " + err.message;
                err.topic = topic;
                return Util.invoke(callback, err);
            }
            if (stats.isDirectory()) {
                let dossierDirPath = FSRawStorage.getDossierDirectoryPath(topic, modulePrefix);
                let dossierFSPath = FSRawStorage.getDossierPath(topic, modulePrefix,owner, workspace);
                mkdirp(path.dirname(dossierFSPath), function(err){

                    /* istanbul ignore if */
                    if(err)
                    {
                        err.message = "Dossier is not accessible; " + err.code + "@'" + err.path + "'";
                        return Util.invoke(callback, err);
                    }
                    fswin.setAttributes(dossierDirPath,{
                        IS_ARCHIVED:true,
                        IS_HIDDEN:true,
                        IS_NOT_CONTENT_INDEXED:true
                        //IS_SYSTEM:true //Required for if we want to set folder-icons
                    },function(success){
                        //Ignore win attribute success
                        fs.writeFile(dossierFSPath, rawContents, function(err){
                            return Util.invoke(callback, err);
                        });
                    });
                });
            } else {
                return Util.invoke(callback, new Error("Topic does not allow a dossier to exist; Topic needs to be a valid directory."));
            }
        });
    }
};
module.exports = FSRawStorage;