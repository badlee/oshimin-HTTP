var EventEmitter = require('events').EventEmitter,
http = require('http'),
fs = require('fs'),
mime = require('./content-type'),
pathlib = require('path'),
uri = require('url'),
log = require('./log'),
sys = require('sys'),
Script = process.binding('evals').Script,
utils = require('./utils'),
sessionManager = require('./session'),
incomingForm = require('./incoming_form').incomingForm,
multi = require('./multinode/multi-node'),
asemaphore = require('./asemaphore'),
applicationManager = require('./application');

var cachedJssp = {
	dir : null,
	lastMod : {},
	get : function(path,lastmod){
		if(!this.dir)return undefined;
		return pathlib.existsSync(pathlib.join(this.dir,this.getFileName(path))) && typeof this.lastMod[path] ==lastmod;
	},
	getFileName : function(path){
		if(!this.dir)return undefined;
		return path.replace(/\//ig,"");
	},
	getFile : function(path,lastmod,save){
		if(!this.dir)return undefined;
		if(save)this.lastMod[path] = lastmod;
		return pathlib.join(this.dir,this.getFileName(path,lastmod));
	},
	init : function(name,dir_cache){
		dir_cache = pathlib.join(dir_cache,name);
		if(!pathlib.existsSync(dir_cache)){
			fs.mkdirSync(dir_cache, 0777);
			//  U  |  G  |  O 
			//4 2 1|4 2 1|4 2 1
			//r w x|r w x|r w x
		};
		this.dir = dir_cache;
	}
};
var moduleName = "Engine";
var pageObjCache = {};
pageObjCache.get = function(key){
	var val = pageObjCache[key];
	return val;
};
pageObjCache.set = function(key,val){
	pageObjCache[key] = val;
};
var globalContext = {
	sys : sys,
	log:log,
	require : function(file){
		try{
			return require(globalSettings.path.lib+"/"+file+".js");
		}catch(e){
			log.debug(moduleName,"Error load - "+globalSettings.path.lib+"/"+file+".js" );
			return null;
		}
	}
};

var plugin = new EventEmitter();
var globalSettings;
var applicationScope;
var sessionScope;

exports.start = function(settings) {
	globalSettings = defaultSettings(settings);
	globalContext.postMessage = globalSettings.postMessage;
	var logObj = globalSettings.logs; 
	for (property in logObj)
		if(typeof logObj[property] != 'function')
			log.setLevel(property,logObj[property]); 
	cachedJssp.init(globalSettings.web_app_name,globalSettings.path.cache);
	log.info(moduleName,"Starting Web App - " +globalSettings.web_app_name);	
	//setting up sessionScope and applicationScope:
	applicationScope = applicationManager.start(globalSettings.web_app_name,globalSettings.server_script.memcached);
	sessionScope = sessionManager.start(globalSettings.server_script.session_minutes,globalSettings.web_app_name);
	var server = http.createServer(function (req, res) {
		log.debug(moduleName,"request arrived!");
		plugin.emit("request",req,globalSettings);
		var url = uri.parse(req.url,true);
		var pathname = (url.pathname || '/');
		var cleanPathname = pathname
		.replace(/\.\.\//g,'') //disallow parent directory access
		.replace(/\%20/g,' '); //convert spaces
		if(req.method == "GET"){
			var params = url.query;
			if(params == undefined)
				params = {};
			req.parameters = params;
			handleRequest(req,res,cleanPathname);			
		}else if (req.method == "POST"){
			incomingForm.parse(req, function(err, fields, files) {
				//log.debug(moduleName,"POST fields:" + utils.arrayToString(fields));
				params = {};
				req.parameters = fields;
				handleRequest(req,res,cleanPathname);
			});
		}
		else //Other Methods
			handleRequest(req,res,cleanPathname);
	});
	
		//chargement des plugins
	if(globalSettings.path.plugin != undefined){
		fs.stat(globalSettings.path.plugin, function (err, stats) {
			if (err) 
				log.error(moduleName,"Loading plugin error:"+err);
			else if(!stats.isDirectory()) 
				log.error(moduleName,"Loading plugin error: path must be a directory");
			else{
				var files = fs.readdirSync(globalSettings.path.plugin);
				for(i=0;i<files.length;i++){
					var file = files[i];
					log.info(moduleName,"I Found plugin:"+file);
					if(files[i].endsWith(".js")){
						log.info(moduleName,file+" Is a plugin file!");
						var path = pathlib.join(globalSettings.path.plugin,file.substring(0,files[i].length-3));
						var fileNoJs =  require(path);
						log.debug(moduleName,sys.inspect(fileNoJs));
						if(typeof fileNoJs === "object"){
							for(var ii in fileNoJs){
								if(typeof fileNoJs[ii] === 'function' && ii!= "apply"){
									plugin.on(ii,fileNoJs[ii]);
									log.info(moduleName,"Add Event plugin ["+ii+"]:" + path);
								}
							}
						}
					}else{
						log.info(moduleName,file+" Isn't a plugin file!");
					}
				}	
			}
			/*multi.listen({
				port: globalSettings.port, 
				nodes: globalSettings.nodes
			}, server);*/
			server.listen(globalSettings.port);
			plugin.emit("start",globalSettings);
			log.warn(moduleName,'Server running at port '+globalSettings.port);
		});
	}
	//fin chargement
};

function handleRequest(req,res,cleanPathname,newSessionId){
	var t = {cleanPathname:cleanPathname,root : globalSettings.path.root};
	plugin.emit("handleRequest",t,req,globalSettings);
	var root = t.root;
	
	var path = pathlib.join(t.root, t.cleanPathname);
	delete t;
	//fix index path
	var c = path.split("/");
	if(c[c.length-1] == ""){
		//define index.path
		globalSettings.indexFile = globalSettings.indexFile || ["index.html"];
		var s,j;
		for(var i=0;i<globalSettings.indexFile.length;i++){
			try{
				j=pathlib.join(path, globalSettings.indexFile[i]);
				s=fs.statSync(j);
				if(s.isFile()) path = j;
				break;
			}catch(e){
			};
		}
		//end define
	}
	if(newSessionId==undefined)
		log.info(moduleName,"Handling request to: " +path + " pid("+process.pid+")");
	else
		log.info(moduleName,"Forwarding request to: " +path + " pid("+process.pid+")");
	//log.debug(moduleName,"Request headers: "+utils.arrayToString(req.headers));
	fs.stat(path, function (err, stats) {
		if (err) {
			// ENOENT is normal on 'file not found'
			if (err.errno != process.ENOENT) { 
				// any other error is abnormal - log it
				plugin.emit("requestError",req,globalSettings);
				log.error("fs.stat(",path,") failed: ", err);
			}
			plugin.emit("requestNotFound",req,res,path,globalSettings);
			return fileNotFound(req,res,path);
		}
		if (!stats.isFile()){
			plugin.emit("requestNotFound",req,res,path,globalSettings);
			return fileNotFound(req,res,path);
		}else{
			var cookie = req.headers["cookie"];
			var sessionId = utils.getSessionId(cookie);
			if(newSessionId!=undefined)//forward
				sessionId = newSessionId;
			else{
				sessionScope.hello(sessionId);
			}
			var Extension = false;
			if((function(){
				for(var i in globalSettings.renderer){
					if(i == 'apply') continue;
					for(var j=0;j<globalSettings.renderer[i].ext.length;j++){
						if(path.endsWith("."+globalSettings.renderer[i].ext[j])){
							Extension = i;
							 return false;
						}
					}
				}
				return true;
			})()){
				log.info(moduleName,"Static request");
				sendHeaders(req, res,undefined, stats.size, mime.mimeType(path,globalSettings.server_script.default_type), stats.mtime); 
				var readStream = fs.createReadStream(path);
				sys.pump(readStream,res);
			}else{
				log.info(moduleName,"Dyanmic request");
				if(Extension !== false && !cachedJssp.get(path,stats.mtime)){
					var readStream = fs.createReadStream(path);
					var script = [];
					readStream.addListener("data", function (chunk) {	
						script.push(chunk.toString());
					});
					readStream.addListener("end", function () {
						log.info(moduleName,"STARTING PROCESSING DYNAMIC FILE WITH RENDER : "+Extension);
						//send to render
						try{
							var render = require(pathlib.join(globalSettings.path.render,Extension));
						}catch(e){
							return fileError500(req,res,path,"Load module file",e);
						}
						fs.writeFile(cachedJssp.getFile(path,stats.mtime,true), render(script.join(""),req,res,globalSettings.renderer[Extension]), function (err) {
							//log.debug(moduleName,"Error writin cache file: "+err); 
							log.info(moduleName,"Caching  - "+path + ",last mod - "+ stats.mtime.toUTCString());
							plugin.emit("render",cachedJssp.getFile(path,stats.mtime),globalSettings);
							serverSideRunning(cachedJssp.getFile(path,stats.mtime),req,res,path,stats.mtime,sessionId,true);
						});
						log.info(moduleName,"END OF DYNAMIC FILE PROCESSING");		
					});
					req.connection.addListener('timeout', function() {
						/* dont destroy it when the fd's already closed */
						if (readStream.readable) {
							log.debug(moduleName,'timed out. destroying file read stream');
							readStream.destroy();
						}
					});
					res.addListener('error', function (err) {
						log.error('error writing',file,sys.inspect(err));
						readStream.destroy();
					});
					readStream.addListener('fd', function(fd) {
						log.debug(moduleName,"opened",path,"on fd",fd);
					});

					readStream.addListener('error', function (err) {
						log.error('error reading',file,sys.inspect(err));
						resp.end('');
					});

				}else{
					log.info(moduleName,"RUN JSP FROM CACHE");
					var currentFileNameToRead = cachedJssp.getFile(path,stats.mtime);
					serverSideRunning(currentFileNameToRead,req,res,path,stats.mtime,sessionId,false);
				}

			}

		}		

	});
};

function serverSideRunning(newfileName,request,response,file,lastMod,sessionId,isForceEval){
	var responseHead= {};	
	var result = {};
	result.html = "";
	var flushResponse = true;
	var flushFunction = undefined;
	var error = false;
	responseHead.status = 200;
	responseHead.headers = {};
	var afterEval = [];
	//log.debug(moduleName,asemaphore);
	var currentAsemaphore = asemaphore.ctor(1,function(){
		if(!error)
			result.html = afterEval.join("");
		if(flushResponse){//otherwise, forwarding...
			sendHeaders(request,response,responseHead,result.html.length,mime.mimeType(file,"text/html"),lastMod,result.sessionId); 
			response.end(result.html);
		}
		else if(flushFunction)
			flashFunction();
	});

	var executeTheSSJFile = function (errRead, functoRun) {
		try{
			if (errRead) throw errRead;
			//Handling session and application with asemphore
			result.sessionId = sessionId;
			var application = applicationManager.getManager("",currentAsemaphore);
			var session = sessionManager.getManager(sessionId,currentAsemaphore,applicationManager,result);
			//============================================
			//Genrating Context
			var MaxtimeToExec = (globalSettings.server_script.max_wait != 0) ? setTimeout(function(){
					while(currentAsemaphore.p()>0);
			},globalSettings.server_script.max_wait*1000) : setTimeout(function(){
					while(currentAsemaphore.p()>0);
			},3*60*1000);
			var context = {
				postMessage : globalSettings.postMessage,
				request:request,
				responseHead:responseHead,
				application:application,
				session:session,
				//lib:lib,
				sys : sys,
				setTimeout : setTimeout,
				clearTimeout : clearTimeout,
				clearInterval:clearInterval,
				setInterval:setInterval,
				log:log,
				allIsDone : function(){
					try{clearTimeout(MaxtimeToExec);}catch(e){};
					while(currentAsemaphore.p()>0);
				},
				getGlobal : function(v){
					try{
						if(v=="require"||v=="log"||v=="sys"||v=="postMessage") return undefined;
						return globalContext[v];
					}catch(e){
						return undefined;
					}
				},
				write : function(text){
					//log.debug(moduleName,"WRITE afterEval : "+ afterEval);
					afterEval.push(text);
				},
				writeEscapedText :function(text){
					afterEval.push(unescape(text));
				},
				forward :function(resource){
					flushFunction = handleRequest(request,response,resource,result.sessionId);
					flushResponse = false;
				},
				sendRedirect:function(url){
					responseHead.status = 301;
					responseHead.headers["location"] = url;
				},
				require : function(file){
					try{
						return require(globalSettings.path.lib+"/"+file+".js");
					}catch(e){
						log.debug(moduleName,"Error load - "+globalSettings.path.lib+"/"+file+".js" );
						return undefined;
					}
				}
			};
			//=============================================
			//log.debug(moduleName,typeof functoRun.page);
			log.debug(moduleName,"READING pageObject from cache, key - "+file );
			var pageObjFromCache = pageObjCache.get(file);
			if(pageObjFromCache == undefined || isForceEval){//not in cache	
				//var pageObjFunc = new Function(functoRun.toString() + " ; return this;");
				pageObjFromCache = JSON.parse(functoRun);//new pageObjFunc(context);
				pageObjCache.set(file,pageObjFromCache);
			}else
				log.debug(moduleName,"....and....cache is FULL for key - "+file);
				Script.runInNewContext(pageObjFromCache[1],globalContext,file+" [GLOBAL]");
				Script.runInNewContext(pageObjFromCache[0],context,file);
		}
		catch(err){
			log.error("PARSE/EXECUTE : "+err+" stack:"+err.stack);
			return fileError500(request,response,file,"Could not parse/execute jsp file",err);
		}
	};
	
	if(cachedJssp.get(file,lastMod)!= undefined && !isForceEval){//funcCaching
		log.debug(moduleName,"SSJ RUN: bring file from CACHE:  "+file);
		executeTheSSJFile(undefined,undefined);
	}else{
		var fileNameToRead = newfileName;
		log.debug(moduleName,"SSJ RUN: reading file from FS:  "+fileNameToRead);
		fs.readFile(fileNameToRead,executeTheSSJFile);
	}
}

function sendHeaders(req, res,responseHead, length, content_type, modified_time,sessionId) {
	//log.debug(moduleName,"send headers: sessionId - "+sessionId);
	if(responseHead==undefined)
		responseHead = {};
	if(responseHead.status==undefined)
		responseHead.status = 200;
	if(responseHead.headers==undefined)	
		responseHead.headers = {};
	responseHead.headers["date"] = (new Date()).toUTCString();
	responseHead.headers["Server"] = globalSettings.web_app_name+" | (javascript server side) Node.js/"+process.version;
	if(sessionId != undefined)
		if(responseHead.headers["Set-cookie"] == undefined)//TODO add expiary and domain
			responseHead.headers["Set-cookie"] = "njssession="+sessionId;
		else
			responseHead.headers["Set-cookie"] += ";njssession="+sessionId;
	if (length) 
		responseHead.headers["Content-Length"] = length;
	if (content_type) 
		responseHead.headers["Content-Type"] = content_type || "application/octet-stream";
	if (modified_time) 
		responseHead.headers["Last-Modified"] = modified_time.toUTCString(); 
	//log.debug(moduleName,"RESPONSE Headers :"+utils.arrayToString(responseHead.headers)+" +++  RESPONSE Status :"+responseHead.status);
	plugin.emit("sendHeader",responseHead,globalSettings);
	res.writeHead(responseHead.status, responseHead.headers);
	log.info(moduleName,req.connection.remoteAddress,req.method,responseHead.status,length);
}

function fileError500(req,res,path,m,err) {
	log.debug(moduleName,"500 Error path: '"+path+"'");
	var msg = "";
	var body = 
	["<html>",
		"<head>",
			"<title>SERVER ERROR 500</title>",
		"</head>",
		"<body>",
			"<table align='center' border=0 style='margin-top:20px;'><tr><td>",
				"<h1>",globalSettings.web_app_name," - SERVER ERROR 500</h1>",
				"<p><hr>",
					m,
					((log.getLevel(moduleName)==0 && err) ? "<br><b><pre>"+err.stack+"</pre></b>":""),
				"<hr></p>",
			"</td></tr>",
			"<tr><td align='right'>",
				"<b>&copy; Oshimin Labs 2011 - <i>Power by Badinga Badinga Ulrich Arthur</i></b>",
			"</td></tr>",
			"</table>",
		"</body>",
	"</html>"].join("");
	var responseHead= {};
	responseHead.status = 500;
	sendHeaders(req, res,responseHead,body.length,"text/html");
	if (req.method != 'HEAD') 
		res.end(body, 'utf-8');
	else 
		res.end('');
}
function fileNotFound(req,res,path) {
	log.debug(moduleName,"404 opening path: '"+path+"'");
	var responseHead= {};
	responseHead.status = 404;
	var body = ["<html>",
		"<head>",
			"<title>",
				"SERVER ERROR "+responseHead.status,
			"</title>",
		"</head>",
		"<body>",
			"<table align='center' border=0 style='margin-top:20px;'><tr><td>",
				"<h1>",
					globalSettings.web_app_name," - SERVER ERROR "+responseHead.status,
				"</h1>",
				"<p><hr>File not found : ",
					req.url,
				"<hr></p>",
			"</td></tr>",
			"<tr><td align='right'>",
				"<b>&copy; Oshimin Labs 2011 - <i>Power by Badinga Badinga Ulrich Arthur</i></b>",
			"</td></tr>",
			"</table>",
		"</body>",
	"</html>"].join("");//["<h1>",globalSettings.web_app_name," - SERVER ERROR 404</h1>.",req.url, " not found"].join("");
	sendHeaders(req, res,responseHead,body.length,"text/html");
	if (req.method != 'HEAD') 
		res.end(body, 'utf-8');
	else 
		res.end('');
}

function appProtocol(a,dir){
	if(a.search("app://") === 0)
		a = a.replace("app:/",dir);
	return a;
}

function defaultSettings(settings){
	if(settings.web_app_name == undefined)
		settings.web_app_name = "Oshimin HTTP";
	if(settings.port == undefined)
		settings.port = 80;
	
	//define path
	if(settings.path == undefined)
		settings.path = {};
	
	var p = {"root":"app://public","lib":"app://libraries","plugin":"app://plugins","render":"app://renders","cache":"/tmp"};
	for(var i in p){
		if(typeof p[i] === "string"){
			if(settings.path[i] === undefined)
				settings.path[i] = p[i];
			settings.path[i] = appProtocol(settings.path[i],settings.__dir);
		}
	}
	
	//end define
		
	if(settings.server_script == undefined)
		settings.server_script = {};
	
		
	//define renderer
	if(settings.renderer === undefined)
		settings.renderer = {};
	
	for(var i in settings.renderer){
		if(i == 'apply') continue;
		settings.renderer[i] = settings.renderer[i] instanceof String ?  {ext:[settings.renderer[i]]} : settings.renderer[i];
		settings.renderer[i].ext = (typeof settings.renderer[i].ext.push !== undefined ) ?  settings.renderer[i].ext : [settings.renderer[i].ext];
		if(settings.renderer[i].mime){
			mime.setMime("."+i,settings.renderer[i].mime);
		}
	}
	
	//end define

	//session
	if(settings.server_script.session_minutes == undefined)
		settings.server_script.session_minutes = 30;
	settings.server_script.session_minutes = settings.server_script.session_minutes>0 ? settings.server_script.session_minutes : 30;
	
	//max exec time
	if(settings.server_script.max_wait == undefined)
		settings.server_script.max_wait = 0;
	settings.server_script.max_wait = settings.server_script.max_wait > 0 ? settings.server_script.max_wait : 0;
	settings.server_script.max_wait = settings.server_script.max_wait < 3*60 ? settings.server_script.max_wait : 3*60;
	
	//memcached
	if(settings.server_script.memcached == undefined)
		settings.server_script.memcached = {};
	if(settings.server_script.memcached.enable == undefined)
		settings.server_script.memcached.enable = 0;
	if(settings.server_script.memcached.server == undefined)
		settings.server_script.memcached.server = "localhost";
	if(settings.server_script.memcached.port == undefined)
		settings.server_script.memcached.port = 11211;

	if(settings.logs == undefined)
		settings.logs = {};
	
	cpus = require('os').cpus().length;
	if(settings.nodes == undefined)
		settings.nodes = cpus;
	
	settings.nodes = (settings.nodes<0 || settings.nodes>cpus )? cpus : settings.nodes;
	return settings;
}
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ');
  console.log(err.stack);
  globalContext.alfred.close(new Function());
});
process.on('SIGINT', function () {
  console.log('Got SIGINT.  Press Control-D to exit.');
  process.exit();
});

