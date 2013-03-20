/**
 * node abstract for agent node
 * 
 */
Node.prototype.render = function() {
  var n = this;
  //this._dom = $("#node_template").clone()
  //.find(".node").html('[' +n.iport+ ']').end()
  //  .attr("id", "node_" + n.nodeId)
  //  .data('label', n.nodeId);
  var v = '[' +n.iport+ ']';
  $("#conndiv").val($("#conndiv").val()+ v + '\n');
};

Node.prototype.destroy = function() {
  this._dom.remove();
};

 
