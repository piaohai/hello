var __ = require('underscore');
var io = require('socket.io-client');
var logging = require('../common/logging').Logger;
var Actor = require('./actor').Actor;
var monitor  = require('../monitor/monitor');
var fs = require('fs');

var STATUS_INTERVAL = 10 * 1000; // 10 seconds
var RECONNECT_INTERVAL = 10 * 1000; // 15 seconds
var HEARTBEAT_PERIOD = 30 * 1000; // 30 seconds
var HEARTBEAT_FAILS = 5; // Reconnect after 3 missed heartbeats

/**
 * 
 * @param {Object} conf 
 * init the master and app server for the agent
 * include app data, exec script,etc.
 *
 */
 var Agent = function(conf) {
    this.log = logging;
    this.conf = conf || {};
    this.last_heartbeat = null;
    this.connected = false;
    this.reconnecting = false;
    this.actors = {};
    this.script = "";
    this.count = 0;
};

Agent.prototype = {
    // Create socket, bind callbacks, connect to server
    connect: function() {
        var agent = this;
        var uri = agent.conf.master.host + ":" + agent.conf.master.port;    
        agent.socket = io.connect(uri,{'force new connection':true,'try multiple transports':false});
        agent.socket.on('error', function(reason) {
            agent.reconnect();
        });
        // Register announcement callback
        agent.socket.on('connect', function() {
            agent.log.info("Connected to server, sending announcement...");
            //console.log(agent.socket.socket.sessionid);
            //console.log(require('util').inspect(agent.socket.address,true,10,10));
            agent.announce(agent.socket);
            agent.connected = true;
            agent.reconnecting = false;
            agent.last_heartbeat = new Date().getTime();
        });

        agent.socket.on('disconnect', function() {
            agent.socket.disconnect();
            agent.log.error("Disconnect...");
        });
        // Server heartbeat
        agent.socket.on('heartbeat', function() {
            agent.log.info("Received server heartbeat");
            agent.last_heartbeat = new Date().getTime();
            return;
        });

        // Node with same label already exists on server, kill process
        agent.socket.on('node_already_exists', function() {
            agent.log.error("ERROR: A node of the same name is already registered");
            agent.log.error("with the log server. Change this agent's instance_name.");
            agent.log.error("Exiting.");
            process.exit(1);
        });
        //begin to run
        agent.socket.on('run', function(message) {
            agent.run(message);
        });
    },
    
    run:function(msg){
        var agent = this;
        this.count = msg.maxuser;
        var script = msg.script;
        if (!!script && script.length>1){
            agent.conf.script = script;
        } else {
            console.log(agent.conf.scriptFile);
            try {
                agent.conf.script = fs.readFileSync(agent.conf.scriptFile, 'utf8');
            } catch(ex){
                agent.socket.emit('error',ex.stack);
            }
        }
        agent.log.info(this.nodeId + ' run ' + this.count + ' actors ');
        monitor.clear();
        this.actors = {};
        for (var rid = 0;rid < this.count;rid++) {
           var actor = new Actor(agent.conf,rid);
           this.actors[rid]= actor;
           actor.on('error',function(error){
             agent.socket.emit('error',error);
           });
       };
       __.each(agent.actors,function(ele){try{ele.run();}catch(ex){
        
       }});
       setInterval(function(){
          var timeData = monitor.getData();
          monitor.clear();
          if (__.size(timeData)>0){
            var stats = {req:0, res:0, inproc: 0, errors_req: 0, errors_resp: 0, ended_req: 0,};
             __.each(agent.actors,function(ele){
                stats.req+=ele.rstats.req;
                stats.res+=ele.rstats.res;
                stats.inproc+=ele.rstats.inproc;
                stats.errors_req+=ele.rstats.errors_req;
                stats.errors_resp+=ele.rstats.errors_resp;
                stats.ended_req+=ele.rstats.ended_req;
                ele.resetRstats();
            });
            agent.socket.emit('report',{id:agent.nodeId,timeData:timeData,countData:stats});
          }
      },STATUS_INTERVAL);
   },

    // Run agent
    start: function() {
        var agent = this;
        agent.connect();
        // Check for heartbeat every HEARTBEAT_PERIOD, reconnect if necessary
        setInterval(function() {
            var delta = ((new Date().getTime()) - agent.last_heartbeat);
            if (delta > (HEARTBEAT_PERIOD * HEARTBEAT_FAILS)) {
                agent.log.warn("Failed heartbeat check, reconnecting...");
                agent.connected = false;
                agent.reconnect();
            }
        }, HEARTBEAT_PERIOD);
    },
    // Sends announcement 
    announce: function(socket) {
     var agent = this;
     var sessionid = agent.socket.socket.sessionid;
     agent.nodeId = sessionid;
         this._send('announce_node', {
            client_type:'node',
            nodeId:sessionid
        });
    },

    // Reconnect helper, retry until connection established
    reconnect: function(force) {
        var agent = this;
        if (!force && agent.reconnecting) { return; }
        this.reconnecting = true;
        if (agent.socket!=null){
            agent.socket.disconnect();
            agent.connected = false;
        }
        agent.log.info("Reconnecting to server...");
        setTimeout(function() {
            if (agent.connected) { return; }
            agent.connect();
        }, RECONNECT_INTERVAL);
    },
    _send: function(event, message) {
        try {
            this.socket.emit(event, message);
            // If server is down, a non-writeable stream error is thrown.
        } catch(err) {
            this.log.error("ERROR: Unable to send message over socket.");
            this.connected = false;
            this.reconnect();
        }
    }
};

exports.Agent = Agent;
