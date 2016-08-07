/*!
 * node-metadossier
 * https://github.com/wortex17/node-metadossier
 * Created 15.07.2016 by Patrick Michael Hopf
 *
 * Released under The MIT License
 */
"use strict";

let
    fs = require('fs'),
    path = require('path')
    ;
let
    chai = require('chai')
    ,expect = chai.expect,
    mkdirp = require("mkdirp"),
    rmdir = require("rmdir")
    ;
let
    FSRawStorage = require("../lib/FSRawStorage")
    ;

describe('Internal Module: FSRawStorage', function() {

    describe('static methods', function(){
        describe('#getDossierDirectoryPath', function() {
            context("when passing topic{string} and modulePrefix{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierDirectoryPath("topic", "prefix");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierDirectoryPath("topic");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing no arguments", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierDirectoryPath();
                    expect(result).to.be.a.string;
                });
            });
        });
        describe('#getDossierBlobPath', function() {
            context("when passing topic{string}, owner{string} and modulePrefix{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierBlobPath("topic", "owner", "prefix");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string} and owner{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierBlobPath("topic", "owner");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierBlobPath("topic");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing no arguments", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierBlobPath();
                    expect(result).to.be.a.string;
                });
            });
        });
        describe('#getDossierPath', function() {
            context("when passing topic{string}, modulePrefix{string}, owner{string} and workspace{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierPath("topic", "prefix", "owner", "workspace");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string}, modulePrefix{string} and owner{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierPath("topic", "prefix", "owner");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string} and modulePrefix{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierPath("topic", "prefix");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing topic{string}", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierPath("topic");
                    expect(result).to.be.a.string;
                });
            });
            context("when passing no arguments", function(){
                it('should return a string', function(){
                    let result = FSRawStorage.getDossierPath();
                    expect(result).to.be.a.string;
                });
            });
        });
    });

    describe('disk methods', function(){

        let testDir = "./temp/";
        let topic = path.join(testDir, "./topic");
        let topicAsFile = path.join(testDir, "./topicAsFile");

        beforeEach(function(done) {
            mkdirp(topic, function(){
                fs.writeFile(topicAsFile, "TopicAsFile", function(){
                    done();
                });
            })
        });

        afterEach(function(done) {
            rmdir(testDir, function(){
                done();
            })
        });

        describe('#getTopicStats', function() {
            context('when topic(directory) does not exist', function(){
                it('should return an error', function(done){
                    FSRawStorage.getTopicStats("noexist", function(err, stats){
                        expect(err).to.be.an.error;
                        expect(stats).to.be.undefined;
                        done();
                    });
                });
            });
            context('when topic(directory) exists', function(){
                it('should return directory stats', function(done){
                    FSRawStorage.getTopicStats(topic, function(err, stats){
                        expect(err).to.be.null;
                        expect(stats).to.be.an.object;
                        done();
                    });
                });
            });
            context('when topic(file) exists', function(){
                it('should return an error', function(done){
                    FSRawStorage.getTopicStats(topicAsFile, function(err, stats){
                        expect(err).to.be.null;
                        expect(stats).to.be.an.object;
                        done();
                    });
                });
            });
        });

        describe('#writeDossierRaw', function() {
            context('when topic(directory) does not exist', function(){
                it('should return an error', function(done){
                    FSRawStorage.writeDossierRaw("noexist", "tst", "usr", 0, "CONTENTS", function(err){
                        expect(err).to.be.an.error;
                        done();
                    });
                });
            });
            context('when topic(file) exists', function(){
                it('should return an error', function(done){
                    FSRawStorage.writeDossierRaw(topicAsFile, "tst", "usr", 0, "CONTENTS", function(err){
                        expect(err).to.be.an.error;
                        done();
                    });
                });
            });
            context('when topic(directory) exists', function(){
                it('should return directory stats', function(done){
                    FSRawStorage.writeDossierRaw(topic, "tst", "usr", 0, "CONTENTS", function(err){
                        expect(err).to.be.null;
                        done();
                    });
                });
            });
        });

        describe('#readDossierRaw', function() {
            context('when topic(directory) does not exist', function(){
                it('should return an error', function(done){
                    FSRawStorage.readDossierRaw("noexist", "tst", "usr", 0, function(err, rawContents){
                        expect(err).to.be.an.error;
                        expect(rawContents).to.be.undefined;
                        done();
                    });
                });
            });
            context('when topic(file) exists', function(){
                it('should return an error', function(done){
                    FSRawStorage.readDossierRaw(topicAsFile, "tst", "usr", 0, function(err, rawContents){
                        expect(err).to.be.an.error;
                        expect(rawContents).to.be.undefined;
                        done();
                    });
                });
            });
            context('when topic(directory) exists but dossier does no exist', function(){
                it('should return directory stats', function(done){
                    FSRawStorage.readDossierRaw(topic, "tst", "usr", 0, function(err, rawContents){
                        expect(err).to.be.an.error;
                        expect(rawContents).to.be.undefined;
                        done();
                    });
                });
            });
            context('when topic(directory) and dossier exist', function(){
                FSRawStorage.writeDossierRaw(topic, "tst", "usr", 0, "CONTENTS", function(err){
                    it('should return dossier rawContents', function(done){
                        FSRawStorage.readDossierRaw(topic, "tst", "usr", 0, function(err, rawContents){
                            expect(err).to.be.null;
                            expect(rawContents.toString()).to.equal("CONTENTS");
                            done();
                        });
                    });
                });
            });
        });
    });

});
