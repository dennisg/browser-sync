var ThrottleGroup = require('stream-throttle').ThrottleGroup;
var utils = require("./utils.js");

module.exports = function wrapServer(bs) {

    var server = throttleServer(bs.getOption("internal-port"), bs);

    server.listen(bs.getOption("port"), "0.0.0.0");

    server.on('listening', function() {
        bs.logger.info("Throttle Server Listening...");
    });

    server.on('error', function(err) {
        console.log(err);
    });
};

/**
 *
 */
function throttleServer (port, bs) {

    var options        = bs.options.get("throttle").toJS();

    bs.events.on("options:set", function (data) {
        if (Array.isArray(data.path)) {
            if (data.path[0] === "throttle") {
                options = bs.options.get("throttle").toJS();
            }
        }
    });

    var url = require("url").parse(bs.options.getIn(["urls", "local"]));

    var opts = {
        //key: certs.key,
        //cert: certs.cert,
        allowHalfOpen: true
        //rejectUnauthorized: false
    };

    //var server = require("tls").createServer(opts, function (local) {
    return require("net").createServer(opts, function (local) {

            var remote = require("net").createConnection({
                host: "localhost",
                port: port,
                allowHalfOpen: true
                //rejectUnauthorized: false
            });

            console.log(options.downstream);
            var upThrottle     = new ThrottleGroup({ rate: options.upstream });
            var downThrottle   = new ThrottleGroup({ rate: options.downstream });

            local.pipe(upThrottle.throttle()).pipe(remote);
            remote.pipe(downThrottle.throttle()).pipe(local);

            local.on('error', function(err) {
                bs.logger.debug("{red:Local Error: [%s]", err.message);
                remote.destroy();
                local.destroy();
            });

            remote.on('error', function(err) {
                bs.logger.debug("{red:Remote Error: [%s]", err.message);
                local.destroy();
                remote.destroy();
            });
    });
}
