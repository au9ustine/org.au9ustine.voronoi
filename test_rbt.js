var rb_tree_module = require('./rbt');
var node = rb_tree_module.node;
var rb_tree = rb_tree_module.rb_tree;

// Main
var a_rb_tree = new rb_tree();

var a_node = new node();
a_node.data = 14;
a_rb_tree.insert(a_node);

var b_node = new node();
b_node.data = 10;
a_rb_tree.insert(b_node);

var c_node = new node();
c_node.data = 27;
a_rb_tree.insert(c_node);

var d_node = new node();
d_node.data = 16;
a_rb_tree.insert(d_node);

var e_node = new node();
e_node.data = 98;
a_rb_tree.insert(e_node);

console.log("insert");
console.log(a_rb_tree);

a_rb_tree.remove(a_node);
a_rb_tree.remove(e_node);

console.log("remove");
console.log(a_rb_tree);

