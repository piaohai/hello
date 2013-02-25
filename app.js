var http = require('http');
var env = require('./app/config/env.json').env;
var config = require('./app/config/'+env+'/config');
var Robot = require('./lib/robot').Robot;
var fs = require('fs');
var robots = [];
//
// node main master run service
//

var run = function() {
    var robot = new Robot(config);
    var path = __filename.substring(0,__filename.lastIndexOf('/'));
    var scriptFile = path + '/app/script/mqtt.js';
    robot.runAgent(scriptFile);
    robots.push(robot);
}

// Controlling server.
http.createServer(function (req, res) {
    if (req.method === "GET") {
        var url = require('url').parse(req.url, true);

        if (url.pathname === '/') {
            // Return stats on '/'
            return res.end(JSON.stringify(config) + "\n");
        }  if (url.pathname === '/stats') {
            // Return stats on '/'
            try {
                return res.end(JSON.stringify(robots) + "\n");
            } catch(ex) {
                return res.end(JSON.stringify(ex.stack) + "\n");
            }
        } else if (url.pathname === '/set') {
            // Set params on '/set', preserving the type of param.
            for (var key in url.query) {
                config['apps'][key] = (typeof config[key] == 'number') ? +url.query[key] : url.query[key];
            }
            return res.end(JSON.stringify(config) + "\n");

        } else if (url.pathname === '/stop') {
            // Restart process on '/restart'
            require('child_process').exec("sudo restart client", function() {});
            return res.end("OK\n");
        }  else if (url.pathname === '/pull') {
            // Restart process on '/restart'
            require('child_process').exec("cd /home/ubuntu/hello && git pull ", function() {});
            return res.end("OK\n");
        } else if (url.pathname === '/reset') {
            return res.end(ok);
        } else if (url.pathname === '/start') {
            // Restart process on '/restart'
            run();
            return res.end("OK\n");
        }
    }
    res.writeHead(404);
    res.end();
}).listen(5555);



process.on('uncaughtException', function(err) {
  console.error(' Caught exception: ' + err.stack);
  if (robots.length>0){
    robots[1].agent.socket.emit('crash',err.stack);
  }
});
