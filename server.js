// --------------------- IMPORTS ----------------------------------
var express = require('express')
  , voronoi = require('./voronoi.js').Voronoi
  , routes = require('./routes');

var app = module.exports = express.createServer();

// ------------------------- CONFIGURATION ------------------------

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// ----------------------- ROUTER AND RENDER ----------------------
var render_context = {
    title: 'au9voronoi',
    topbar_items: {
        'Home': '/', 
        'About': '/about', 
        'Doc': '/doc', 
        'Contact': '/contact'},
    layout: false
};
app.get('/demo', function(req,res){
    res.render('demo', render_context);
});
app.get('/', function(req,res){
    res.render('index', render_context);
});
app.post('/calculate', function(req,res){
    var result = voronoi.main(req.body.sites);
    res.json(result);
});

// --------------------- API FOR CALCULATION ----------------------

// -------------------------- LAUNCH SERVER -----------------------
app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
