var mqtt = require('mqttjs');
var events = ['connack', 'puback', 'publish', 'pubcomp', 'suback'];

//const data
var port = 3010;
var host = 'localhost';
var host = '114.113.202.154';
//var host = '192.168.144.199';
var domain = 'blog.163.com';
var deviceId = 'android_1';
var urs = 'appmee@126.com';
var passed = 'qa1234';

var isDebug = function(){
  if (typeof robot!='undefined'){
    return robot.mode;
  } else {
    return true;
  }
}

mqtt.createClient(port, host, function(err, client) {
  var act = new Action(client);
  if (err) {
    act.emit('error',JSON.stringify(err));
    console.error(err);
    return;
  }
  for (var i = 0; i < events.length; i++) {
    client.on(events[i], function(packet) {
      if (isDebug()){
        console.log(packet);
      }
      act[packet.cmd].apply(act,[packet]);
    });
  }
  client.connect({keepalive: 1000});
  client.on('connack', function(packet) {
  setInterval(function() {client.pingreq(); }, 1000);
  act.register();
   //setInterval(function(){subscribe(client)},2000);
 });
});



var bindMsg = {
    domain: "blog.163.com",
    productKey: "94b4b71691a3ee3da605ed4f02696691",
    expire_hours: "12",
    nonce: "abc12f",
    user: "zxc792@163.com",
    signature: "OvmK969ardtilq3RCRJIANqj6nM="
};

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
      console.error(packet);
      return;
  }
  this[name](JSON.parse(packet.payload));
}


Action.prototype.registerack = function(payload){
  if (payload.code===200) {
    this.login();
  } else {
    this.emit('error','registerack code ' + payload.code);
  }
}


Action.prototype.pubcomp = function(packet){

}

Action.prototype.suback = function(packet){
}

Action.prototype.register = function() {
  var topic = 'blog.163.com/register';
  var payload = {"msg": "hello", "id": this.msgId,'deviceId':deviceId,domain:domain};
  this.send(topic,1,payload);
}

Action.prototype.send = function(topic,qos,payload) {
  this.msgId++;
  this.client.publish({messageId: this.msgId, topic:topic,qos:qos,payload:JSON.stringify(payload)});
}

Action.prototype.login = function(){
  var topic = 'blog.163.com/bind';
  var payload = {"msg": bindMsg, "id": this.msgId,'deviceId':deviceId,domain:domain};
  this.send(topic,1,payload);
}

Action.prototype.bindack = function(payload){
 if (payload.code>0) {
    //console.log(payload);
    //this.login();
  } else {
      this.emit('error','registerack code ' + payload.code);
  }
}