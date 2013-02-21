var Agent = require('./agent/agent').Agent;
var Server = require('./master/server').Server;
var HTTP_SERVER = require('./console/http').HTTP_SERVER;

/**
 * export to developer prototype
 * 
 * @param {Object} config
 * include deal with master and agent mode
 * 
 * param include mode
 *
 */
var Robot = function(config){
  this.args = process.argv;
  this.mode = 'master';
  this.config = config;
  this.master =null;
  this.apps = null;
  this.clients = null;
  this.init();
};

/**
 * parse the args
 *
 *
 */
Robot.prototype.init = function(){
  var args = this.args;
  var config = this.config;
  var i = 2;
  if (args.length > 2){
    this.mode = args[i++];
  }
  this.master = config.master;
  this.apps = config.apps;
  this.clients = config.clients;
  };

  /*
   * run master server
   *
   * @param {String} start up file
   *
   */ 
  Robot.prototype.runMaster = function(startUpFile) {
    var conf = {},agent = null,server;
    if (this.mode !== 'master') {throw new Error(' mode must be master,it is %j',this.mode);}
    conf.clients = this.clients;
    conf.main = startUpFile; 
    server = new Server(conf);
    server.listen(this.master.port);
    HTTP_SERVER.start(this.master.webport);
  };

  /**
   * run agent client 
   *
   * @param {Array} data
   * @param {String} script
   *
   */ 
  Robot.prototype.runAgent = function(script) {
    var conf = {};
    conf.master = this.master;
    conf.apps = this.apps;
    conf.script = script;
    agent = new Agent(conf);
    agent.start();
  };

  exports.Robot = Robot;
