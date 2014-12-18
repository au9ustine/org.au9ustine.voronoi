// -------------------------- CONSTANT ----------------------------
var EPSILON = 1e-9;
var FLOAT_UPPER = 1e38;

// ----------------------- CONTEXT --------------------------------
function Context(points) {
    this.input_points = [];     // input points [x,y]+
    this.vertices = [];         // vertices [x,y]*
    this.lines = [];            // triples, line a*x+b*y=c, [a,b,c]*
    this.edges = [];            // triples, [line index,vertex1,vertex2]*
    this.triangles = [];        // triples, [vertex1,vertex2,vertex3]*
}

// Output vertex
Context.prototype.out_vertex = function(v) {
    v.sitenum = this.vertices.length;
    this.vertices.push([v.x,v.y]);
};

// Output triple
Context.prototype.out_triple = function(s1,s2,s3) {
    this.triangles.push([s1.sitenum,s2.sitenum,s3.sitenum]);
};

// Output besector line
Context.prototype.out_bisector = function(edge) {
    this.lines.push([edge.a,edge.b,edge.c]);
};

// Output edge
Context.prototype.out_edge = function(edge) {
    site_num_left = -1;
    if(edge.points[Edge.LEFT] != null)
        site_num_left = edge.points[Edge.LEFT].sitenum;
    site_num_right = -1;
    if(edge.points[Edge.RIGHT] != null)
        site_num_right = edge.points[Edge.RIGHT].sitenum;
    this.edges.push([edge.edgenum,site_num_left,site_num_right]);
};

// Output triangle vertex num triple
Context.prototype.get_triangle = function(index) {
    return this.triangles[index];
};

// Output triangle vertex triple
Context.prototype.get_triangle_vertices = function(index) {
    triangle = this.get_triangle(index);
    ret = [];
    for(var i = 0; i < triangle.length; i++)
        ret.push(this.input_points[triangle[i]]);
    return ret;
};

Context.prototype.get_vertex = function(index) {
    if(index != -1)
        return this.vertices[index];
    else
        return null
};

Context.prototype.get_edge = function(index) {
    var edgenum = this.edges[index][0];
    var p0 = this.edges[index][1];
    var p1 = this.edges[index][2];
    var vertex0 = this.get_vertex(p0);
    var vertex1 = this.get_vertex(p1);

    if((vertex0 != null) && (vertex1 != null))
        return [vertex0,vertex1];
    else
        return null;
};

// ---------------------------- COMMON ----------------------------
function almost_equal(a,b,relative_error) {
    if(relative_error == undefined)
        relative_error = EPSILON;
    var norm = Math.max(Math.abs(a), Math.abs(b));
    return (norm < relative_error) || (Math.abs(a-b) < (relative_error * norm));
}

// ---------------------------- SITE ------------------------------
function Site(point,site_num) { // point type is an ordered pair [x,y]
    this.x = point[0];
    this.y = point[1];
    if(site_num == undefined)
        this.sitenum = 0;            // Site number
    else
        this.sitenum = site_num;
}

Site.prototype.is_equal = function(other) {
    return ((this.y == other.y) && (this.x == other.x));
};

Site.prototype.is_lessthan = function(other) {
    if(this.y == other.y)
        return (this.x < other.x);
    else
        return (this.y < other.y);
};

Site.compare = function(s1,s2) { // s1,s2 are points
    if(s1.y < s2.y)
        return -1;
    if(s1.y > s2.y)
        return 1;
    if(s1.x < s2.x)
        return -1;
    if(s1.x > s2.x)
        return 1;
    return 0;
};

Site.prototype.distance = function(other) {
    var dx = this.x - other.x;
    var dy = this.y - other.y;
    return Math.sqrt(dx*dx+dy*dy);
};

// --------------------------- SITE LIST --------------------------
function Site_list(points) {
    var raw = points.slice(0);  // Get the deep copy of points
    this.data = []; 
    for(var i = 0; i < raw.length; i++)
        this.data.push(new Site(raw[i],i));

    this.x_min = points[0][0];
    this.y_min = points[0][1];
    this.x_max = points[0][0];
    this.y_max = points[0][1];

    for(var i = 0; i < points.length; i++) {
        var x = points[i][0];
        var y = points[i][1];
        // Get minimum and maximum of coordinates of points
        if(x < this.x_min)
            this.x_min = x;
        if(y < this.y_min)
            this.y_min = y;
        if(x > this.x_max)
            this.x_max = x;
        if(y > this.y_max)
            this.y_max = y;
    }

    // Sort the collection
    this.data.sort(Site.compare);
}

Site_list.prototype.iter = function() {

};

// --------------------------- EDGE -------------------------------
function Edge() {
    this.a = 0.0;
    this.b = 0.0;
    this.c = 0.0;
    this.points = [null,null];  // collections for site type
    this.reg = [null,null];     // regular site collections
    this.edgenum = 0;                // Edge Number
}

Edge.LEFT = 0;
Edge.RIGHT = 1;
Edge.EDGE_NUM = 0;
Edge.DELETED = undefined;

Edge.prototype.set_end_point = function(position,site) {
    this.points[position] = site;
    if(this.points[Edge.RIGHT - position] == null)
        return false;
    return true;
};

Edge.bisect = function(site1,site2) {
    // Create a brand new edge
    var new_edge = new Edge();

    // Store the sites that this edge is bisecting
    new_edge.reg[0] = site1;
    new_edge.reg[1] = site2;

    // Get the coordinate difference of two sites and their abs value
    dx = site2.x - site1.x;
    dy = site2.y - site1.y;
    adx = Math.abs(dx);
    ady = Math.abs(dy);

    // Get the slope of the line
    new_edge.c = site1.x * dx + site1.y * dy + 0.5 * (dx*dx + dy*dy);

    // Set formula of the line
    if(adx > ady) {
        new_edge.a = 1.0; new_edge.b = dy/dx; new_edge.c /= dx;
    } else {
        new_edge.b = 1.0;
        new_edge.a = dx/dy;
        new_edge.c /= dy;
    }

    // Add edge count
    new_edge.edgenum = Edge.EDGE_NUM;
    Edge.EDGE_NUM++;

    return new_edge;
};

// -------------------------- HALF-EDGE ---------------------------
function Half_edge(edge,marker) {
    this.left = null;           // the half edge leftside
    this.right = null;          // the half edge rightside
    if(edge == undefined)
        edge = null;
    this.edge = edge;           // the edge that the half edge belongs
    // to
    if(marker == undefined)
        marker = Edge.LEFT;
    this.marker = marker;       // Default marker is Edge.LEFT
    this.vertex = null;         // vertex
    this.ystar = 0.0;           // y*, treated as priority
    this.qnext = null;        // next half edge in priority queue
}

Half_edge.prototype.is_equal = function(other) {
    return ((this.ystar == other.ystar) &&
            (this.vertex.x == other.vertex.x));
};

Half_edge.prototype.is_lessthan = function(other) {
    if(this.ystar == other.ystar)
        return this.vertex.x < other.vertex.x;
    else
        return this.ystar < other.ystar;
};

Half_edge.prototype.is_point_right_of = function(point) {
    var edge = this.edge;
    var top_site = edge.reg[1];
    var right_of_site = point.x > top_site.x;
    var above;

    if((right_of_site) && (this.marker == Edge.LEFT))
        return true;

    if((!right_of_site) && (this.marker == Edge.RIGHT))
        return false;

    if(edge.a == 1.0) {
        var dyp = point.y - top_site.y;
        var dxp = point.x - top_site.x;
        var fast = 0;

        if((!right_of_site && edge.b < 0.0) || 
           (right_of_site && edge.b >= 0.0)) {
            above = (dyp >= edge.b * dxp);
            fast = above;
        } else {
            above = ((point.x + point.y * edge.b) > edge.c);
            if(edge.b < 0.0)
                above = !above;
            if(!above)
                fast = 1;
        }
        if(!fast) {
            var dxs = top_site.x - (edge.reg[0]).x;
            above = (edge.b * (dxp*dxp - dyp*dyp)) < 
                (dxs*dyp*(1.0+2.0*dxp/dxs+edge.b*edge.b));
            if(edge.b < 0.0)
                above = !above;
        }
    } else {
        // edge.b == 1.0
        var yl = edge.c - edge.a * point.x;
        var t1 = point.y - yl;
        var t2 = point.x - top_site.x;
        var t3 = yl - top_site.y;
        above = t1*t1 > t2*t2 + t3*t3;
    }

    if(this.marker == Edge.LEFT)
        return above;
    else
        return !above;
};

Half_edge.prototype.intersect = function(other) {
    var edge1 = this.edge;
    var edge2 = other.edge;
    if((edge1 == null) || (edge2 == null))
        return null;

    // If two edges bisect the same parent, return null
    if(edge1.reg[1] == edge2.reg[1])
        return null;

    var d = (edge1.a * edge2.b) - (edge1.b * edge2.a);
    if(almost_equal(d, 0.0))
        return null;

    var intersect_x = (edge1.c * edge2.b - edge2.c * edge1.b) / d;
    var intersect_y = (edge2.c * edge1.a - edge1.c * edge2.a) / d;
    var half_edge,edge;
    if(edge1.reg[1].is_lessthan(edge2.reg[1])) {
        half_edge = this;
        edge = edge1;
    } else {
        half_edge = other;
        edge = edge2;
    }

    var right_of_site = intersect_x >= edge.reg[1].x;
    if((right_of_site && half_edge.marker == Edge.LEFT) ||
       (!right_of_site && half_edge.marker == Edge.RIGHT))
        return null;
    
    return new Site([intersect_x,intersect_y]);
};

Half_edge.prototype.left_reg = function(default_site) {
    if(this.edge == null)
        return defulat_site;
    else if (this.marker == Edge.LEFT)
        return this.edge.reg[Edge.LEFT];
    else
        return this.edge.reg[Edge.RIGHT];
};

Half_edge.prototype.right_reg = function(default_site) {
    if(this.edge == null)
        return default_site;
    else if(this.marker == Edge.LEFT)
        return this.edge.reg[Edge.RIGHT];
    else
        return this.edge.reg[Edge.LEFT];
};


// ------------------------ EDGE LIST -----------------------------
function Edge_list(x_min,x_max,nsites) {
    if(x_min > x_max){
        var tmp = x_min;
        x_min = x_max;
        x_max = tmp;
    }
    this.hash_size = Math.floor(2*Math.sqrt(nsites+4));

    this.x_min = x_min;
    this.delta_x = x_max - x_min;
    this.queues = [];
    for(var i = 0; i < this.hash_size; i++)
        this.queues.push(null);

    this.left_end = new Half_edge();
    this.right_end = new Half_edge();
    this.left_end.right = this.right_end;
    this.right_end.left = this.left_end;
    this.queues[0] = this.left_end;
    this.queues[-1] = this.right_end;
};

Edge_list.prototype.insert = function(left,half_edge) {
    half_edge.left = left;
    half_edge.right = left.right;
    left.right.left = half_edge;
    left.right = half_edge;
};

Edge_list.prototype.remove = function(half_edge) {
    half_edge.left.right = half_edge.right;
    half_edge.right.left = half_edge.left;
    half_edge.edge = Edge.DELETED;
};

Edge_list.prototype.get_hash = function(b) {

    if(b < 0)
        return null;

    b%=this.hash_size;

    var half_edge = this.queues[b];

    if(half_edge == null)
        return half_edge;

    if(half_edge.edge !== Edge.DELETED)
        return half_edge;

    this.queues[b] = null;
    return null;
};


Edge_list.prototype.leftbnd = function(point) {
    var bucket = Math.floor(((point.x - this.x_min) / this.delta_x * this.hash_size));

    if(bucket < 0)
        bucket = 0;

    if(bucket >= this.hash_size)
        bucket = this.hash_size - 1;

    var half_edge = this.get_hash(bucket);
    if(half_edge == null) {
        var i = 1;
        while(true) {
            half_edge = this.get_hash(bucket - i);
            if(half_edge != null)
                break;
            half_edge = this.get_hash(bucket + i);
            if(half_edge != null)
                break;
            i++;
        }
    }

    if((half_edge == this.left_end) ||
       ((half_edge != this.right_end) && half_edge.is_point_right_of(point))) {
        half_edge = half_edge.right;
        while((half_edge != this.right_end) && 
              (half_edge.is_point_right_of(point))) {
            half_edge = half_edge.right;
        }
        half_edge = half_edge.left;
    } else {
        half_edge = half_edge.left;
        while((half_edge != this.left_end) &&
              (!half_edge.is_point_right_of(point))) {
            half_edge = half_edge.left;
        }
    }

    if((bucket > 0) && (bucket < this.hash_size-1))
        this.queues[bucket] = half_edge;

    return half_edge;
};

// ------------------------ Priority Queue ------------------------
function Pq(y_min,y_max,nsites) {
    this.y_min = y_min;
    this.delta_y = y_max - y_min;
    this.hash_size = Math.floor(4 * Math.sqrt(nsites));
    this.count = 0;
    this.min_index = 0;
    this.queues = [];
    for(var i = 0; i < this.hash_size; i++)
        this.queues.push(new Half_edge());
}

Pq.prototype.len = function() {
    return this.count;
};

Pq.prototype.is_empty = function() {
    return this.count == 0;
};

Pq.prototype.insert = function(half_edge, site, offset) {
    half_edge.vertex = site;
    half_edge.ystar = site.y + offset;
    var last = this.queues[this.get_bucket(half_edge)];
    var qnext = last.qnext;
    while((qnext != null) && (half_edge > qnext)) {
        last = qnext;
        qnext = last.qnext;
    }
    half_edge.qnext = last.qnext;
    last.qnext = half_edge;
    this.count++;
};

Pq.prototype.remove = function(half_edge) {
    if(half_edge.vertex != null) {
        var last = this.queues[this.get_bucket(half_edge)];
        while(last.qnext != half_edge)
            last = last.qnext;
        last.qnext = half_edge.qnext;
        this.count--;
        half_edge.vertex = null;
    }
};

Pq.prototype.get_bucket = function(half_edge) {
    var bucket = Math.floor(((half_edge.ystar - this.y_min) / this.delta_y) * this.hash_size);

    if(bucket < 0)
        bucket = 0;
    if(bucket >= this.hash_size)
        bucket = this.hash_size - 1;
    if(bucket < this.min_index)
        this.min_index = bucket;
    return bucket;
};

Pq.prototype.get_min_point = function() {
    while(this.queues[this.min_index].qnext == null)
        this.min_index++;
    var half_edge = this.queues[this.min_index].qnext;
    var x = half_edge.vertex.x;
    var y = half_edge.ystar;
    return new Site([x,y]);
};

Pq.prototype.pop_min_half_edge = function() {
    var curr = this.queues[this.min_index].qnext;
    this.queues[this.min_index].qnext = curr.qnext;
    this.count--;
    return curr;
};

// ------------------------- FORTUNE'S MAIN -----------------------
function Voronoi(){
}
Voronoi.main = function(points) {
    var context = new Context(points);
    var sites = new Site_list(points);
    var edges = new Edge_list(sites.x_min, sites.x_max, sites.data.length);
    var priority_queue = new Pq(sites.y_min, sites.y_max, sites.data.length);
    var itersites = sites.data.slice(0);

    var bottomsite = itersites.shift();
    var newsite = itersites.shift();
    var min_point = Site([-FLOAT_UPPER,-FLOAT_UPPER]);

    while(true) {
        if(!priority_queue.is_empty())
            min_point = priority_queue.get_min_point();

        if(newsite && (priority_queue.is_empty() || 
                       (newsite.is_lessthan(min_point)))) {
            var lbnd = edges.leftbnd(newsite);
            var rbnd = lbnd.right;

            var bot = lbnd.right_reg(bottomsite);
            var edge = Edge.bisect(bot, newsite);
            context.out_bisector(edge);

            var bisector = new Half_edge(edge, Edge.LEFT);
            edges.insert(lbnd, bisector);

            var point = lbnd.intersect(bisector);
            if(point != null) {
                priority_queue.remove(lbnd);
                priority_queue.insert(lbnd, point, newsite.distance(point));
            }

            lbnd = bisector;
            bisector = new Half_edge(edge, Edge.RIGHT);
            edges.insert(lbnd, bisector);

            point = bisector.intersect(rbnd);
            if(point != null)
                priority_queue.insert(bisector, point, newsite.distance(point));

            newsite = itersites.shift();
            if(newsite == undefined)
                newsite = null;

        } else if (!priority_queue.is_empty()) {
            var lbnd = priority_queue.pop_min_half_edge();
            var llbnd = lbnd.left;
            var rbnd = lbnd.right;
            var rrbnd = rbnd.right;

            var bot = lbnd.left_reg(bottomsite);
            var top = rbnd.right_reg(bottomsite);

            var mid = lbnd.right_reg(bottomsite);
            context.out_triple(bot, top, mid);

            var vertex = lbnd.vertex;
            context.out_vertex(vertex);

            if(lbnd.edge.set_end_point(lbnd.marker, vertex))
                context.out_edge(lbnd.edge);
            if(rbnd.edge.set_end_point(rbnd.marker, vertex))
                context.out_edge(rbnd.edge);

            edges.remove(lbnd);
            priority_queue.remove(rbnd);
            edges.remove(rbnd);

            var marker = Edge.LEFT;
            if(bot.y > top.y) {
                var tmp = bot;
                bot = top;
                top = tmp;
                marker = Edge.RIGHT;
            }

            var edge = Edge.bisect(bot, top);
            context.out_bisector(edge);

            var bisector = new Half_edge(edge, marker);

            edges.insert(llbnd, bisector);
            if(edge.set_end_point(Edge.RIGHT - marker, vertex))
                context.out_edge(edge);

            var point = llbnd.intersect(bisector);
            if(point != null) {
                priority_queue.remove(llbnd);
                priority_queue.insert(llbnd, point, bot.distance(point));
            }

            point = bisector.intersect(rrbnd);
            if(point != null)
                priority_queue.insert(bisector, point, bot.distance(point));
        } else {
            break;
        }
    }

    var half_edge = edges.left_end.right;
    while(half_edge != edges.right_end) {
        context.out_edge(half_edge.edge);
        half_edge = half_edge.right;
    }

    return context;
};

