var free_list = require('./free_list.js').free_list;

function bounding_box() {
}

bounding_box.x_min = 0;
bounding_box.x_max = 0;
bounding_box.y_min = 0;
bounding_box.y_max = 0;
bounding_box.nsites = 0;

bounding_box.site_free_list = new free_list();
exports.bounding_box = bounding_box;