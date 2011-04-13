var fs = require("fs"),
querystring = require("querystring"),
markRender = "",
markPlugin = "";
exports.start = function(globalSettings){
	var a = globalSettings.server_script.dir_render || ":";
	markRender = new RegExp("^[\\/]+\\"+a+"([a-zA-z0-9 _-]+)\\"+a,"i");
	var a = globalSettings.server_script.dir_plugin || ".";
	markPlugin = new RegExp("^[\\/]+\\"+a+"([a-zA-z0-9 _-]+)\\"+a,"i");
}
exports.handleRequest = function(t,req,globalSettings){
	req.direct = [];
	if(t.cleanPathname.search(markRender) == 0){
		var dir = t.cleanPathname.match(markRender);
		if(dir){
			t.root = globalSettings.path.render;
			t.cleanPathname = t.cleanPathname.replace(dir[0], dir[1]);
		}
	}else if(t.cleanPathname.search(markPlugin) == 0){
		var dir = t.cleanPathname.match(markPlugin);
		if(dir){
			t.root = globalSettings.path.plugin;
			t.cleanPathname = t.cleanPathname.replace(dir[0], dir[1]);
		}
	};
	var f = t.cleanPathname.split('/'),j="",e,g=[],tmp;
	for(var i=0;i<f.length;i++){
		try{
			j += "/" + f[0];
			f.shift();
			if(fs.statSync(t.root+"/"+j).isFile()){
				for(var i=0;i<f.length;i++){
					try{
						if(f[i] == '')continue;
						g.push(querystring.unescape(f[i]));
						g[g.length-1]=JSON.parse(g[g.length-1]);
					}catch(e){}
				}
				req.direct = g;
				t.cleanPathname = j;
				break;
			}
		}catch(e){
			break;
		}
	}
}
