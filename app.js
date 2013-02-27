var http = require('http');
var env = require('./app/config/env.json').env;
var config = require('./app/config/'+env+'/config');
var Robot = require('./lib/robot').Robot;
var fs = require('fs');
var robots = [];
//
// node main master run service
//
var run = function(num) {
    for (var i = 0 ;i < num;i++) {
        var robot = new Robot(config);
        var path = __filename.substring(0,__filename.lastIndexOf('/'));
        var scriptFile = path + '/app/script/mqtt.js';
        robot.runAgent(scriptFile);
        robots.push(robot);
    }
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
                var actors = {};
                for (var i=0;i<robots.length;i++){
                    actors = robots[i].agent.actors || {};
                    break;
                }
                var stats = {size:robots.length,actors:actors};
                return res.end(JSON.stringify(stats) + "\n");
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
            var num = url.query['num'] || 1;
            run(num);
            return res.end("OK\n" + num);
        }
    }
    res.writeHead(404);
    res.end("<h1>404<h1>\n");
}).listen(5555);



process.on('uncaughtException', function(err) {
  console.error(' Caught exception: ' + err.stack);
  if (robots.length>0){
    robots[1].agent.socket.emit('crash',err.stack);
  }
});
