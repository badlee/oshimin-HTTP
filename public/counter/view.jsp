<HTML>
	<HEAD><TITLE>Application Scope Counter Tester</TITLE></HEAD>
	<BODY>
	<script server>
		//db = chaos("test");
		//write(sys.inspect());
		var counter = request.parameters.counter;
		if(counter==1){
			write("First time");
		}else{
			write("Number of users:" + counter);
		}
		postMessage({
			key:"love is my religion",
			counter:counter,
			to : "com.oshimin.smpp.serv"
		});
	</script>
	</BODY>
</HTML>
<script server>
	//send All data in browser
	getGlobal("test")(write,"Je suis index");
	allIsDone();
</script>
