// global math
function Voronoi() {
	this.edges = null;
	this.cells = null;
	this.beachsectionJunkyard = [];
	this.circleEventJunkyard = [];
}

Voronoi.prototype.reset = function() {
	if (!this.beachline) {
		this.beachline = new this.RBTree();
	}
	// Move leftover beachsections to the beachsection junkyard.
	if (this.beachline.root) {
		var beachsection = this.beachline.getFirst(this.beachline.root);
		while (beachsection) {
			this.beachsectionJunkyard.push(beachsection); // mark for reuse
			beachsection = beachsection.rbNext;
		}
	}
	this.beachline.root = null;
	if (!this.circleEvents) {
		this.circleEvents = new this.RBTree();
	}
	this.circleEvents.root = this.firstCircleEvent = null;
	this.edges = [];
	this.cells = [];
};

Voronoi.prototype.sqrt = Math.sqrt;
Voronoi.prototype.abs = Math.abs;
Voronoi.prototype.EPSILON = 1e-9;
Voronoi.prototype.equalWithEpsilon = function(a,b){return this.abs(a-b)<1e-9;};
Voronoi.prototype.greaterThanWithEpsilon = function(a,b){return a-b>1e-9;};
Voronoi.prototype.greaterThanOrEqualWithEpsilon = function(a,b){return b-a<1e-9;};
Voronoi.prototype.lessThanWithEpsilon = function(a,b){return b-a>1e-9;};
Voronoi.prototype.lessThanOrEqualWithEpsilon = function(a,b){return a-b<1e-9;};

// ----------------------------------------------------------------
// 红黑树 基于Franck Bui-Huu的C语言实现"rbtree"，引用自
// https://github.com/fbuihuu/libtree/blob/master/rb.c

Voronoi.prototype.RBTree = function() {
	this.root = null;
};

// 红黑树 插入
Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function(node, successor) {
	var parent;
    // 按常规二叉树插入节点
	if (node) {
		// 此处后继的前一个节点连入node用于缓存
		successor.rbPrevious = node;
		successor.rbNext = node.rbNext;
		if (node.rbNext) {
			node.rbNext.rbPrevious = successor;
		}
		node.rbNext = successor;
		if (node.rbRight) {
			// node.rbRight.getFirst()的原地展开
			node = node.rbRight;
			while (node.rbLeft) {node = node.rbLeft;}
			node.rbLeft = successor;
		}
		else {
			node.rbRight = successor;
		}
		parent = node;
	} else if (this.root) { // 如果node是null，successor必须插入到树的最左端
		node = this.getFirst(this.root);
		// prev/next作缓存
		successor.rbPrevious = null;
		successor.rbNext = node;
		node.rbPrevious = successor;
		
		node.rbLeft = successor;
		parent = node;
	}
	else {
		// prev/next作缓存
		successor.rbPrevious = successor.rbNext = null;
		
		this.root = successor;
		parent = null;
	}
	successor.rbLeft = successor.rbRight = null;
	successor.rbParent = parent;
	successor.rbRed = true;
    // 用重绘节点颜色和旋转的方法（最多2次旋转）来修正新插入节点后的树，
	// 以此来保证该红黑树的性质。
	var grandpa, uncle;
	node = successor;
	while (parent && parent.rbRed) {
		grandpa = parent.rbParent;
		if (parent === grandpa.rbLeft) {
			uncle = grandpa.rbRight;
			if (uncle && uncle.rbRed) { // 第1种情况：叔节点是红的
				parent.rbRed = uncle.rbRed = false;
				grandpa.rbRed = true;
				node = grandpa;
			}
			else {              // 第2种情况：叔节点是黑的，新节点是父节点的右孩子
				if (node === parent.rbRight) {
					this.rbRotateLeft(parent); // 左旋使之成为情况3
					node = parent;
					parent = node.rbParent;
				}
				parent.rbRed = false; // 第3种情况：叔节点是黑的，新节点是父节点的左孩子
				grandpa.rbRed = true;
				this.rbRotateRight(grandpa); // 右旋使红黑树的颜色合法
			}
		} else {                // 第4、5、6种情况与第1、2、3种情况对称
			uncle = grandpa.rbLeft;
			if (uncle && uncle.rbRed) {
				parent.rbRed = uncle.rbRed = false;
				grandpa.rbRed = true;
				node = grandpa;
			}
			else {
				if (node === parent.rbLeft) {
					this.rbRotateRight(parent);
					node = parent;
					parent = node.rbParent;
				}
				parent.rbRed = false;
				grandpa.rbRed = true;
				this.rbRotateLeft(grandpa);
			}
		}
		parent = node.rbParent;
	}
	this.root.rbRed = false;    // 最后保持根节点颜色是黑的
};

Voronoi.prototype.RBTree.prototype.rbRemoveNode = function(node) {
    // 先按普通二叉树删除节点
	// 此处prev/next用于缓存
	if (node.rbNext) {
		node.rbNext.rbPrevious = node.rbPrevious;
	}
	if (node.rbPrevious) {
		node.rbPrevious.rbNext = node.rbNext;
	}
	node.rbNext = node.rbPrevious = null;

	var parent = node.rbParent,
	left = node.rbLeft,
	right = node.rbRight,
	next;
	if (!left) {
		next = right;
	} else if (!right) {
		next = left;
	} else {
		next = this.getFirst(right);
	}
	if (parent) {
		if (parent.rbLeft === node) {
			parent.rbLeft = next;
		}
		else {
			parent.rbRight = next;
		}
	}
	else {
		this.root = next;
	}
	// 加入红黑树的性质
	var isRed;
	if (left && right) {
		isRed = next.rbRed;
		next.rbRed = node.rbRed;
		next.rbLeft = left;
		left.rbParent = next;
		if (next !== right) {
			parent = next.rbParent;
			next.rbParent = node.rbParent;
			node = next.rbRight;
			parent.rbLeft = node;
			next.rbRight = right;
			right.rbParent = next;
		}
		else {
			next.rbParent = parent;
			parent = next;
			node = next.rbRight;
		}
	}
	else {
		isRed = node.rbRed;
		node = next;
	}
    // 因为后继可以被移除，所以node是单个后继的孩子节点并且parent是它的新父节点
	if (node) {
		node.rbParent = parent;
	}
	// 若为红，不需要进行调整也不会影响红黑树的性质
	if (isRed) {return;}
	if (node && node.rbRed) {
		node.rbRed = false;
		return;
	}
	// 若为黑，则进行调整
	var sibling;
	do {
		if (node === this.root) {
			break;
		}
		if (node === parent.rbLeft) { // 如果是父节点的左孩子
			sibling = parent.rbRight;
			if (sibling.rbRed) { // 第1种情况：兄弟节点是红的
				sibling.rbRed = false;
				parent.rbRed = true;
				this.rbRotateLeft(parent);
				sibling = parent.rbRight;
			}
            // 第2种情况：兄弟节点是黑的，且兄弟的孩子都是黑的
			if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
				if (!sibling.rbRight || !sibling.rbRight.rbRed) { // 第3种情况：兄弟节点是黑的，且兄弟的左孩子是红的，右孩子是黑的
					sibling.rbLeft.rbRed = false;
					sibling.rbRed = true;
					this.rbRotateRight(sibling); // 右旋保证红黑树的颜色性质
					sibling = parent.rbRight;
				}
				sibling.rbRed = parent.rbRed; // 第4种情况：兄弟节点是黑的，且兄弟的右孩子是红的
				parent.rbRed = sibling.rbRight.rbRed = false;
				this.rbRotateLeft(parent); // 左旋保证颜色性质，同时去掉额外的黑色把它变成单独黑色
				node = this.root;
				break;
			}
		} else {                // 第5、6、7、8种情况与第1、2、3、4种情况对称
			sibling = parent.rbLeft;
			if (sibling.rbRed) {
				sibling.rbRed = false;
				parent.rbRed = true;
				this.rbRotateRight(parent);
				sibling = parent.rbLeft;
			}
			if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
				if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
					sibling.rbRight.rbRed = false;
					sibling.rbRed = true;
					this.rbRotateLeft(sibling);
					sibling = parent.rbLeft;
				}
				sibling.rbRed = parent.rbRed;
				parent.rbRed = sibling.rbLeft.rbRed = false;
				this.rbRotateRight(parent);
				node = this.root;
				break;
			}
		}
		sibling.rbRed = true;
		node = parent;
		parent = parent.rbParent;
	} while (!node.rbRed);
	if (node) {node.rbRed = false;} // 节点变成黑色
};

// 红黑树 左旋操作
Voronoi.prototype.RBTree.prototype.rbRotateLeft = function(node) {
    var x = node,               // 设要左旋的节点为x
	y = node.rbRight;           // x的右孩子节点为y

    x.rbRight = y.rbLeft;       // 将y的左子树变成x的右子树
    if (y.rbLeft) {             
        y.rbLeft.rbParent = x;  
	}
    y.rbParent = x.rbParent;    // 将x的父节点连到y上
	if (!x.rbParent)
        this.root = y;
    else {
		if (x === x.rbParent.rbLeft)
			x.rbParent.rbLeft = y;
		else 
			x.rbParent.rbRight = y;
	}	
	y.rbLeft = x;               // 将x变成y的左孩子
    x.rbParent = y;
};

// 红黑树 右旋操作
Voronoi.prototype.RBTree.prototype.rbRotateRight = function(node) {
	// 与左旋呈对称状
    var x = node,
    y = node.rbLeft;

    x.rbLeft = y.rbRight;
    if(y.rbRight)
        y.rbRight.rbParent = x;

    y.rbParent = x.rbParent;
    if(!x.rbParent)
        this.root = y;
    else {
        if(x === x.rbParent.rbLeft)
            x.rbParent.rbLeft = y;
        else
            x.rbParent.rbRight = y;
    }
    y.rbRight = x;
    x.rbParent = y;
};

// 取得该红黑树中最左端的节点
Voronoi.prototype.RBTree.prototype.getFirst = function(node) {
	while (node.rbLeft) {
		node = node.rbLeft;
	}
	return node;
};

// 取得该红黑树中最右端的节点
Voronoi.prototype.RBTree.prototype.getLast = function(node) {
	while (node.rbRight) {
		node = node.rbRight;
	}
	return node;
};

// Cell的方法
Voronoi.prototype.Cell = function(site) {
	this.site = site;
	this.halfedges = [];
};

Voronoi.prototype.Cell.prototype.prepare = function() {
	var halfedges = this.halfedges,
	iHalfedge = halfedges.length,
	edge;
	// 去除无效的半边(halfedge)
	while (iHalfedge--) {
		edge = halfedges[iHalfedge].edge;
		if (!edge.vb || !edge.va) {
			halfedges.splice(iHalfedge,1);
		}
	}
    // 按斜率排序
	halfedges.sort(function(a,b){return b.angle-a.angle;});
	return halfedges.length;
};

// 顶点
Voronoi.prototype.Vertex = function(x, y) {
	this.x = x;
	this.y = y;
};

// 边
Voronoi.prototype.Edge = function(lSite, rSite) {
	this.lSite = lSite;
	this.rSite = rSite;
	this.va = this.vb = null;
};

// 半边
Voronoi.prototype.Halfedge = function(edge, lSite, rSite) {
	this.site = lSite;
	this.edge = edge;
    // 下面的角度值用于半线段的逆时针排序，为了方便，这里的角度是指左侧
	// 基点与右侧基点所连线段所在直线的斜率的atan2值。然而有种特殊情况，
	// 靠近包围框边际的边没有“右侧基点”，所以就使用对于半线段垂直的直线
	// 的斜率的atan2值。
	if (rSite) {
		this.angle = Math.atan2(rSite.y-lSite.y, rSite.x-lSite.x);
	}
	else {
		var va = edge.va,
		vb = edge.vb;
		this.angle = edge.lSite === lSite ? Math.atan2(vb.x-va.x, va.y-vb.y)
		    : Math.atan2(va.x-vb.x, vb.y-va.y);
	}
};

Voronoi.prototype.Halfedge.prototype.getStartpoint = function() {
	return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
};

Voronoi.prototype.Halfedge.prototype.getEndpoint = function() {
	return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
};

// 创建一条边并加入内部集合中，并且创建两条半边逆时针地加入每个基点半边集合
Voronoi.prototype.createEdge = function(lSite, rSite, va, vb) {
	var edge = new this.Edge(lSite, rSite);
	this.edges.push(edge);
	if (va) {
		this.setEdgeStartpoint(edge, lSite, rSite, va);
	}
	if (vb) {
		this.setEdgeEndpoint(edge, lSite, rSite, vb);
	}
	this.cells[lSite.voronoiId].halfedges.push(new this.Halfedge(edge, lSite, rSite));
	this.cells[rSite.voronoiId].halfedges.push(new this.Halfedge(edge, rSite, lSite));
	return edge;
};

Voronoi.prototype.createBorderEdge = function(lSite, va, vb) {
	var edge = new this.Edge(lSite, null);
	edge.va = va;
	edge.vb = vb;
	this.edges.push(edge);
	return edge;
};

Voronoi.prototype.setEdgeStartpoint = function(edge, lSite, rSite, vertex) {
	if (!edge.va && !edge.vb) {
		edge.va = vertex;
		edge.lSite = lSite;
		edge.rSite = rSite;
	}
	else if (edge.lSite === rSite) {
		edge.vb = vertex;
	}
	else {
		edge.va = vertex;
	}
};

Voronoi.prototype.setEdgeEndpoint = function(edge, lSite, rSite, vertex) {
	this.setEdgeStartpoint(edge, rSite, lSite, vertex);
};

// 海滩线 方法
Voronoi.prototype.Beachsection = function() {
};

// 当海滩线弧线段在海滩线上某个给定的时间上相对较低时，在计算Voronoi图
// 的过程中会发生很多海滩线实例化，数量大概在基点数量的一倍到两倍之间。
// 所以我们选择重用已经创建的海滩线弧线段而非实例化一个全新的线段，以此
// 避免浪费内存（内存大小依据浏览器所在的平台而定）
Voronoi.prototype.createBeachsection = function(site) {
	var beachsection = this.beachsectionJunkyard.pop();
	if (!beachsection) {
		beachsection = new this.Beachsection();
	}
	beachsection.site = site;
	return beachsection;
};

// 给定特定扫描线计算一个普通海滩线线段的左断点 (代码来自rhill的实现)
Voronoi.prototype.leftBreakPoint = function(arc, directrix) {
	// http://en.wikipedia.org/wiki/Parabola
	// http://en.wikipedia.org/wiki/Quadratic_equation
	// h1 = x1,
	// k1 = (y1+directrix)/2,
	// h2 = x2,
	// k2 = (y2+directrix)/2,
	// p1 = k1-directrix,
	// a1 = 1/(4*p1),
	// b1 = -h1/(2*p1),
	// c1 = h1*h1/(4*p1)+k1,
	// p2 = k2-directrix,
	// a2 = 1/(4*p2),
	// b2 = -h2/(2*p2),
	// c2 = h2*h2/(4*p2)+k2,
	// x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
	// When x1 become the x-origin:
	// h1 = 0,
	// k1 = (y1+directrix)/2,
	// h2 = x2-x1,
	// k2 = (y2+directrix)/2,
	// p1 = k1-directrix,
	// a1 = 1/(4*p1),
	// b1 = 0,
	// c1 = k1,
	// p2 = k2-directrix,
	// a2 = 1/(4*p2),
	// b2 = -h2/(2*p2),
	// c2 = h2*h2/(4*p2)+k2,
	// x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1

    // 若要对这里的代码作出衍生性的修改，则需要注意计算机有限精度条件下的排错。
	var site = arc.site,
	rfocx = site.x,
	rfocy = site.y,
	pby2 = rfocy-directrix;
    // 当焦点在准线上时退化情况下的抛物线
	if (!pby2) {
		return rfocx;
	}
	var lArc = arc.rbPrevious;
	if (!lArc) {
		return -Infinity;
	}
	site = lArc.site;
	var lfocx = site.x,
	lfocy = site.y,
	plby2 = lfocy-directrix;
    // 当焦点在准线上时退化情况下的抛物线
	if (!plby2) {
		return lfocx;
	}
	var	hl = lfocx-rfocx,
	aby2 = 1/pby2-1/plby2,
	b = hl/plby2;
	if (aby2) {
		return (-b+this.sqrt(b*b-2*aby2*(hl*hl/(-2*plby2)-lfocy+plby2/2+rfocy-pby2/2)))/aby2+rfocx;
	}
    // 当抛物线到准线都具有相同距离时，断点在中间
	return (rfocx+lfocx)/2;
};

// 给定一条准线，计算一个普通海滩线线段的右断点
Voronoi.prototype.rightBreakPoint = function(arc, directrix) {
	var rArc = arc.rbNext;
	if (rArc) {
		return this.leftBreakPoint(rArc, directrix);
	}
	var site = arc.site;
	return site.y === directrix ? site.x : Infinity;
};

// 分离海滩线
Voronoi.prototype.detachBeachsection = function(beachsection) {
	this.detachCircleEvent(beachsection); // detach potentially attached circle event
	this.beachline.rbRemoveNode(beachsection); // remove from RB-tree
	this.beachsectionJunkyard.push(beachsection); // mark for reuse
};

// 去除海滩线线段
Voronoi.prototype.removeBeachsection = function(beachsection) {
	var circle = beachsection.circleEvent,
	x = circle.x,
	y = circle.ycenter,
	vertex = new this.Vertex(x, y),
	previous = beachsection.rbPrevious,
	next = beachsection.rbNext,
	disappearingTransitions = [beachsection],
	abs_fn = Math.abs;

    // 去除在海滩线中所有折叠的线段
	this.detachBeachsection(beachsection);

    // 在删除点的时候可能存在不止一条空弧，这种情况会在不止两条边被相同
	// 的顶点联接时发生。所以我们会通过寻找删除点的两侧情况来收集所有这
	// 些边。另外，对于任何已收缩的海滩线线段总是存在一个前驱或后继，只
	// 是在海滩线上不可能出现一个正在收缩的首条海滩线或最后一条海滩线，
	// 因为在它们的左侧或右侧是未定义的。

	// 向左寻找
	var lArc = previous;
	while (lArc.circleEvent && abs_fn(x-lArc.circleEvent.x)<1e-9 && abs_fn(y-lArc.circleEvent.ycenter)<1e-9) {
		previous = lArc.rbPrevious;
		disappearingTransitions.unshift(lArc);
		this.detachBeachsection(lArc); // 标记以便重用
		lArc = previous;
	}
    // 即使不正在消失，在这里我也会在最左侧已收缩的海滩线线段的左侧加入
	// 海滩线线段，为了方便，因为当这条海滩线线段作为为一条边的左基点时
	// 我们需要在晚些时候引用它。
	disappearingTransitions.unshift(lArc);
	this.detachCircleEvent(lArc);

	// 向右寻找
	var rArc = next;
	while (rArc.circleEvent && abs_fn(x-rArc.circleEvent.x)<1e-9 && abs_fn(y-rArc.circleEvent.ycenter)<1e-9) {
		next = rArc.rbNext;
		disappearingTransitions.push(rArc);
		this.detachBeachsection(rArc); // 标记以便重用
		rArc = next;
	}
    // 我们也会在最右端已收缩的海滩线线段的右侧加入海滩线线段，因为存在
    // 一个正在消失的转换来表示在一条边左侧的起点
	disappearingTransitions.push(rArc);
	this.detachCircleEvent(rArc);

    // 遍历所有作用在海滩线线段间正在消失的转换，并且设置它们边的起点。
	var nArcs = disappearingTransitions.length,
	iArc;
	for (iArc=1; iArc<nArcs; iArc++) {
		rArc = disappearingTransitions[iArc];
		lArc = disappearingTransitions[iArc-1];
		this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
	}

    // 现在我们拥有一个在两条海滩线线段间新的转换，而原先是不相邻的。因
	// 为这条边因新顶点被定义后出现，顶点实际上定义了边的一个端点（相对
	// 于基点的左侧来说）
	lArc = disappearingTransitions[0];
	rArc = disappearingTransitions[nArcs-1];
	rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

    // 如果任何海滩线线段留在邻接已退化线段的海滩线中，创建圆事件。
	this.attachCircleEvent(lArc);
	this.attachCircleEvent(rArc);
};

Voronoi.prototype.addBeachsection = function(site) {
	var x = site.x,
	directrix = site.y;

    // 在新创建的海滩线周围寻找左侧和右侧的海滩线线段。这个循环经常被执行
    // 因为我们使用in-place的方式来展开与误差epsilon比较的函数调用。
	var lArc, rArc,
	dxl, dxr,
	node = this.beachline.root;

	while (node) {
		dxl = this.leftBreakPoint(node,directrix)-x;
        // x和xl在误差允许内，落在大概海滩线左侧边之前
		if (dxl > 1e-9) {
			node = node.rbLeft;
		}
		else {
			dxr = x-this.rightBreakPoint(node,directrix);
            // x和xr在误差允许范围外，落在海滩线右侧边
			if (dxr > 1e-9) {
				if (!node.rbRight) {
					lArc = node;
					break;
				}
				node = node.rbRight;
			}
			else {
				// x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
				if (dxl > -1e-9) {
					lArc = node.rbPrevious;
					rArc = node;
				}
				// x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
				else if (dxr > -1e-9) {
					lArc = node;
					rArc = node.rbNext;
				}
				// falls exactly somewhere in the middle of the beachsection
				else {
					lArc = rArc = node;
				}
				break;
			}
		}
	}
	// at this point, keep in mind that lArc and/or rArc could be
	// undefined or null.

	// create a new beach section object for the site and add it to RB-tree
	var newArc = this.createBeachsection(site);
	this.beachline.rbInsertSuccessor(lArc, newArc);

	// cases:
	//

	// [null,null]
	// least likely case: new beach section is the first beach section on the
	// beachline.
	// This case means:
	//   no new transition appears
	//   no collapsing beach section
	//   new beachsection become root of the RB-tree
	if (!lArc && !rArc) {
		return;
	}

	// [lArc,rArc] where lArc == rArc
	// most likely case: new beach section split an existing beach
	// section.
	// This case means:
	//   one new transition appears
	//   the left and right beach section might be collapsing as a result
	//   two new nodes added to the RB-tree
	if (lArc === rArc) {
		// invalidate circle event of split beach section
		this.detachCircleEvent(lArc);

		// split the beach section into two separate beach sections
		rArc = this.createBeachsection(lArc.site);
		this.beachline.rbInsertSuccessor(newArc, rArc);

		// since we have a new transition between two beach sections,
		// a new edge is born
		newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

		// check whether the left and right beach sections are collapsing
		// and if so create circle events, to be notified when the point of
		// collapse is reached.
		this.attachCircleEvent(lArc);
		this.attachCircleEvent(rArc);
		return;
	}

	// [lArc,null]
	// even less likely case: new beach section is the *last* beach section
	// on the beachline -- this can happen *only* if *all* the previous beach
	// sections currently on the beachline share the same y value as
	// the new beach section.
	// This case means:
	//   one new transition appears
	//   no collapsing beach section as a result
	//   new beach section become right-most node of the RB-tree
	if (lArc && !rArc) {
		newArc.edge = this.createEdge(lArc.site,newArc.site);
		return;
	}

	// [null,rArc]
	// impossible case: because sites are strictly processed from top to bottom,
	// and left to right, which guarantees that there will always be a beach section
	// on the left -- except of course when there are no beach section at all on
	// the beach line, which case was handled above.
	// rhill 2011-06-02: No point testing in non-debug version
	//if (!lArc && rArc) {
	//	throw "Voronoi.addBeachsection(): What is this I don't even";
	//	}

	// [lArc,rArc] where lArc != rArc
	// somewhat less likely case: new beach section falls *exactly* in between two
	// existing beach sections
	// This case means:
	//   one transition disappears
	//   two new transitions appear
	//   the left and right beach section might be collapsing as a result
	//   only one new node added to the RB-tree
	if (lArc !== rArc) {
		// invalidate circle events of left and right sites
		this.detachCircleEvent(lArc);
		this.detachCircleEvent(rArc);

		// an existing transition disappears, meaning a vertex is defined at
		// the disappearance point.
		// since the disappearance is caused by the new beachsection, the
		// vertex is at the center of the circumscribed circle of the left,
		// new and right beachsections.
		// http://mathforum.org/library/drmath/view/55002.html
		// Except that I bring the origin at A to simplify
		// calculation
		var lSite = lArc.site,
		ax = lSite.x,
		ay = lSite.y,
		bx=site.x-ax,
		by=site.y-ay,
		rSite = rArc.site,
		cx=rSite.x-ax,
		cy=rSite.y-ay,
		d=2*(bx*cy-by*cx),
		hb=bx*bx+by*by,
		hc=cx*cx+cy*cy,
		vertex = new this.Vertex((cy*hb-by*hc)/d+ax, (bx*hc-cx*hb)/d+ay);

		// one transition disappear
		this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);

		// two new transitions appear at the new vertex location
		newArc.edge = this.createEdge(lSite, site, undefined, vertex);
		rArc.edge = this.createEdge(site, rSite, undefined, vertex);

		// check whether the left and right beach sections are collapsing
		// and if so create circle events, to handle the point of collapse.
		this.attachCircleEvent(lArc);
		this.attachCircleEvent(rArc);
		return;
	}
};

// ---------------------------------------------------------------------------
// Circle event methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.CircleEvent = function() {
};

Voronoi.prototype.attachCircleEvent = function(arc) {
	var lArc = arc.rbPrevious,
	rArc = arc.rbNext;
	if (!lArc || !rArc) {return;} // does that ever happen?
	var lSite = lArc.site,
	cSite = arc.site,
	rSite = rArc.site;

	// If site of left beachsection is same as site of
	// right beachsection, there can't be convergence
	if (lSite===rSite) {return;}

	// Find the circumscribed circle for the three sites associated
	// with the beachsection triplet.
	// rhill 2011-05-26: It is more efficient to calculate in-place
	// rather than getting the resulting circumscribed circle from an
	// object returned by calling Voronoi.circumcircle()
	// http://mathforum.org/library/drmath/view/55002.html
	// Except that I bring the origin at cSite to simplify calculations.
	// The bottom-most part of the circumcircle is our Fortune 'circle
	// event', and its center is a vertex potentially part of the final
	// Voronoi diagram.
	var bx = cSite.x,
	by = cSite.y,
	ax = lSite.x-bx,
	ay = lSite.y-by,
	cx = rSite.x-bx,
	cy = rSite.y-by;

	// If points l->c->r are clockwise, then center beach section does not
	// collapse, hence it can't end up as a vertex (we reuse 'd' here, which
	// sign is reverse of the orientation, hence we reverse the test.
	// http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
	// rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
	// return infinites: 1e-12 seems to fix the problem.
	var d = 2*(ax*cy-ay*cx);
	if (d >= -2e-12){return;}

	var	ha = ax*ax+ay*ay,
	hc = cx*cx+cy*cy,
	x = (cy*ha-ay*hc)/d,
	y = (ax*hc-cx*ha)/d,
	ycenter = y+by;

	// Important: ybottom should always be under or at sweep, so no need
	// to waste CPU cycles by checking

	// recycle circle event object if possible
	var circleEvent = this.circleEventJunkyard.pop();
	if (!circleEvent) {
		circleEvent = new this.CircleEvent();
	}
	circleEvent.arc = arc;
	circleEvent.site = cSite;
	circleEvent.x = x+bx;
	circleEvent.y = ycenter+this.sqrt(x*x+y*y); // y bottom
	circleEvent.ycenter = ycenter;
	arc.circleEvent = circleEvent;

	// find insertion point in RB-tree: circle events are ordered from
	// smallest to largest
	var predecessor = null,
	node = this.circleEvents.root;
	while (node) {
		if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
			if (node.rbLeft) {
				node = node.rbLeft;
			}
			else {
				predecessor = node.rbPrevious;
				break;
			}
		}
		else {
			if (node.rbRight) {
				node = node.rbRight;
			}
			else {
				predecessor = node;
				break;
			}
		}
	}
	this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);
	if (!predecessor) {
		this.firstCircleEvent = circleEvent;
	}
};

Voronoi.prototype.detachCircleEvent = function(arc) {
	var circle = arc.circleEvent;
	if (circle) {
		if (!circle.rbPrevious) {
			this.firstCircleEvent = circle.rbNext;
		}
		this.circleEvents.rbRemoveNode(circle); // remove from RB-tree
		this.circleEventJunkyard.push(circle);
		arc.circleEvent = null;
	}
};

// ---------------------------------------------------------------------------
// Diagram completion methods

// connect dangling edges (not if a cursory test tells us
// it is not going to be visible.
// return value:
//   false: the dangling endpoint couldn't be connected
//   true: the dangling endpoint could be connected
Voronoi.prototype.connectEdge = function(edge, bbox) {
	// skip if end point already connected
	var vb = edge.vb;
	if (!!vb) {return true;}

	// make local copy for performance purpose
	var va = edge.va,
	xl = bbox.xl,
	xr = bbox.xr,
	yt = bbox.yt,
	yb = bbox.yb,
	lSite = edge.lSite,
	rSite = edge.rSite,
	lx = lSite.x,
	ly = lSite.y,
	rx = rSite.x,
	ry = rSite.y,
	fx = (lx+rx)/2,
	fy = (ly+ry)/2,
	fm, fb;

	// get the line equation of the bisector if line is not vertical
	if (ry !== ly) {
		fm = (lx-rx)/(ry-ly);
		fb = fy-fm*fx;
	}

	// remember, direction of line (relative to left site):
	// upward: left.x < right.x
	// downward: left.x > right.x
	// horizontal: left.x == right.x
	// upward: left.x < right.x
	// rightward: left.y < right.y
	// leftward: left.y > right.y
	// vertical: left.y == right.y

	// depending on the direction, find the best side of the
	// bounding box to use to determine a reasonable start point

	// special case: vertical line
	if (fm === undefined) {
		// doesn't intersect with viewport
		if (fx < xl || fx >= xr) {return false;}
		// downward
		if (lx > rx) {
			if (!va) {
				va = new this.Vertex(fx, yt);
			}
			else if (va.y >= yb) {
				return false;
			}
			vb = new this.Vertex(fx, yb);
		}
		// upward
		else {
			if (!va) {
				va = new this.Vertex(fx, yb);
			}
			else if (va.y < yt) {
				return false;
			}
			vb = new this.Vertex(fx, yt);
		}
	}
	// closer to vertical than horizontal, connect start point to the
	// top or bottom side of the bounding box
	else if (fm < -1 || fm > 1) {
		// downward
		if (lx > rx) {
			if (!va) {
				va = new this.Vertex((yt-fb)/fm, yt);
			}
			else if (va.y >= yb) {
				return false;
			}
			vb = new this.Vertex((yb-fb)/fm, yb);
		}
		// upward
		else {
			if (!va) {
				va = new this.Vertex((yb-fb)/fm, yb);
			}
			else if (va.y < yt) {
				return false;
			}
			vb = new this.Vertex((yt-fb)/fm, yt);
		}
	}
	// closer to horizontal than vertical, connect start point to the
	// left or right side of the bounding box
	else {
		// rightward
		if (ly < ry) {
			if (!va) {
				va = new this.Vertex(xl, fm*xl+fb);
			}
			else if (va.x >= xr) {
				return false;
			}
			vb = new this.Vertex(xr, fm*xr+fb);
		}
		// leftward
		else {
			if (!va) {
				va = new this.Vertex(xr, fm*xr+fb);
			}
			else if (va.x < xl) {
				return false;
			}
			vb = new this.Vertex(xl, fm*xl+fb);
		}
	}
	edge.va = va;
	edge.vb = vb;
	return true;
};

// line-clipping code taken from:
//   Liang-Barsky function by Daniel White
//   http://www.skytopia.com/project/articles/compsci/clipping.html
// Thanks!
// A bit modified to minimize code paths
Voronoi.prototype.clipEdge = function(edge, bbox) {
	var ax = edge.va.x,
	ay = edge.va.y,
	bx = edge.vb.x,
	by = edge.vb.y,
	t0 = 0,
	t1 = 1,
	dx = bx-ax,
	dy = by-ay;
	// left
	var q = ax-bbox.xl;
	if (dx===0 && q<0) {return false;}
	var r = -q/dx;
	if (dx<0) {
		if (r<t0) {return false;}
		else if (r<t1) {t1=r;}
	}
	else if (dx>0) {
		if (r>t1) {return false;}
		else if (r>t0) {t0=r;}
	}
	// right
	q = bbox.xr-ax;
	if (dx===0 && q<0) {return false;}
	r = q/dx;
	if (dx<0) {
		if (r>t1) {return false;}
		else if (r>t0) {t0=r;}
	}
	else if (dx>0) {
		if (r<t0) {return false;}
		else if (r<t1) {t1=r;}
	}
	// top
	q = ay-bbox.yt;
	if (dy===0 && q<0) {return false;}
	r = -q/dy;
	if (dy<0) {
		if (r<t0) {return false;}
		else if (r<t1) {t1=r;}
	}
	else if (dy>0) {
		if (r>t1) {return false;}
		else if (r>t0) {t0=r;}
	}
	// bottom		
	q = bbox.yb-ay;
	if (dy===0 && q<0) {return false;}
	r = q/dy;
	if (dy<0) {
		if (r>t1) {return false;}
		else if (r>t0) {t0=r;}
	}
	else if (dy>0) {
		if (r<t0) {return false;}
		else if (r<t1) {t1=r;}
	}

	// if we reach this point, Voronoi edge is within bbox

	// if t0 > 0, va needs to change
	// rhill 2011-06-03: we need to create a new vertex rather
	// than modifying the existing one, since the existing
	// one is likely shared with at least another edge
	if (t0 > 0) {
		edge.va = new this.Vertex(ax+t0*dx, ay+t0*dy);
	}

	// if t1 < 1, vb needs to change
	// rhill 2011-06-03: we need to create a new vertex rather
	// than modifying the existing one, since the existing
	// one is likely shared with at least another edge
	if (t1 < 1) {
		edge.vb = new this.Vertex(ax+t1*dx, ay+t1*dy);
	}

	return true;
};

// Connect/cut edges at bounding box
Voronoi.prototype.clipEdges = function(bbox) {
	// connect all dangling edges to bounding box
	// or get rid of them if it can't be done
	var edges = this.edges,
	iEdge = edges.length,
	edge,
	abs_fn = Math.abs;

	// iterate backward so we can splice safely
	while (iEdge--) {
		edge = edges[iEdge];
		// edge is removed if:
		//   it is wholly outside the bounding box
		//   it is actually a point rather than a line
		if (!this.connectEdge(edge, bbox) || !this.clipEdge(edge, bbox) || (abs_fn(edge.va.x-edge.vb.x)<1e-9 && abs_fn(edge.va.y-edge.vb.y)<1e-9)) {
			edge.va = edge.vb = null;
			edges.splice(iEdge,1);
		}
	}
};

// Close the cells.
// The cells are bound by the supplied bounding box.
// Each cell refers to its associated site, and a list
// of halfedges ordered counterclockwise.
Voronoi.prototype.closeCells = function(bbox) {
	// prune, order halfedges, then add missing ones
	// required to close cells
	var xl = bbox.xl,
	xr = bbox.xr,
	yt = bbox.yt,
	yb = bbox.yb,
	cells = this.cells,
	iCell = cells.length,
	cell,
	iLeft, iRight,
	halfedges, nHalfedges,
	edge,
	startpoint, endpoint,
	va, vb,
	abs_fn = Math.abs;

	while (iCell--) {
		cell = cells[iCell];
		// trim non fully-defined halfedges and sort them counterclockwise
		if (!cell.prepare()) {
			continue;
		}
		// close open cells
		// step 1: find first 'unclosed' point, if any.
		// an 'unclosed' point will be the end point of a halfedge which
		// does not match the start point of the following halfedge
		halfedges = cell.halfedges;
		nHalfedges = halfedges.length;
		// special case: only one site, in which case, the viewport is the cell
		// ...
		// all other cases
		iLeft = 0;
		while (iLeft < nHalfedges) {
			iRight = (iLeft+1) % nHalfedges;
			endpoint = halfedges[iLeft].getEndpoint();
			startpoint = halfedges[iRight].getStartpoint();
			// if end point is not equal to start point, we need to add the missing
			// halfedge(s) to close the cell
			if (abs_fn(endpoint.x-startpoint.x)>=1e-9 || abs_fn(endpoint.y-startpoint.y)>=1e-9) {
				// if we reach this point, cell needs to be closed by walking
				// counterclockwise along the bounding box until it connects
				// to next halfedge in the list
				va = endpoint;
				// walk downward along left side
				if (this.equalWithEpsilon(endpoint.x,xl) && this.lessThanWithEpsilon(endpoint.y,yb)) {
					vb = new this.Vertex(xl, this.equalWithEpsilon(startpoint.x,xl) ? startpoint.y : yb);
				}
				// walk rightward along bottom side
				else if (this.equalWithEpsilon(endpoint.y,yb) && this.lessThanWithEpsilon(endpoint.x,xr)) {
					vb = new this.Vertex(this.equalWithEpsilon(startpoint.y,yb) ? startpoint.x : xr, yb);
				}
				// walk upward along right side
				else if (this.equalWithEpsilon(endpoint.x,xr) && this.greaterThanWithEpsilon(endpoint.y,yt)) {
					vb = new this.Vertex(xr, this.equalWithEpsilon(startpoint.x,xr) ? startpoint.y : yt);
				}
				// walk leftward along top side
				else if (this.equalWithEpsilon(endpoint.y,yt) && this.greaterThanWithEpsilon(endpoint.x,xl)) {
					vb = new this.Vertex(this.equalWithEpsilon(startpoint.y,yt) ? startpoint.x : xl, yt);
				}
				edge = this.createBorderEdge(cell.site, va, vb);
				halfedges.splice(iLeft+1, 0, new this.Halfedge(edge, cell.site, null));
				nHalfedges = halfedges.length;
			}
			iLeft++;
		}
	}
};

// ---------------------------------------------------------------------------
// 顶层Fortune循环

// Voronoi基点保留在浏览器端，是为了使用户能自由地修改内容，在计算时间
// 上，对基点的引用会被局部拷贝
Voronoi.prototype.compute = function(sites, bbox) {
	// to measure execution time
	var startTime = new Date();

	// 初始化内部节点
	this.reset();

	// 初始化基点事件队列，并排序
	var siteEvents = sites.slice(0);
	siteEvents.sort(function(a,b){
		var r = b.y - a.y;
		if (r) {return r;}
		return b.x - a.x;
	});

	// 处理队列
	var site = siteEvents.pop(),
	siteid = 0,
	xsitex = Number.MIN_VALUE, // 为了避免重复的基点
	xsitey = Number.MIN_VALUE,
	cells = this.cells,
	circle;

	// 主循环
	for (;;) {
        // 我们需要判断处理的是基点事件还是圆事件，为此我们需要寻找是否
		// 存在一个基点事件并且比圆事件早
		circle = this.firstCircleEvent;

		// 如果是基点事件，加入海滩线弧线段
		if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
			// 仅当基点不重叠时
			if (site.x !== xsitex || site.y !== xsitey) {
				// 首先为基点创建一个Voronoi单元
				cells[siteid] = new this.Cell(site);
				site.voronoiId = siteid++;
				// 然后为该基点创建一条海滩线弧线段
				this.addBeachsection(site);
				// 记忆最后的坐标以便检测是否重复
				xsitey = site.y;
				xsitex = site.x;
			}
			site = siteEvents.pop();
		}

		// 如果是圆事件，移除海滩线线段
		else if (circle) {
			this.removeBeachsection(circle.arc);
		}

		// 如果事件队列为空，结束
		else {
			break;
		}
	}

    // 补充原Fortune算法：
    // 连接不完全的边到包围框上
    // 剪切边使之适合包围框
    // 完全去掉在包围框外面的边
    // 去掉像点一样的边（尤其是已退化的边）
	this.clipEdges(bbox);

    // 加入遗失的边用于闭合那些未闭合的Voronoi单元
	this.closeCells(bbox);

	// 衡量时间
	var stopTime = new Date();

	// 准备返回值
	var result = {
		cells: this.cells,
		edges: this.edges,
		execTime: stopTime.getTime()-startTime.getTime()
	};

	// 清理并重置，为下一次运算作准备
	this.reset();

	return result;
};
