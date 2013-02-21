var mqtt = require('mqttjs');
var http = require('http');

var config = require('./app/config/config');
var Robot = require('./lib/main').Robot;
var fs = require('fs');

//
// node main dev master run service
//

var run = function() {
    var robot = new Robot(config);
    var script = fs.readFileSync(process.cwd() + '/app/config/script.js', 'utf8');
    robot.runAgent(script);
 }

// Controlling server.
http.createServer(function (req, res) {
    if (req.method === "GET") {
        var url = require('url').parse(req.url, true);

        if (url.pathname === '/') {
            // Return stats on '/'
            return res.end(JSON.stringify(stats) + "\n");

        } else if (url.pathname === '/set') {
            // Set params on '/set', preserving the type of param.
            for (var key in url.query)
                config[key] = (typeof config[key] == 'number') ? +url.query[key] : url.query[key];
            return res.end(JSON.stringify(config) + "\n");
        
        } else if (url.pathname === '/restart') {
            // Restart process on '/restart'
            require('child_process').exec("sudo restart client", function() {});
            return res.end("OK\n");
        } else if (url.pathname === '/connect') {
            // Restart process on '/restart'
             run();
             return res.end("OK\n");
        }
    }
    res.writeHead(404);
    res.end();
}).listen(5555);

