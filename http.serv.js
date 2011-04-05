var fs = require('fs'),
engine = require(__dirname+'/lib/engine'),

sys = require('sys');

onmessage = function(e){
	console.log("HTTP onMessage");
	e=e.data;
	console.log(e);
	if(e.from){
		postMessage("de HTTP bien recu");
	}else{
		postMessage("de HTTP recu");
	}
};

onerror = function(e){
	console.log("Je suis une err : ");
	console.log(e);
}

if(typeof postMessage!="function") postMessage =  new Function;

setTimeout(function(){
	postMessage({to:"com.oshimin.xmpp.serv","d":"je suis un test de HTTP"});
},20000);

fs.readFile(__dirname+'/settings.json', function(err, data) {
    var settings = {};
    if (err) {
        sys.puts('No settings.json found ('+err+'). Using default settings');
    } else {
        try {
            settings = JSON.parse(data.toString('utf8',0,data.length));
        } catch (e) {
        	console.log("Je suis une err "+e);
            sys.puts('Error parsing settings.json: '+e);
            process.exit(1);
        }
    }
    settings.__dir = __dirname;
    settings.postMessage = function(obj){
		obj = obj || {};
		postMessage(obj);
	};
    engine.start(settings);
});
