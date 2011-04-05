var markRender = "";
var markPlugin = "";
exports.start = function(globalSettings){
	var a = globalSettings.server_script.dir_render || ":";
	markRender = new RegExp("^[\\/]+\\"+a+"([a-zA-z0-9 _-]+)\\"+a,"i");
	var a = globalSettings.server_script.dir_plugin || ".";
	markPlugin = new RegExp("^[\\/]+\\"+a+"([a-zA-z0-9 _-]+)\\"+a,"i");
}
exports.handleRequest = function(t,req,globalSettings){
	if(t.cleanPathname.search(markRender) == 0){
		var dir = t.cleanPathname.match(markRender);
		if(dir){
			t.root = globalSettings.path.render;
			t.cleanPathname = t.cleanPathname.replace(dir[0], dir[1]);
		}
	};
	if(t.cleanPathname.search(markPlugin) == 0){
		var dir = t.cleanPathname.match(markPlugin);
		if(dir){
			t.root = globalSettings.path.plugin;
			t.cleanPathname = t.cleanPathname.replace(dir[0], dir[1]);
		}
	};
}*-+
