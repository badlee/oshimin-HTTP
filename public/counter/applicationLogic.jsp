<script server>
	//chaos = context.require("chaos");
	a = (typeof a!="undefined") ? a : 0;
	a++;
	var counter = 1;
	application.get("counter",function(value){
		if(value == undefined){
			application.set("counter",1);
		}else{
			counter = value+1;
			application.set("counter",counter);
		}
		request.parameters.counter = counter;
		postMessage({
			counter:counter,
			to : "com.oshimin.smpp.serv"
		});
		forward("counter/view.jsp");
		log.debug("Page",": ApplicationLOGIC.JSSP, value - " +value);	
	});					
</script>
