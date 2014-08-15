// --------------------- IMPORTS ----------------------------------
var express = require('express')
  , voronoi = require('./voronoi.js').Voronoi
  , http = require('http')
  , routes = require('./routes');

var app = express();

// ------------------------- CONFIGURATION ------------------------
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

if ('development' === app.get('env')) {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

// ----------------------- ROUTER AND RENDER ----------------------
var render_context = {
    title: 'au9voronoi',
    topbar_items: {
        'Home': '/', 
        'About': '/about', 
        'Demo': '/demo'},
    layout: false
};
app.get('/demo', function(req,res){
    res.render('demo', render_context);
});
app.get('/about', function(req,res){
    res.render('about', render_context);
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
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
