module.exports = function (str,request,response,globalSettings){
	var parsedTextArray = [];
	var externalParsedTextArray = [];
	var startTag = globalSettings.begin || "<?jsp";
	var startWriteAddition = globalSettings.write || "=";
	var startGlobalAddition = globalSettings.global || "!";
	var endTag = globalSettings.end || "?>";
	var lineArray = str.split(new RegExp( "\\n", "g" ));
	var isInScript = false;
	var currentScript =[];
	var nextLine = "\n";
	for(index=0;index<lineArray.length;index++){
		line = lineArray[index];			
		while(line.length>0){
			if(!isInScript){
				var startTagIndex = line.indexOf(startTag);
				if(line.indexOf(startTag)==-1){
					parsedTextArray.push('writeEscapedText("'+escape(line+nextLine)+'");'+nextLine);
					line="";
				}
				else{
					lineBeforeStart = line.substring(0,startTagIndex);
					parsedTextArray.push('writeEscapedText("'+escape(lineBeforeStart)+'");');
					line = line.substring(startTagIndex+startTag.length);
					if(line.length==0)
						parsedTextArray.push(nextLine);
					isInScript = true;
				}
			}
			else{//Inscript
				var endTagIndex =line.indexOf(endTag);
				if(line.indexOf(endTag)==-1){
					currentScript.push(line+nextLine);
					line="";
				}
				else{
					lineBeforeEnd = line.substring(0,endTagIndex);
					currentScript.push(lineBeforeEnd);
					var theScript = currentScript.join("");
					if(theScript.startsWith(startWriteAddition)){ //handling <?=...?> cases
						theScript = "write("+theScript.substring(startWriteAddition.length)+");";
						parsedTextArray.push(theScript);
					}else if(theScript.startsWith(startGlobalAddition)){ //handling <?!...?> cases
						theScript = theScript.substring(startGlobalAddition.length);
						externalParsedTextArray.push(theScript);
					}else{
						parsedTextArray.push(theScript);
					}
					currentScript = [];
					line = line.substring(endTagIndex+endTag.length);
					if(line.length==0)
						parsedTextArray.push(nextLine);
					isInScript = false;
				}
			}
		}
	}
	//test.jsp 
	//var toEval =
	//Waiting for a bug fix(V8)
	//http://groups.google.com/group/nodejs/browse_thread/thread/7a2e409ec970198e/d9336b7b2764f129?lnk=gst&q=require+exception#d9336b7b2764f129
	//var finalFunction = "exports.run = (function(lib,application,request,responseHead,writeEscapedText,forward,sendRedirect,write,session) {"
	//		+toEval+"})";
	return  JSON.stringify([/*"this.page = function (global){","with(global){",*/parsedTextArray.join("")/*,"}","};"*/,externalParsedTextArray.join("")]);
};
