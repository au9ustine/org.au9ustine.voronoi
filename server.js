var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\nApp (au9voronoi) is running on Node.JS ' + process.version);
}).listen(16221);
