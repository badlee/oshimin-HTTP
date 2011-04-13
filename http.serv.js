var fs = require('fs'),
engine = require(__dirname+'/lib/engine'),
sys = require('sys'),
log = require('log');
    
log.setLevel("HTTP","DEBUG");

onmessage = function(e){
	log.info("HTTP","onMessage");
	e=e.data;
	log.info(sys.inspect(e));
	if(e.from){
		postMessage({to:e.from,message:e.from+" bien recu!"});
	}else{
		postMessage("de ? recu");
	}
};

onerror = function(e){
	log.err("HTTP","Je suis une err");
	log.err(sys.inspect(e));
}

if(typeof postMessage!="function") postMessage =  new Function;

setTimeout(function(){
	postMessage({to:"com.oshimin.xmpp.serv","d":"je suis un test de HTTP"});
},20000);

fs.readFile(__dirname+'/settings.json', function(err, data) {
    var settings = {};
    if (err) {
    	log.err("HTTP",'No settings.json found. Using default settings');
		log.err("HTTP",sys.inspect(err));
    } else {
        try {
            settings = JSON.parse(data.toString('utf8',0,data.length));
        } catch (e) {
        	log.err("HTTP","Je suis une err "+e);
            log.err("HTTP",'Error parsing settings.json: '+sys.inspect(e));
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
