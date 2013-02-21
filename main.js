var config = require('./app/config/config');
var Robot = require('./lib/main').Robot;
var fs = require('fs');

//
// node main dev master run service
//
var robot = new Robot(config);

if (robot.mode==='master') {
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
