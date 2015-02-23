"use strict";

var browserSync = require("../../../../index");

var request = require("supertest");
var assert  = require("chai").assert;

describe("E2E server test", function () {

    this.timeout(5000);

    var instance;

    before(function (done) {

        browserSync.reset();

        var config = {
            server: {
                baseDir: "test/fixtures",
                index: "index.htm"
            },
            ghostMode: {
                clicks: false,
                scroll: false
            },
            logLevel: "silent",
            open: false,
            files: ["*.html"]
        };

        instance = browserSync(config, function (err) {
            if (err) {
                throw err;
            }
            done();
        }).instance;
    });

    after(function () {
        instance.cleanup();
    });

    it.only("serves files with the snippet added", function (done) {

        assert.isString(instance.options.get("snippet"));

        request(instance.options.getIn(["urls", "local"]))
            .get("/index.html")
            .set("accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                assert.include(res.text, instance.options.get("snippet"));
            });
    });

    it("serves the client script", function (done) {

        request(instance.server)
            .get(instance.options.getIn(["scriptPaths", "versioned"]))
            .expect(200)
            .end(function (err, res) {
                assert.include(res.text, "Connected to BrowserSync");
                done();
            });
    });
});
