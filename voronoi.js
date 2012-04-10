var rb_tree_module = require('./rbt');
var node = rb_tree_module.node;
var rb_tree = rb_tree_module.rb_tree;

// Cell Type
function cell(site) {
    this.site = site;
    this.half_edges = [];
}

cell.prototype.init = function() {
    var half_edges_count = this.half_edges.length, edge;

    while(half_edges_count--) {
        edge = this.half_edges[half_edges_count].edge;
        if((edge.vertex_a == null) || 
           (edge.vertex_b == null))
            this.half_edge.splice(half_edges_count,1);
    }

    this.half_edges.sort(function(a,b){return b.angle-a.angle});
    return this.half_edges.length;
}

// Vertex Type
function vertex(x,y) {
    this.x = x;
    this.y = y;
}

// Edge Type
function edge(site_left,site_right) {
    this.site_left = site_left;
    this.site_right = site_right;
    this.vertex_a = this;
    this.vertex_b = null;
}

// Half-Edge Type
function half_edge(edge,site_left,site_right) {

}