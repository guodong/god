/**
 * @author guodong
 * @email gd@tongjo.com
 */
define(['jquery', 'god/form/Element'], function($, Element){
	var Form = function(formId){
		var self = this,
		form = $("#"+formId),
		elements = [],	//all the fields in form
		invalidElements = [],
		isAjax = form.attr("isAjax")==="true" || false,
		url = form.attr("action"),
		method = form.attr("method"),
		submitCallback = function(){},
		submitLoading = function(){},
		invalidCallback = function(){},
		onSubmit = function(){return true;};
		
		form.find("[type=submit]").click(function(e){
			e.preventDefault();
			if(onSubmit()) submit(submitCallback);
		});
		function submit(callback){
			if(!onSubmit()) return;
			if(!isValid()){
				invalidCallback();
				return false;
			}
			invalidCallback();
			if(isAjax){
				//submitLoading();	//start loading function
				$.ajax({
					url: url,
					type: method,
					data: serializeObject()
				}).done(function(d){
					if(callback){
						callback(d);
					}else{
						submitCallback(d);
					}					
				});
			}else{
				form.submit();	//submit and refresh page
			}
		}
		function serializeObject(){
			var o = {};
			var a = form.serializeArray();
			$.each(a, function() {
				if (o[this.name] !== undefined) {
					if (!o[this.name].push) {
						o[this.name] = [o[this.name]];
					}
					o[this.name].push(this.value || '');
				} else {
					o[this.name] = this.value || '';
				}
			});
			return o;
		}
		function refreshValues(){
			elements = [];
			form.find("[name]").each(function(){
				var element = new Element($(this).val(), $(this).attr("regex"), $(this).attr("name"));
				elements.push(element);
			});
		};
		function isValid(){
			refreshValues();
			invalidElements = [];
			var valid = true;
			for(var i in elements){
				if(!elements[i].isValid()){ //alert(elements[i].getName());
					valid = false;
					invalidElements.push(elements[i]);
				}
			}
			if(!valid) invalidCallback();
			return valid;
		}
		
		this.isValid = function(){
			return isValid();
		};
		this.onSubmit = function(callback){
			onSubmit = callback;
		};
		this.submitCallback = function(callback){
			submitCallback = callback;
			return self;
		};
		this.submitLoading = function(callback){
			submitLoading = callback;
			return self;
		};
		this.invalidCallback = function(callback){
			invalidCallback = callback;
			return self;
		};
		this.getInvalidElements = function(){
			return invalidElements;
		};
		this.isValid = function(){
			return isValid();
		};
		this.getElements = function(){
			return elements;
		};
		this.getInvalidElements = function(){
			return invalidElements;
		};
		this.submit = function(callback){
			submit(callback);
		};
		this.getValues = function(){
			return serializeObject();
		};

	};
	return Form;
});