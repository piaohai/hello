/**
 * node abstract for agent node
 * 
 */
Node.prototype.render = function() {
  var n = this;
  this._dom = $("#node_template").clone()
  .find(".node").html('[' +n.iport+ ']').end()
    .attr("id", "node_" + n.nodeId)
    .data('label', n.nodeId);
    $("#conndiv").val($("#conndiv").val()+n.nodeId + ' ');
};

Node.prototype.destroy = function() {
  this._dom.remove();
};

 
