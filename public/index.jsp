<script server>
	write("Cool <br>");
</script>
<hr/>
<h1>
	Tout est cool non juste pour moi :-D
</h1>
<script server>[global]
	
	test = function(write,str){
		write("hello ajax world<br/>");
		write("<pre>"+str+"</pre>");
	};
	this._page = this.page;
	this.page = function(c){
		test(c,this._page.toString());
		this._page(c);
	};
	
</script>
<script server>
		allIsDone();
</script>
