var mqtt = require('mqttjs');
var fs = require('fs');
var events = ['connack', 'puback', 'publish', 'pubcomp', 'suback'];

//const data
var port = 3010;
//var host = 'localhost';
var host = '114.113.202.154';
//var host = '192.168.144.199';
var fileName = './times';
var domain = 'blog.163.com';
var id = Math.random().toString(36).slice(2);
var deviceId = 'android_' + id;
var user = 'zxc792@163.com';
var passed = 'qa1234';
var interval = 10000;
var productKey = "94b4b71691a3ee3da605ed4f02696691";
var platform = "android";
var expire_hours = "12";
var nonce = "abc12f";
var signature = "OvmK969ardtilq3RCRJIANqj6nM=";

var timestamp = '0';


var REGISTER = 0;
var REGBIND = 1;
var BIND = 2;
var RECONNECT = 3;

var START = 'start';
var END = 'end';


var monitor = function(type,name,reqId){
  if (typeof actor!='undefined') {
    actor.emit(type,name,reqId);
  } else {
    console.error(Array.prototype.slice.call(arguments,0));
  }
}

var saveTimestamp = function(value) {
  fs.writeFile(fileName, value, function(err) {
    if(err) {
      console.log(err);
    }
  })
}

var updateTimestamp = function(message) {
  if(!message.topic) {
    return;
  }
  var type = message.topic.split('/')[1];
  monitor('incr',type);
  var payload = JSON.parse(message.payload);
  switch(type) {
    case 'broadcast':
    case 'specify':
      var length = payload.length;
      timestamp = payload[length - 1]['timestamp'];
      saveTimestamp(timestamp);
      break;
  }
}

var isDebug = function(){
  if (typeof robot!='undefined'){
    return robot.mode;
  } else {
    return true;
  }
}

var retry = 0;

var connect = function (port,host) {
  mqtt.createClient(port, host, function(err, client) {
    var act = new Action(client);
    if (err) {
      act.emit('error',JSON.stringify(err));
      console.error(err);
      setTimeout(function(){
        if (retry<=10) {
          connect(port,host);
        } else {
          console.error(' over ' + retry + ' times ,quit');
        }
        retry++;
      },5000 + Math.round(Math.random()*10000));
      return;
    }
    for (var i = 0; i < events.length; i++) {
      client.on(events[i], function(packet) {
        if (isDebug()){
          console.log(packet);
        }
        updateTimestamp(packet);
        act[packet.cmd].apply(act,[packet]);
      });
    }
    client.connect({keepalive: interval});
    client.on('connack', function(packet) {
    act.register();
    //var self = this;
    //setTimeout(function(){
      //act.reconnect();
    //}, 5000)
   });
  });
};

connect(port,host);
 
var Action = function(client){
  this.msgId = 1;
  this.client = client;
}

Action.prototype.subscribe = function(client) {
  client.subscribe({messageId: msgId, subscriptions: [{topic: 'shit', qos: 1}]});
}


Action.prototype.emit = function(){
  if (typeof robot!='undefined'){
    robot.emit(arguments[0],Array.prototype.slice.call(arguments,1));
  } else {
    console.error(Array.prototype.slice.call(arguments,1));
  }
}


Action.prototype.connack = function(packet){

}

Action.prototype.puback = function(packet){

}

Action.prototype.publish = function(packet){
  var topic = packet.topic;
  var name = topic.substring(topic.indexOf('/')+1,topic.length);
  if (typeof this[name]==='undefined'){
      //console.error('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',packet);
      return;
  }
  this[name](JSON.parse(packet.payload));
}


Action.prototype.registerack = function(payload){
  monitor(END,'register',REGISTER);
  if (payload.code===200) {
    this.regbind();
  } else {
    this.emit('error','registerack code ' + payload.code);
  }
}


Action.prototype.pubcomp = function(packet){

}

Action.prototype.suback = function(packet){
}

Action.prototype.specify = function(payload){
  var msgs= payload;
  var ids = [];
  for (var i = 0;i< msgs.length;i++){
      var msg = msgs[i];
      ids.push(msg.msgId);
  }
  this.ack(ids);
}

Action.prototype.ack = function(ids){
  var topic = domain + '/ack';
  var payload = {"user":user,"msgIds":ids};
  this.send(topic,1,payload);
}

 
Action.prototype.register = function() {
  var topic = domain + '/register';
  var payload = {"platform":platform,'deviceId':deviceId,"domain":domain,"productKey":productKey};
  monitor(START,'register',REGISTER);
  this.send(topic,1,payload);
}

Action.prototype.send = function(topic,qos,payload) {
  this.msgId++;
  this.client.publish({messageId: this.msgId, topic:topic,qos:qos,payload:JSON.stringify(payload)});
}

Action.prototype.regbind = function(){
  var self = this;
  var topic = domain + '/reg_bind';
  fs.readFile(fileName, 'utf-8', function(err, data) {
    if(err) {
      console.log('err:', err);
      return;
    }
    monitor(START,'regbind',REGBIND);
    var payload = {"platform":platform,"user":user,"timestamp":data ,"expire_hours":12,"nonce":nonce,"signature":signature,"productKey":productKey,"deviceId":deviceId,"domain":domain};
    self.send(topic,1,payload);
  })
  
}
 

Action.prototype.bind = function(){
  var topic = domain + '/bind';
  monitor(START,'bind',BIND);
  var payload = {"platform":platform,"user":user,"expire_hours":12,"signature":signature,"productKey":productKey,'deviceId':deviceId,"domain":domain};
  this.send(topic,1,payload);
}

Action.prototype.unbind = function(){
  var topic = domain + '/cancel_bind';
  var payload = {"user":user,"platform":platform,"domain":domain};
  this.send(topic,1,payload);
}
 
Action.prototype.reconnect = function(){
  var self = this;
  var topic = domain + '/reconnect';
  fs.readFile(fileName, 'utf-8', function(err, data) {
    if(err) {
      console.log('err:', err);
      return;
    }
    monitor(START,'reconnect',RECONNECT);
    var payload = {'deviceId':deviceId,"domain":[domain],"timestamp": data};
    self.send(topic,1,payload);
  })
}

Action.prototype.bindack = function(payload){
  monitor(END,'register',BIND);
 if (payload.code>0) {
    //console.log(payload);
    //this.login();
  } else {
      this.emit('error','registerack code ' + payload.code);
  }
}