sys = require('sys');

exports.arrayToString = function(arr){
	var output = "";
	for(var property=0;property<arr.length;property++)
		output += property + ': ' + arr[property]+'; ';
	return output;

}

