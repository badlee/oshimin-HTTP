var path = require("path");
module.exports = function (str,request,response,settings){
	
	return JSON.stringify(["writeEscapedText(\""+escape([
	"<html>",
		"<head>",
			"<title>OSHIMIN : Extjs file</title>",
			'<link rel="stylesheet" type="text/css" href="/:extjs:/resources/css/all.css"/>',
			'<script type="text/javascript" src="/:extjs:/base.js"></script>',
			'<script type="text/javascript" src="/:extjs:/all.js"></script>',
			'<script type="text/javascript" src="/:extjs:/lib.js"></script>',,
		"</head>",
		"<script type='text/javascript'>",
			"BLANK_IMAGE_URL : Ext.isIE6 || Ext.isIE7  ? '/:extjs:/resources/images/default/s.gif' : 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';",
		"</script>",
		"<script type='text/javascript'>",
			";\n",
			str,
			"\n;",
		"</script>",
		"<body>",
		"</body>",
	"</html>"].join(""))+"\");allIsDone();",""]);
}
