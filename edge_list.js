var geometry = require('./geometry.js').geometry;
var free_list = require('./free_list.js').free_list;
var site = require('./site.js').site;
var DELETED = require('./constant.js').DELETED;
var le = require('./constant.js').le;
var re = require('./constant.js').re;

function edge() {
    this.a = 0.0;
    this.b = 0.0;
    this.c = 0.0;
    this.end_points = [null,null]; // collections for site type
    this.reg = [null,null];        // regular site collections
    this.id = 0;                   // Edge Number
}

function half_edge() {
    this.left = null;           // the half edge leftside
    this.right = null;          // the half edge rightside
    this.edge = null;           // the edge that the half edge belongs
                                // to
    this.ref_cnt = 0;           // reference count
    this.pm = null;             // pm = ?
    this.vertex = null;         // vertex
    this.ystar = 0.0;           // y*, treated as priority
    this.next = null;           // next half edge in priority queue
}

half_edge.prototype.right_reg = function() {
    if(this.edge == null)
        return edge_list.bottom_site;

    return (this.pm == le) ? (this.edge.reg[re]) : (this.edge.reg[le]);
};

half_edge.prototype.left_reg = function() {
    if(this.edge == null)
        return edge_list.bottom_site;

    return (this.pm == le) ? (this.edge.reg[le]) : (this.edge.reg[re]);
};

half_edge.prototype.left = function() {
    return this.left;
};

half_edge.prototype.right = function() {
    return this.right;
};

half_edge.prototype.remove = function() {
    this.left.right = this.right;
    this.right.left = this.left;
    this.edge = DELETED;
}

function edge_list() {
}

edge_list.hash_size = 4;         // hash_size = 2 * sqrt(nsites+4),
// this is minimal
edge_list.bottom_site = null;
edge_list.half_edge_free_list = new free_list();
edge_list.left_end = null;       // left-most half-edge
edge_list.right_end = null;      // right-most half-edge
edge_list.hash = null;
edge_list.ntry = 0;
edge_list.total_search = 0;

// Initialize the edge list
edge_list.init = function() {
    edge_list.half_edge_free_list = new free_list();
    // Build hash table
    edge_list.hash_size = 2 * geometry.sqrt_nsites;
    edge_list.hash = []
    for(var i = 0; i < edge_list.hash_size; i++)
        edge_list.hash.push(null);

    // New the left-most half-edge and right-most half-edge
    edge_list.left_end = edge_list.new_half_edge(null,0);
    edge_list.right_end = edge_list.new_half_edge(null,0);
    edge_list.left_end.left = null;
    edge_list.left_end.right = edge_list.right_end; // only left-end and
    edge_list.right_end.left = edge_list.left_end;  // right-end in current list
    edge_list.right_end.right = null;
    edge_list.hash[0] = edge_list.left_end;
    edge_list.hash[edge_list.hash_size - 1] = edge_list.right_end;
};

edge_list.new_half_edge = function(e,pm) { // e is an edge
    var new_half_edge = new half_edge();
    new_half_edge.edge = e;
    new_half_edge.pm = pm;
    return new_half_edge;
};

// linked list insertion
edge_list.insert = function(some_half_edge,newbie) {
    newbie.left = some_half_edge;
    newbie.right = some_half_edge.right;
    some_half_edge.right.left = newbie;
    some_half_edge.right = newbie;
};

edge_list.get_hash = function(i) {

    // check the index
    if((i < 0) || (i >= edge_list.hash_size))
        return null;

    var some_half_edge = edge_list.hash[i];

    // Try to find it if it exists
    if((some_half_edge == null) || (some_half_edge.edge != DELETED))
        return some_half_edge;

    // If not, clean the location
    edge_list.hash[i] = null;

    if((--(some_half_edge.ref_cnt)) == 0) 
        edge_list.half_edge_free_list.make_free(some_half_edge);

    return null;
};

edge_list.leftbnd = function(p) { // p is a coordinate
    var bucket = (p.x - geometry.x_min) / geometry.delta_x * edge_list.hash_size;
    if(bucket < 0)
        bucket = 0;
    if(bucket >= edge_list.hash_size)
        bucket = edge_list.hash_size - 1;

    var he = edge_list.get_hash(bucket);
    if(he == null) {
        for(var i = 1; 1; i++) {
            if((he = edge_list.get_hash(bucket-i)) != null)
                break;
            if((he = edge_list.get_hash(bucket+i)) != null)
                break;
        }
        edge_list.total_search += i;
    }

    if((he == edge_list.left_end) || 
       (he != edge_list.right_end && geometry.right_of(he,p))) {
        do {
            he = he.right;
        }while(he != edge_list.right_end && geometry.right_of(he,p));
        he = he.left;
    } else {
        do {
            he = he.left;
        }while(he != edge_list.left_end && !geometry.right_of(he,p));
    }

    if((bucket > 0) && (bucket < edge_list.hash_size -1)){
        if(edge_list.hash[bucket] != null)
            edge_list.hash[bucket].ref_cnt--;
        edge_list.hash[bucket] = he;
        (edge_list.hash[bucket].ref_cnt)++;
    }
    return he;
};


exports.edge = edge;
exports.half_edge = half_edge;
exports.edge_list = edge_list;
