var http = require('http');
var io = require('socket.io');

actor.logLevel(1);

var vid = 0;

function makeRequest(vid) {
    var config= actor.conf;
    actor.emit('inproc','get');
    actor.emit('req','get');
    actor.emit('monitorStart','get',vid);
    var req = http.request({host:config.apps.host, port:config.apps.port, agent:false});
    req.setNoDelay();

    req.on('response', function(res) {
        actor.emit('res','get');
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          //console.log('BODY: ' + chunk);
        });
        res.on('end', function() {
            actor.emit('monitorEnd','get',vid);
            actor.emit('ended_req','get');
        });
        res.on('error', function(error) {
            actor.emit('errors_resp','get');
            actor.emit('error',error.message);
        });
    });
    req.on('error', function(error) {
        actor.emit('errors_req','get');
        actor.emit('error',error.message);
    });
    req.end();
}

actor.interval(function(){
    makeRequest(vid++);
},1000)
