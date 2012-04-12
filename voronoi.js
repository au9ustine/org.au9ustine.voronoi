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
};

// Vertex Type
function vertex(x,y) {
    this.x = x;
    this.y = y;
}

// Half-Edge Type
function half_edge(edge,site_left,site_right) {
    this.site = site_left;
    this.edge = edge;

    if(site_right) {
        //              site_right.y - site_left.y
        // tan(angle) = --------------------------
        //              site_right.x - site_left.x
        this.angle = Math.atan2(site_right.y-site_left.y,
                                site_right.x-site_left.x);
    } else {
        var vertex_a = edge.vertex_a, vertex_b = edge.vertex_b;
        if(edge.site_left == site_left)
            this.angle = Math.atan2(vertex_b.x-vertex_a.x,
                                    vertex_a.y-vertex_b.y);
        else
            this.angle = Math.atan2(vertex_a.x-vertex_b.x,
                                    vertex_b.y-vertex_a.y);
    }
}

half_edge.prototype.get_start_vertex = function() {
    return (this.edge.site_left == this.site) ?
        (this.edge.vertex_a) : (this.edge.vertex_b);
};

half_edge.prototype.get_end_vertex = function() {
    return (this.edge.site_left == this.site) ?
        (this.edge.vertex_b) : (this.edge.vertex_a);
};

// Edge Type
function edge(site_left,site_right) {
    this.site_left = site_left;
    this.site_right = site_right;
    this.vertex_a = this;
    this.vertex_b = null;
}

// Voronoi Diagram (without bounding box)
function diagram() {
    this.cells = null;
    this.edges = null;
    this.beach_line = null;
    this.beach_line_arcs = null;
    this.site_events = null;
    this.circle_events = null;
    this.first_circle_event = null;
}

diagram.prototype.reset = function() {

    // Build Red-Black Tree for beach lines
    if(this.beach_line == null)
        this.beach_line = new rb_tree();

    if(this.beach_line.root){
        var arc = this.beach_line.root.get_first();
        while(arc){
            this.beach_line_arcs.push(arc);
            arc = arc.next();
        }
    }
    this.beach_line.root = null;

    if(this.circle_events == null)
        this.circle_events = new rb_tree();
    this.circle_events.root = null;

    this.edges = [];
    this.cells = [];
};

diagram.prototype.add_edge = function(site_left, site_right,
                                      vertex_a, vertex_b) {
    var edge = new edge(site_left, site_right);

    if(this.edges == null)
        this.edges = [];
    this.edges.push(edge);

    if(vertex_a)
        set_edge_start_point(edge, site_left, site_right, vertex_a);

    if(vertex_b)
        set_edge_end_point(edge, site_left, site_right, vertex_b);

    if(this.cells == null)
        this.cells = [];
    this.cells[site_left.id].half_edges.push(new half_edge(edge, site_left, site_right));
    this.cells[site_right.id].half_edges.push(new half_edge(edge, site_right, site_left));

    return edge;
};

diagram.prototype.add_border = function(site_left, vertex_a, vertex_b) {
    var edge = new edge(site_left, null);
    edge.vertex_a = vertex_a;
    edge.vertex_b = vertex_b;

    if(this.edges == null)
        this.edges = [];
    this.edges.push(edge);

    return edge;
};

diagram.prototype.set_edge_start_point = function(edge, site_left, 
                                                  site_right, vertex) {
    if((edge.vertex_a) && (edge.vertex_b == null)) {
        edge.vertex_a = vertex;
        edge.site_left = site_left;
        edge.site_right = site_right;
    } else if (edge.site_left == site_right) {
        edge.vertex_b = vertex;
    } else {
        edge.vertex_a = vertex;
    }
};

diagram.prototype.set_edge_end_point = function(edge, site_left,
                                                site_right, vertex) {
    this.set_edge_start_point(edge, site_right, site_left, vertex);
};

diagram.prototype.add_beach_line_arc = function(site) {
    var arc = this.beach_line_arcs.pop();
    if(arc == null)
        arc = {};
    arc.site = site;
    return arc;
};

// Given arc and directrix, calculate the left break point of the arc
diagram.prototype.left_break_point = function(arc,directrix) {

    var focus = arc.site,                       // Focus point (aka. focus)
    right_focus_x = focus.x,                    // Focus point x coordinate
    right_focus_y = focus.y,                    // Focus point y coordinate
    right_param_p = right_focus_y - directrix;  // parameter p of
                                                // parabola which arc
                                                // belongs to
    if(right_param_p == null)
        return right_focus_x;

    var arc_prev = arc.prev();
    if(arc_prev == null)        // touch the border of bounding box
        return -Infinity;

    focus = arc_prev.site;
    var left_focus_x = focus.x,
    left_focus_y = focus.y,
    left_param_p = left_focus_y - directrix;

    if(left_param_p == null)
        return left_focus_x;

    var hl = left_focus_x - right_focus_x,
    a = 1/right_param_p - 1/left_param_p,
    b = hl/left_param_p;

    if(a) {
        return (-b + Math.sqrt(b*b - 2 * a * (hl*hl / (-2*left_param_p) - left_focus_y + left_param_p/2 + right_focus_y - right_param_p/2))) / a + right_focus_x;
    }

    return (right_focus_x + left_focus_x) / 2;
};

diagram.prototype.right_break_point = function(arc,directrix) {
    var right_arc = arc.next();
    if(right_arc)
        return this.left_break_point(right_arc, directrix);
    var site = arc.site;
    return site.y == directrix ? site.x : Infinity;
};


