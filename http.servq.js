var fs = require('fs'),
    sys = require('sys'),
    url = require('url'),
    http = require('http'),
    path = require('path'),
    mime = require('mime');
var log = console.log;
onmessage = function(e){
	log("HTTP onMessage");
	e=e.data;
	log(e);
	if(e.from){
		postMessage("de HTTP bien recu");
	}else{
		postMessage("de HTTP recu");
	}
};
onerror = function(e){
	console.log("Je suis une err"+e)
}
setInterval(function(){
	postMessage({to:"com.oshimin.xmpp.serv","d":"je suis un test de HTTP"});
},20000);
log(require('e'));


var httpServer = http.createServer( function(request, response) {
	log("New request");
    var pathname = url.parse(request.url).pathname;
    if (pathname == "/") pathname = "index.html";
    var filename = path.join(__dirname, 'public', pathname);
	log(filename);
    path.exists(filename, function(exists) {
        if (!exists) {
        	log(filename+" n'existe pas!");
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found");
            response.end();
            return;
        }
		log(filename+" existe!");
        response.writeHead(200, {'Content-Type': mime.lookup(filename)});
        fs.createReadStream(filename, {
            'flags': 'r',
            'encoding': 'binary',
            'mode': 0666,
            'bufferSize': 4 * 1024
        }).addListener("data", function(chunk) {
        	log("File name : "+filename);
            response.write(chunk, 'binary');
        }).addListener("close",function() {
            response.end();
        });
    });
});

httpServer.listen(8001);
