
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, fs = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.directory(__dirname));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
app.get('/user/:id/:ha',function(req,res){
    res.send('user'+req.params.id+'ha_'+req.params.ha);
});
// app.get('/public/*',function(req,res){
//     // var dirname = 'E:/devel/au9voronoi/public';
//     // fs.readdir(dirname,function(err,files){
//     // 	files.forEach(function(file){
//     // 	    res.download(file);
//     // 	});
//     // });
//     res.send(req.body);
// });
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
