var site = require('./site.js').site;
var edge = require('./edge_list.js').edge;
var free_list = require('./free_list.js').free_list;
var bounding_box = require('./bounding_box.js').bounding_box;

function geometry() {
    this.edges = [];
    this.sites = [];
}

geometry.delta_x = 0.0;
geometry.delta_y = 0.0;
geometry.nedges = 0;
geometry.sqrt_nsites = 0;
geometry.nvertices = 0;
geometry.edge_free_list = new free_list();

geometry.init = function() {
    geometry.edge_free_list = new free_list();
    geometry.nvertices = geometry.nedges = 0;
    geometry.sqrt_nsites = Math.ceil(Math.sqrt(bounding_box.nsites + 4));
    this.delta_y = bounding_box.y_max - bounding_box.y_min;
    this.delta_x = bounding_box.x_max - bounding_box.x_min;
};

geometry.bisect = function(s1,s2) { // s1,s2 are sites
    var dx,dy, adx, ady;
    var new_edge = new edge();

    new_edge = new edge();
    new_edge.next = geometry.edge_free_list.get_free().next;
    new_edge.reg[0] = s1;
    new_edge.reg[1] = s2;
    s1.inc_ref();
    s2.inc_ref();
    new_edge.end_points[0] = new_edge.end_points[1] = null;

    dx = s2.coord.x - s1.coord.x;
    dy = s2.coord.y - s1.coord.y;
    adx = (dx > 0) ? dx : (-dx);
    ady = (dy > 0) ? dy : (-dy);
    new_edge.c = s1.coord.x * dx + s1.coord.y * dy + 0.5 * (dx*dx + dy*dy);

    if(adx > ady) {
        new_edge.a = 1.0; new_edge.b = dy/dx; new_edge.c /= dx;
    } else {
        new_edge.b = 1.0; new_edge.a = dx/dy; new_edge.c /= dy;
    }

    new_edge.id = geometry.nedges;
    geometry.nedges++;
    return new_edge;
};

geometry.intersect = function(el1, el2) { // el1,el2 are half-edges
};


exports.geometry = geometry;
