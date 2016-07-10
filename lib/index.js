/*!
 * jsodvcs
 * https://github.com/wortex17/node-metadossier
 * Created 10.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

/**
 * Root namespace of the metadossier module for NodeJS.
 * @namespace
 */
let MetaDossier = {};

module.exports = MetaDossier;

if (require.main === module) {
    require("./sandbox");
}