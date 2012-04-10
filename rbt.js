var COLOR = {
    BLACK: 0,                   // #000000
    RED: 16711680               // #ff0000
};

function node() {
    this.data = null;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.color = null;
}

node.prototype.get_grandparent = function() {
    if((n != null) && (n.parent != null))
        return n.parent.parent;
    else
        return null;
}

node.prototype.get_uncle = function() {
    var g = this.get_grandparent();
    if(g == null)
        return null;
    if(n.parent == g.left)
        return g.right;
    else
        return g.left;
}

node.prototype.get_sibling = function() {
    if(n == n.parent.left)
        return n.parent.right;
    else
        return n.parent.left;
}

node.prototype.set_child = function(n) {
    if(this.left)
        this.right = n;
    else
        this.left = n;
}


node.prototype.is_root = function() {
    return this.parent == null;
}

node.prototype.is_black = function() {
    return this.color == COLOR.BLACK;
}

node.prototype.is_red = function() {
    return this.color == COLOR.RED;
}


node.prototype.get_first = function() {
    var n = this.left;
    while(n.left)
        n = n.left;
    return n;
}

node.prototype.get_last = function() {
    var n = this.right;
    while(n.right)
        n = n.right;
    return n;
}

node.prototype.next = function() {
    var parent;
    var n = this;

    if(n.right)
        return n.right.get_first();
    parent = n.parent;
    while((parent) && (parent.right == n))
        n = parent;
    return parent;
}

node.prototype.prev = function() {
    var parent;
    var n = this;

    if(n.left)
        return n.left.get_last();
    parent = n.parent;
    while((parent) && (parent.left == n))
        n = parent;
    return parent;
}

node.prototype.compare = function(x) {
    if(x.data < this.data)
        return 1;
    if(x.data > this.data)
        return -1;
    return 0;
}

node.prototype.is_leaf = function() {
    if(this.left)
        return false;
    if(this.right)
        return false;
    return true;
}


function rb_tree() {
    this.root = new node();
    this.first = null;
    this.last = null;
}

// Find a path to locate the node, the response consists of two
// components: 
// 
//     sentinel[0]: If sentinel[1] equals 0, it means no need to
//                  insert x. If not, it's the node to approache x at
//                  most.
// 
//     sentinel[1]: If greater than 0, it means x is located at right
//                  side of sentinel[0].  If less than 0, it located
//                  the left side.
// 
rb_tree.prototype.find_path_sentinel = function(x) {
    var n = this.root;
    if(n == null)
        return [null,null];     // genesis
    var res;
    // at least execute 1 time
    do {
        var cmp_res = n.compare(x);
        if((cmp_res > 0) && (n.left))
            n = n.left;
        if((cmp_res < 0) && (n.right))
            n = n.right;
        res = [n,cmp_res];
        if(cmp_res == 0)
            return res;
    } while(n.is_leaf() == false);
    return res;
}

// Rotate n's children counter clockwisely
rb_tree.prototype.rotate_left = function(n) {
    if(n.right == null)
        return;

    var p = n, q = n.right, parent = n.parent;

    if(parent) {
        if(parent.left == p)
            parent.left = q;
        else
            parent.right = q;
    } else
        this.root = q;

    q.parent = parent;
    p.parent = q;
    p.right = q.left;

    if(p.right)
        p.right.parent = p;

    q.left = p;
}

// Rotate n's children clockwisely
rb_tree.prototype.rotate_right = function(n) {
    if(n.left == null)
        return;

    var p = n, q = n.left, parent = n.parent;

    if(parent) {
        if(parent.left == p)
            parent.left = q;
        else
            parent.right = q;
    }

    q.parent = parent;
    p.parent = q;
    p.left = q.right;

    if(p.left)
        p.left.parent = p;

    q.right = p;
}

rb_tree.prototype.insert1 = function(n) {
    if(n.parent == null)
        n.color = COLOR.BLACK;
    else
        this.insert2(n);
}

rb_tree.prototype.insert2 = function(n) {
    if(n.parent.color == COLOR.BLACK)
        return;
    else
        this.insert3(n);
}

rb_tree.prototype.insert3 = function(n) {
    var u = n.get_uncle();

    if((u != null) && (u.color == COLOR.RED)) {
        n.parent.color = COLOR.BLACK;
        u.color = COLOR.BLACK;
        var g = n.get_grandparent();
        g.color = COLOR.RED;
        this.insert1(g);
    } else {
        this.insert4(n);
    }
}

rb_tree.prototype.insert4 = function(n) {
    var g = n.get_grandparent();

    if((n == n.parent.right) && (n.parent == g.left)) {
        n.parent.rotate_left();
        n = n.left;
    } else if ((n == n.parent.left) && (n.parent == g.right)) {
        n.parent.rotate_right();
        n = n.right;
    }
    this.insert5(n);
}

rb_tree.prototype.insert5 = function(n) {

    var g = n.get_grandparent();

    n.parent.color = COLOR.BLACK;
    g.color = COLOR.RED;
    if(n == n.parent.left)
        g.rotate_right();
    else
        g.rotate_left();

}




rb_tree.prototype.insert = function(newbie) {
    // Suppose newbie is red
    newbie.left = null;
    newbie.right = null;
    newbie.color = COLOR.RED;

    // Get sentinel and newbie's location
    var path_sentinel = this.find_path_sentinel(newbie);
    var sentinel = path_sentinel[0];
    var side = path_sentinel[1];

    // If genesis, set root
    if(sentinel == null){
        newbie.color = COLOR.BLACK;
        this.root = newbie;
        this.first = newbie;
        this.last = newbie;
        return;
    }

    // If newbie has existed in current tree, return it instead of
    // inserting to avoid duplicated items
    // 
    // If newbie is less than sentinel, and sentinel is the minimum of
    // the tree, set newbie as the minimum.  Do the same in maximum
    // case.
    // 
    if(side > 0) {
        if(sentinel == this.first)
            this.sentinel = newbie;
        sentinel.left = newbie;
    } else if(side < 0) {
        if(sentinel == this.last)
            this.last = newbie;
        sentinel.right = newbie;
    } else
        return sentinel;
    
    var parent = newbie.parent;
    while((parent) && (parent.color == COLOR.RED)) {
        var grandpa = newbie.get_grandparent();

        if(parent == grandpa.left){
            var uncle = grandpa.right;
            if(uncle && (uncle.color == COLOR.RED)){
                parent.color = COLOR.BLACK;
                uncle.color = COLOR.BLACK;
                grandpa.color = COLOR.RED;
            } else {
                var parent_right_origin = parent.right;
                this.rotate_left(parent);
                // TODO
            }
        }
    }
}

var a_node = new node();

console.log(a_node.is_red());
