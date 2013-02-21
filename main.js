var config = require('./app/config/config');
var Robot = require('./lib/robot').Robot;
var fs = require('fs');

//
// node main dev master run service
//
var robot = new Robot(config);


var mode = 'master';

if (process.argv.length > 2){
    mode = process.argv[2];
}
 
if (mode !== 'master' && mode !== 'client') {
	throw new Error(' mode must be master or client');
}

if (mode==='master') {
    robot.runMaster(__filename);
} else {
    var script = fs.readFileSync(process.cwd() + '/app/config/script.js', 'utf8');
    robot.runAgent(script);
}

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
	fs.appendFile('.log', err.stack, function (err) { });
	setTimeout(function(){
		process.exit(1);
	},10000)
});
