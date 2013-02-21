var http = require('http');
var io = require('socket.io');

robot.logLevel(1);

var vid = 0;

function makeRequest(vid) {
    var config= robot.config;
    robot.emit('inproc','get');
    robot.emit('req','get');
     robot.emit('monitorStart','get',vid);
    robot.emit('error','errorerrorerrorerrorerror');
    var req = http.request({host:config.apps.host, port:config.apps.port, agent:false});
    req.setNoDelay();

    req.on('response', function(res) {
        robot.emit('res','get');
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          //console.log('BODY: ' + chunk);
        });
        res.on('end', function() {
            robot.emit('monitorEnd','get',vid);
            robot.emit('ended_req','get');
        });
        res.on('error', function() {
            robot.emit('errors_resp','get');
        });
    });
    req.on('error', function(error) {
        robot.emit('errors_req','get');
    });
    req.end();
}

robot.interval(function(){
    makeRequest(vid++);
},5000)
