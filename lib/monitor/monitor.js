/**
 *
 * agent monitor data map
 *
 * every agent put start and end time in to route map
 * then report to master 
 *
 */

var monitor = module.exports;
var dataMap = {};
var profileMap = {};
var incrMap = {};

monitor.getData = function(){
  return {
    timeData:profileMap,
    incrData:incrMap
  };
};

monitor.clear = function(){
	profileMap = {};
  incrMap = {};
};

monitor.incr = function(name){
  incrMap[name] = incrMap[name]==null?1:incrMap[name]+1;
}

monitor.decr = function(name){
  incrMap[name] = incrMap[name]==null?0:incrMap[name]-1;
}

monitor.beginTime = function(route,uid,id,time){
  if(!dataMap[route]) {
    dataMap[route] = buildMapData();
  }
  if(!dataMap[route][uid]){
    dataMap[route][uid] = buildMapData();
    dataMap[route][uid][id] = time;
  } 
  dataMap[route][uid][id] = time;
}; 

monitor.endTime = function(route,uid,id,time){
	if(!dataMap[route]){
		return;
	}
  if(!dataMap[route][uid]){
		return;
	}
  if(!dataMap[route][uid][id]){
		return;
	}
  var beginTime = dataMap[route][uid][id];
  var profileArr = profileMap[route] ;
	if (!profileMap[route]) {
			profileArr = [];
			profileMap[route] = profileArr;
	}
	delete dataMap[route][uid][id];
  profileArr.push(time-beginTime);
};

function buildMapData(){
  var data = {};
  return data;
}

