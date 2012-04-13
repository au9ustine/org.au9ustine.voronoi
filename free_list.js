var geometry = require('./geometry.js').geometry;

// free node type
function free_node() {
    this.next = null;
}

// free list
function free_list() {
    this.head = null;           // linked list whose member is free_node
}

free_list.prototype.make_free = function(curr) {
    curr.next = this.head;
    this.head = curr;
};

free_list.prototype.get_free = function() {
    var orig_head = this.head;
    if(this.head == null) {
        orig_head = new free_node();
        this.head = orig_head;
        for(var i = 1; i < geometry.sqrt_nsites; i++){
            var newbie = new free_node();
            this.head.next = newbie;
            this.head = this.head.next;
        }
    }
    this.head.next = orig_head;
    this.head = this.head.next;
    return this.head;
};

exports.free_node = free_node;
exports.free_list = free_list;