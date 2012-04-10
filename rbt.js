// Red Black Tree Module
// 
// Copyright (c) 2012, Tianchen Shao.  All rights reserved.
// 
// The code is referenced by the red black tree part of libtree
// (https://github.com/fbuihuu/libtree.git)
// 

// Enumerated Colors
var COLOR = {
    BLACK: 0,                   // #000000
    RED: 16711680               // #ff0000
};

// Red-Black Tree Node Type
function node() {
    this.data = null;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.color = null;
}

// Predicative properties
node.prototype.is_root = function() {
    return this.parent == null;
}

node.prototype.is_black = function() {
    return this.color == COLOR.BLACK;
}

node.prototype.is_red = function() {
    return this.color == COLOR.RED;
}

node.prototype.is_leaf = function() {
    if(this.left)
        return false;
    if(this.right)
        return false;
    return true;
}

// Getter ans setter
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

// Compare this node with x
node.prototype.compare = function(x) {
    if(x.data < this.data)
        return 1;
    if(x.data > this.data)
        return -1;
    return 0;
}


// Red-Black Tree Type
function rb_tree() {
    this.root = null;
    this.first = null;
    this.last = null;
}

// Find a path to locate the node, the response consists of two
// components:
// 
//     [0]: If x exists, [0] will be returned as x
// 
//     [1]: sentinel.  If [2] equals 0, it means no need to insert
//          x. If not, it's the node to approache x at most.
// 
//     [2]: Compare result.  If greater than 0, it means x is located
//          at right side of [1].  If less than 0, it located the left
//          side.
// 
rb_tree.prototype.find_path_sentinel = function(x) {
    var n = this.root;
    var sentinel = null;
    var res;

    while(n) {
        res = n.compare(x);
        if(res == 0)
            return [n,sentinel,res]
        sentinel = n;
        if(res > 0)
            n = n.left;
        else
            n = n.right;
    }
    return [n,sentinel,res];
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
    } else
        this.root = q;

    q.parent = parent;
    p.parent = q;
    p.left = q.right;

    if(p.left)
        p.left.parent = p;

    q.right = p;
}

// Insert a node into red black tree
rb_tree.prototype.insert = function(newbie) {

    // Get sentinel and newbie's location
    var path_sentinel = this.find_path_sentinel(newbie);
    var sentinel = path_sentinel[1];
    var side = path_sentinel[2];

    // If newbie has existed in current tree, return it instead of
    // inserting to avoid duplicated items
    if(path_sentinel[0])
        return path_sentinel[0];

    // Suppose newbie is red
    newbie.left = null;
    newbie.right = null;
    newbie.color = COLOR.RED;
    newbie.parent = sentinel;

    if(sentinel){
        // If newbie is less than sentinel, and sentinel is the
        // minimum of the tree, set newbie as the minimum.  Do the
        // same in maximum case.
        if(side > 0) {
            if(sentinel == this.first)
                this.first = newbie;
            sentinel.left = newbie;
        } else if(side < 0) {
            if(sentinel == this.last)
                this.last = newbie;
            sentinel.right = newbie;
        }
    } else {
        // If genesis, set root
        this.root = newbie;
        this.first = newbie;
        this.last = newbie;
    }

    
    var parent = newbie.parent;
    while((parent) && (parent.color == COLOR.RED)) {
        var grandpa = parent.parent;

        if(parent == grandpa.left){
            // If uncle sits at right side of parent
            var uncle = grandpa.right;
            if((uncle) && (uncle.color == COLOR.RED)){
                parent.color = COLOR.BLACK;
                uncle.color = COLOR.BLACK;
                grandpa.color = COLOR.RED;
                newbie = grandpa;
            } else {
                if(newbie == parent.right) {
                    this.rotate_left(parent);
                    newbie = parent;
                    parent = newbie.parent;
                }
                parent.color = COLOR.BLACK;
                grandpa.color = COLOR.RED;
                this.rotate_right(grandpa);
            }
        } else {
            // If uncle sits at left side of parent
            var uncle = grandpa.left;
            if((uncle) && (uncle.color == COLOR.RED)) {
                parent.color = COLOR.BLACK;
                uncle.color = COLOR.BLACK;
                grandpa.color = COLOR.RED;
                newbie = grandpa;
            } else {
                if(newbie == parent.left) {
                    this.rotate_right(parent);
                    newbie = parent;
                    parent = newbie.parent;
                }
                parent.color = COLOR.BLACK;
                grandpa.color = COLOR.RED;
                this.rotate_left(grandpa);
            }
        }
    }

    // Root node should be always black
    this.root.color = COLOR.BLACK;
    return null;
}

// Remove a node from the red black tree
rb_tree.prototype.remove = function(n) {
    var parent = n.parent;
    var left = n.left;
    var right = n.right;
    var next,color;

    // If n is minimal and n is to be removed, the rightside node is
    // the new minimal.  So does it in maximum case.
    if(n == this.first)
        this.first = n.next();
    if(n == this.last)
        this.last = n.prev();

    if(left == null)
        next = right;
    else if(right == null)
        next = left;
    else
        next = right.get_first();

    if(parent) {
        if(parent.left == n)
            parent.left = next;
        else
            parent.right = next;
    } else {
        this.root = next;
    }

    if(left && right) {
        color = next.color;
        next.color = n.color;

        next.left = left;
        left.parent = next;

        if(next != right) {
            parent = next.parent;
            next.parent = node.parent;

            n = next.right;
            parent.left = n;

            next.right = right;
            right.parent = next;
        } else {
            next.parent = parent;
            parent = next;
            n = next.right;
        }
    } else {
        color = n.color;
        n = next;
    }

    if(n)
        n.parent = parent;

    if(color == COLOR.RED)
        return;
    if((n) && (n.color == COLOR.RED)) {
        n.color = COLOR.BLACK;
        return;
    }

    do {
        if(n == this.root)
            break;

        if(n == parent.left) {
            var sibling = parent.right;

            if(sibling.color == COLOR.RED) {
                sibling.color = COLOR.BLACK;
                parent.color = COLOR.RED;
                this.rotate_left(parent);
                sibling = parent.right;
            }

            if(((sibling.left == null) || 
                (sibling.left.color == COLOR.BLACK)) && 
               ((sibling.right == null) || 
                (sibling.right.color == COLOR.BLACK))) {
                sibling.color = COLOR.RED;
                n = parent;
                parent = parent.parent;
                continue;
            }

            if((sibling.right == null) || 
               (sibling.right.color == COLOR.BLACK)) {
                sibiling.left.color = COLOR.BLACK;
                sibling.color = COLOR.RED;
                this.rotate_right(sibling);
                sibling = parent.right;
            }

            sibling.color = parent.color;
            parent.color = COLOR.BLACK;
            sibling.right.color = COLOR.BLACK;
            this.rotate_left(parent);
            n = this.root;
            break;
        } else {
            var sibling = parent.left;

            if(sibling.color == COLOR.RED) {
                sibling.color = COLOR.BLACK;
                parent.color = COLOR.RED;
                this.rotate_right(parent);
                sibling = parent.left;
            }

            if(((sibling.left == null) || 
                (sibling.left.color == COLOR.BLACK)) && 
               ((sibling.right == null) || 
                (sibling.right.color == COLOR.BLACK))) {
                sibling.color = COLOR.RED;
                n = parent;
                parent = parent.parent;
                continue;
            }

            if((sibling.left == null) || 
               (sibling.left.color == COLOR.BLACK)) {
                sibiling.right.color = COLOR.BLACK;
                sibling.color = COLOR.RED;
                this.rotate_left(sibling);
                sibling = parent.left;
            }
            sibling.color = parent.color;
            parent.color = COLOR.BLACK;
            sibling.right.color = COLOR.BLACK;
            this.rotate_right(parent);
            n = this.root;
            break;
        }
    }while(n.color == COLOR.BLACK);

    if(n)
        n.color = COLOR.BLACK;
}

rb_tree.prototype.replace = function(veteran,newbie) {
    var parent = veteran.parent;

    if(parent) {
        if(parent.left == veteran)
            parent.left = newbie;
        else
            parent.right = newbie;
    }

    if(veteran.left)
        veteran.left.parent = newbie;
    if(veteran.right)
        veteran.right.parent = newbie;

    if(this.first == veteran)
        this.first = newbie;
    if(this.last == veteran)
        this.last = newbie;

    return [newbie,veteran];

}
exports.node = node;
exports.rb_tree = rb_tree;