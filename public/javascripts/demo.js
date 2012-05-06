var v_demo = {

    voronoi: new Voronoi(),
    sites: [],
    context: null,
    margin: 100,
    canvas: null,
    bbox: {xl:0,xr:940,yt:0,yb:529},

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
	    else if (e.clientX || e.clientY) {
		    x = e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
		    y = e.clientY+document.body.scrollTop+document.documentElement.scrollTop;
	    }
	    return {x:x-target.offsetLeft,y:y-target.offsetTop};
    },

    init: function() {
        var me = this;
        this.canvas = document.getElementById('voronoi_canvas');
		this.canvas.onmousemove = function(e) {
            // var sites = me.sites;
			if (!me.sites.length) {return;}
			var site = me.sites[0];
			var mouse = me.normalizeEventCoords(me.canvas,e);
			site.x = mouse.x;
			site.y = mouse.y;
			me.context = me.voronoi.compute(me.sites,me.bbox);
			me.render();
		};
		this.canvas.onclick = function(e) {
			var mouse = me.normalizeEventCoords(me.canvas,e);
		    me.addSite(mouse.x,mouse.y);
			me.render();
		};
        this.canvas.onkeydown = function(evt) {
            switch(evt.keyCode){
            case 37:
                if(me.sites.length > 3) {
                    me.sites.pop();
                    me.context = me.voronoi.compute(me.sites,me.bbox);
                    me.render();
                }
                break;
            default:
                break;
            }
        };
		this.randomSites(10,true);
		this.render();
    },
    clearSites: function() {
		// we want at least one site, the one tracking the mouse
		this.sites = [];
        this.context = this.voronoi.compute(this.sites,this.bbox);
	},
    randomSites: function(n,clear) {
		if (clear) {this.sites = [];}
		var xo = this.margin;
		var dx = this.canvas.width-this.margin*2;
		var yo = this.margin;
		var dy = this.canvas.height-this.margin*2;
		for (var i=0; i<n; i++) {
			this.sites.push({x:self.Math.round(xo+self.Math.random()*dx),y:self.Math.round(yo+self.Math.random()*dy)});
		}
		this.context = this.voronoi.compute(this.sites,this.bbox);
	},
    addSite: function(x,y) {
		this.sites.push({x:x,y:y});
		this.context = this.voronoi.compute(this.sites,this.bbox);
	},
    popSite: function() {
        if(this.sites.length > 1){
            this.sites.pop();
            this.context = this.voronoi.compute(this.sites,this.bbox);
        }
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
		var edges = this.context.edges;
        var iEdge = edges.length;
        if(iEdge) {
            var edge,v;
            ctx.beginPath();
            while(iEdge--) {
                edge = edges[iEdge];
                v = edge.va;
                ctx.moveTo(v.x,v.y);
                v = edge.vb;
                ctx.lineTo(v.x,v.y);
            }
            ctx.stroke();
            
        }

        // sites prepare
        var sites = this.sites;
        var nSites = sites.length;
        if(nSites === 0){return;}

        // cell
        var cell = this.context.cells[this.sites[0].voronoiId];
        if (cell !== undefined) {
			var halfedges = cell.halfedges,
			nHalfedges = halfedges.length;
			if (nHalfedges < 3) {return;}
			var	v = halfedges[0].getStartpoint();
			ctx.beginPath();
			ctx.moveTo(v.x,v.y);
			for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
				v = halfedges[iHalfedge].getEndpoint();
				ctx.lineTo(v.x,v.y);
			}
			ctx.fillStyle = '#adff2f';
			ctx.fill();
		}
	    
        // sites
        var site;
        ctx.beginPath();
        ctx.fillStyle = '#44f';
        for(var iSite=nSites-1;iSite>=0;iSite-=1) {
            site = sites[iSite];
            ctx.rect(site.x-2/3,site.y-2/3,2,2);
        }
        ctx.fill();
    }
};
v_demo.init();
window.addEventListener('keydown',v_demo.canvas.onkeydown,true);