var mqtt = require('mqttjs');
var colors = require('colors');

var events = ['connack', 'puback', 'publish', 'pubcomp', 'suback'];

 
//console.log('ssss %j',{a:1},__filename + " __line " + __line);
//console.dir(colors);

mqtt.createClient(3010, 'localhost', function(err, client) {
  if (err) {
    console.error(err);
    return process.exit(-1);
  }


  for (var i = 0; i < events.length; i++) {
    client.on(events[i], function(packet) {
      //console.error(packet);
    });
  }

  client.connect({keepalive: 1000});

  client.on('connack', function(packet) {
    console.error('connackconnackconnackconnack');
    client.subscribe({messageId: 123, subscriptions: [
      {topic: 'shit', qos: 1}
    ]});

    var payload = {"msg": "hello", "id": "12345",'deviceId':'android_1',domain:'blog.163.com'};

    client.publish({messageId: 124, topic: 'blog.163.com/register', qos: 1,
                    payload:JSON.stringify(payload)});

    setInterval(function() {
      client.pingreq();
    }, 1000);
  });
});
