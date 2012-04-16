
/*
 * GET home page.
 */

var context = require('./commons.js').context;

exports.index = function(req, res){
  // res.render('index', { title: 'au9voronoi',
  //                       topbar_items: ['Home', 'About', 'Doc', 'Contact'] });
  res.render('index', context);
};

exports.demo = function(req,res){
    res.send([3,4,5]);
};