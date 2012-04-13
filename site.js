var site_free_list = require('./bounding_box.js').bounding_box.site_free_list;

// planar coordinate
function point() {
    this.x = 0.0;              // x coordinate
    this.y = 0.0;              // y coordinate
}

// Site type, also can be regarded as Vertex type
function site() {
    this.x = 0.0;
    this.y = 0.0;
    this.coord = new point();          // point type
    this.id = 0;                // Site number
    this.ref_cnt = 0;           // reference count
}

site.prototype.inc_ref = function() {
    this.ref_cnt++;
};

site.prototype.dec_ref = function() {
    if(--(this.ref_cnt) == 0)
        site_free_list.make_free(this);
};

site.prototype.make_vertex = function() {
    this.id = geometry.nvertices++;
};



exports.point = point;
exports.site = site;
