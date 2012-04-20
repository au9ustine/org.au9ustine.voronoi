var v_demo = {

    recompute: Voronoi.main,
    sites: [],
    context: null,
    margin: 100,
    canvas: null,

    normalizeEventCoords: function(target,e) {
        if(!e) {
            e = self.event;
        }
        var x = 0;
	    var y = 0;
	    if (e.pageX || e.pageY) {
		    x = e.pageX;
		    y = e.pageY;
	    }
	    // else if (e.clientX || e.clientY) {
		//     x = e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
		//     y = e.clientY+document.body.scrollTop+document.documentElement.scrollTop;
	    // }
	    return [x-target.offsetLeft,y-target.offsetTop];
    },

    init: function() {
        var me = this;
        this.canvas = document.getElementById('voronoi_canvas');
        var current_aspect_ratio = window.innerWidth / window.innerHeight;
        this.canvas.height = this.canvas.width / current_aspect_ratio;
		this.canvas.onmousemove = function(e) {
            var sites = me.sites;
			if (!sites.length) {return;}
			var site = sites[0];
			var mouse = me.normalizeEventCoords(me.canvas,e);
			site[0] = mouse[0];
			site[1] = mouse[1];
			me.context = me.recompute(sites);
			me.render();
		};
		this.canvas.onclick = function(e) {
			var mouse = me.normalizeEventCoords(me.canvas,e);
			me.addSite(mouse[0],mouse[1]);
			me.render();
		};
		this.randomSites(10,true);
		this.render();
    },
    clearSites: function() {
		// we want at least one site, the one tracking the mouse
		this.sites = [[0,0]];
        this.context = this.recompute(this.sites);
	},
    randomSites: function(n,clear) {
		if (clear) {this.sites = [];}
		var xo = this.margin;
		var dx = this.canvas.width-this.margin*2;
		var yo = this.margin;
		var dy = this.canvas.height-this.margin*2;
		for (var i=0; i<n; i++) {
			this.sites.push([self.Math.round(xo+self.Math.random()*dx),self.Math.round(yo+self.Math.random()*dy)]);
		}
		this.context = this.recompute(this.sites);
	},
    addSite: function(x,y) {
		this.sites.push([x,y]);
		this.context = this.recompute(this.sites);
	},
    render: function() {
        var ctx = this.canvas.getContext('2d');
		// background
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.rect(0,0,this.canvas.width,this.canvas.height);
		ctx.fillStyle = '#fff';
		ctx.fill();
		ctx.strokeStyle = '#888';
		ctx.stroke();
		// voronoi
		if (!this.context) {return;}
		ctx.strokeStyle='#000';
		// edges
		var v;
        if(this.context.edges) {
            var edge;
            ctx.beginPath();
            for(var i = 0; i < this.context.edges.length; i++) {
                edge = this.context.get_edge(i);
                if(edge){
                    v = edge[0];
                    ctx.moveTo(v[0],v[1]);
                    v = edge[1];
                    ctx.lineTo(v[0],v[1]);
                }
            }
            ctx.stroke();
            // half-edges
            for(var i = 0; i < this.context.edges.length; i++) {
                var half_edge = this.context.get_halfedge(i);
                if(half_edge) {
                    v = half_edge[0];
                    ctx.beginPath();
                    if(v) {
                        ctx.moveTo(v[0],v[1]);
                        ctx.lineTo(Infinity,Infinity);
                    } else {
                        v = half_edge[1];
                        ctx.moveTo(Infinity,Infinity);
                        ctx.lineTo(v[0],v[1]);
                    }
                    ctx.fill();
                }
            }
        }

        // sites
        var sites = this.sites.slice(0);
        if(!sites.length){return;}
        var site;
        ctx.beginPath();
        ctx.fillStyle = '#44f';
        while(sites.length) {
            site = sites.shift();
            ctx.rect(site[0]-2/3,site[1]-2/3,2,2);
        }
        ctx.fill();
    }
};
v_demo.init();