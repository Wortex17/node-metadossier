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
    FSRawStorage = require("./FSRawStorage")
    ;

let topic = "F:/DWPersonal/Projekte/dws/Infrablack/node-metadossier/testbox";


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

