var path = require("path"),
	packer = require("packer").pack,
	log = require("log");
module.exports = function (str,request,response,settings){
	if(request.fileInfo.cleanPathname.endsWith(".dr")){
		a = JSON.stringify(['dr = {'+str+'};'+
		'if(typeof dr.'+request.direct[0]+' == "function"){'+
			'__ret_function_call = dr.'+request.direct[0]+'.apply(dr,'+JSON.stringify(request.direct.filter(function(a,b){return (b!=0)}))+');'+
			'if(__ret_function_call != "WAIT"){'+
				'writeEscapedText(JSON.stringify(__ret_function_call));'+
				'allIsDone();'+
			'}'+
		'}else{'+
			(request.direct.length == 2 ? 
				'dr.'+request.direct[0]+' = '+JSON.stringify(request.direct[1])
				:
				""
			)+";"+
			'writeEscapedText(JSON.stringify(dr.'+request.direct[0]+'));'+
			'allIsDone();'+
		'}',""]);
		return a;
	}
	return JSON.stringify(["writeEscapedText(\""+escape([
	"<html>",
		"<head>",
			"<title>OSHIMIN : Extjs file</title>",
			'<link rel="stylesheet" type="text/css" href="/:ext:js/resources/css/all.css"/>',
			'<script type="text/javascript" src="/:ext:js/base.js"></script>',
			'<script type="text/javascript" src="/:ext:js/all.js"></script>',
			'<script type="text/javascript" src="/:ext:js/lib.js"></script>',,
		"</head>",
		"<script type='text/javascript'>",
			"BLANK_IMAGE_URL : Ext.isIE6 || Ext.isIE7  ? '/:ext:js/resources/images/default/s.gif' : 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';",
		"</script>",
		"<script type='text/javascript'>",
			";\n",
			packer(str,1),
			"\n;",
		"</script>",
		"<body>",
		"</body>",
	"</html>"].join(""))+"\");allIsDone();",""]);
}
