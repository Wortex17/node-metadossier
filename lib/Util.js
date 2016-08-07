/*!
 * node-metadossier
 * https://github.com/wortex17/node-metadossier
 * Created 15.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

let
    _ = require("lodash")
    ;

/**
 * Calls a function/callback if it is callable
 * @param {function|null|undefined} callback
 * @param {...*} [callbackArguments]
 * @return {*}
 */
exports.invoke = function(callback, callbackArguments)
{
    if(_.isFunction(callback))
    {
        let args = _.toArray(arguments);
        args.shift();
        return callback.apply(this, args);
    }
};