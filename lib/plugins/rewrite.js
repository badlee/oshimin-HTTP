/*
	PLUGINS : EVENTS
		start : launch when server started, args : globalSettings
		request : new request , args : req,globalSettings
		handleRequest : request parsed, before launch renderer , args : {cleanPathname,root },req,globalSettings
		render : after renderer , args : data,globalSettings
		requestError : reuest Error , args : res,globalSettings
		requestNotFound : file not found , args : req,res,path,globalSettings
		sendHeader : envoi des data , args : responseHead,globalSettings
		
*/
exports.request = function(req,globalSettings){
	if(req.url == "/alfred/test"){
		req.url = "/alfred/test.jsp";
	};
	
}


