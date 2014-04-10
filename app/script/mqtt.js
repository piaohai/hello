var mqtt = require('mqttjs');
var events = ['connack', 'puback', 'publish', 'pubcomp', 'suback'];

// var host = '123.58.180.233';
// var port = 3011;
var host = '123.58.180.26';
var host = '54.250.75.221';
var port = 8887;

var count = 20000;

var domain = 'test.news.163.com';
var productKey = "6cdb8bab43bd49b18352b31fc6a9c991";
var platform = "android";
// var expire_time = Date.now() + 24*60*60*1000;
var expire_time = "1379249901959";
var nonce = "zmusFan1XZArygUX";
var signature = "/eJ/FwuDydiFQ0p+RlR7NXTG5Ak=";
// var user = 'lwj';
var nameList = ['abc', 'bcd', 'cde', 'def', 'efg',
  'fgh', 'ghi', 'hij', 'ijk', 'jkl'];
var user = nameList[0];
var randomV = Math.floor((Math.random() * nameList.length));
user = nameList[randomV];

var id = typeof actor!='undefined'?actor.id:-2;
var deviceId = 'android_' + id;
var fileName = '/tmp/times';
var passed = 'qa1234';
var interval = 20000;

var timestamp = 0;
var retry = 0;
var isFirst = true;
var lastTimeOut = 0;

var REGISTER = 0;
var REGBIND = 1;
var BIND = 2;
var RECONNECT = 3;

var START = 'start';
var END = 'end';

var verPrefix = '0.1.';
var randomN = Math.floor((Math.random() * 20) + 1);
//var productVersion = '0.2.2';
// console.log('productVersion = ', productVersion);
var verPrefix = '0.1.';
var randomN = Math.floor((Math.random() * 20) + 1);
var productVersion = verPrefix + randomN;

var monitor = function(type,name,reqId){
  if (typeof actor!='undefined') {
    actor.emit(type,name,reqId);
  } else {
    console.error(Array.prototype.slice.call(arguments,0));
  }
}

var updateTimestamp = function(message, actObj) {
  if(!message.topic) {
    return;
  }
  var type = message.topic.split('/')[1];
 
  var payload = JSON.parse(message.payload);
  switch(type) {
    case 'broadcast':
      /*
			if (!!actObj) {
				actObj.broadcastAck(payload);
			}
      */
    case 'specify':
      var length = payload.length;
      monitor('incr', type);
      timestamp = payload[length - 1]['timestamp'];
      break;
  }
}

var isDebug = function(){
  if (typeof actor!='undefined'){
    return actor.mode;
  } else {
    return true;
  }
}



var connect = function (port,host) {
  mqtt.createClient(port, host, function(err, client) {
    var act = new Action(client);
    if (err) {
      console.log(err + '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      monitor('incr','connerror');
      lastTimeOut += Math.floor(Math.random() * 2 * 60 * 1000);
			lastTimeOut = 1 * 60 * 1000;
      setTimeout(function(){
        if (retry <= 5) {
          connect(port,host);
        }
        monitor('incr', 'reconnect'); 
        console.error('over ' + retry + ' times ' + lastTimeOut);
        retry++;
      }, lastTimeOut);
      return;
    }
    client.on('close',function(event){
			return connect(port, host);	
			console.log('close~~~~~~~~~~~~~~~~~~~~~~', new Date());
			setTimeout(function() {
			}, 60 * 1000)
    })
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
       var test = function(event){
	      client.on(event, function(packet) {
	      	console.log('ononononoononononoononononoonononono~~~~~' + event);
	      	//client.end();
	        if (!packet) return;
	        //if (isDebug()){
	          //console.log(packet);
	        //}
	        //console.log(packet);
	        monitor('incr',packet.cmd);
	        //updateTimestamp(packet, act);
	        if (!!act[packet.cmd]) {
	          act[packet.cmd].apply(act,[packet]);
	        }
	      });
      };
      test(e);
    }
    client.connect({keepalive: interval, will: {topic: "verify",payload:JSON.stringify({key: "6a60565dc2b2f914ff104de34c06b37b"})}, qos: 1});
    //client.connect({keepalive: interval});
    client.on('connack', function(packet) {
      console.log('connack~~~~~');
      if (!!isFirst) {
      	console.log('isFirstisFirstisFirstisFirst~~~~~');
        act.register();
      } else {
      	console.log('reconnectreconnectreconnectreconnectreconnect~~~~~' + Date.now());
        act.reconnect();
      }
      setInterval(function() {client.pingreq();},interval);
     });
  });
};

(function(count){
for (var i=0;i<count;i++) {
	connect(port,host);
}
})(count);

var Action = function(client){
  this.msgId = 1;
  this.client = client;
}

Action.prototype.subscribe = function() {
  var msgId = 1;
  this.client.subscribe({messageId: msgId, subscriptions: [{topic: '/topic', qos: 1}]});
}

Action.prototype.register = function() {
  this.subscribe();
  return;
  isFirst = false;
  var topic = domain + '/register';
  var payload = {"platform":platform,'deviceId':deviceId,"domain":domain,"productKey":productKey,"productVersion":productVersion};
  monitor(START,'register',REGISTER);
  monitor('incr','register');
  this.send(topic,1,payload);
}

Action.prototype.connack = function(packet){

}

Action.prototype.puback = function(packet){

}

Action.prototype.publish = function(packet){
  var topic = packet.topic;
  var name = topic.substring(topic.indexOf('/')+1,topic.length);
  if (typeof this[name]==='undefined'){
		return;
  }
  this[name](JSON.parse(packet.payload));
}

Action.prototype.pubcomp = function(packet){

}

Action.prototype.suback = function(packet){
}

Action.prototype.specify = function(payload){
  var msgs= payload;
  var ids = [];
  for (var i = 0; i < msgs.length; i++){
      var msg = msgs[i];
      ids.push(msg.msgId);
  }
  var tmpStr = '';
  for (var j = 0; j < ids.length; j++) {
    tmpStr += ids[j] + ';';
  }
  this.ack(tmpStr);
}

Action.prototype.ack = function(ids){
  var topic = domain + '/ack';
  var payload = {"user":user,"msgIds":ids};
  this.send(topic,1,payload);
}

Action.prototype.broadcastAck = function(payload){
  var msgs = payload;
  var ids = [];
  for (var i = 0; i < msgs.length; i++){
      var msg = msgs[i];
      ids.push(msg.msgId);
  }

  var topic = domain + '/broadcastAck';
  var newPayload = {"user":user, "msgIds":ids};
  this.send(topic, 1, newPayload);
}
 



Action.prototype.registerack = function(payload){
  monitor(END,'register',REGISTER);
  monitor('incr','registerack');
  if (payload.code===200) {
    //this.regbind();
  } else {
    monitor('incr','incr ' + payload.code);
  }
}


Action.prototype.send = function(topic,qos,payload) {
  this.msgId++;
  this.client.publish({messageId: this.msgId, topic:topic,qos:qos,payload:JSON.stringify(payload)});
}

Action.prototype.regbind = function(){
  var self = this;
  var topic = domain + '/reg_bind';
  monitor(START,'regbind',REGBIND);
  var payload = {"platform":platform,"user":user,"timestamp":timestamp ,"expire_time":expire_time,"nonce":nonce,"signature":signature,"productKey":productKey,"deviceId":deviceId,"domain":domain};
  self.send(topic,1,payload);
}
 

Action.prototype.bind = function(){
  var topic = domain + '/bind';
  monitor(START,'bind',BIND);
  var payload = {"platform":platform,"user":user,"expire_time":expire_time,"signature":signature,"productKey":productKey,'deviceId':deviceId,"domain":domain};
  this.send(topic,1,payload);
}

Action.prototype.unbind = function(){
  var topic = domain + '/cancel_bind';
  var payload = {"user":user,"platform":platform,"domain":domain};
  this.send(topic,1,payload);
}
 
Action.prototype.reconnect = function(){
  console.log('reconnect ~~~~~~~~~~~~~~~~~~~~~~~');
  var self = this;
  var topic = domain + '/reconnect';
  monitor(START,'reconnect',RECONNECT);
  var payload = {'deviceId':deviceId,"domain":[domain],"timestamp": timestamp};
  self.send(topic,1,payload);
}

Action.prototype.bindack = function(payload){
 if (payload.code>0) {
    monitor(END,'regbind',REGBIND);
    //console.log(payload);
    //this.login();
  } else {
    monitor('incr','incr ' + payload.code);
  }
}
