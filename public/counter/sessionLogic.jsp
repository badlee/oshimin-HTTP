<script server> << "je suis cool<hr/>"</script>
<script server>
	var counter = 1;
	context.session.get("counts",function(value){
		value = value||0;
		context.session.set("counts",++value);
		context.log.debug("Page","SESSIONLOGIC.JSP + , value - " +value);
		context.request.parameters.counter = value;
		context.forward("counter/view.jsp");
	});
</script>
