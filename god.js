/**
 * the loading order is described as follows:
 * 1. execute script in loading file
 * 2. execute callback such as onload callback and onreadystatechange callback
 * 
 * the register process is described as follows:
 * 1. create context
 */
(function(window) {
	function isArray(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	}
	function God() {
	}
	var contexts = {};
	var loadedModules = [];
	God.prototype = {
		appPath : '',
		config : function(obj) {
			this.appPath = obj.appPath;
		},
		require : function(depends, callback) {
			for(var i in depends){
				
			}
		},
		define : function(module_name, depends, content) {alert("define:"+module_name)
			if(!isArray(depends)){
				content = depends;
				depends = [];
			}
			function checkReady(){alert("checkReady && loaded:"+module_name);
				this.module = module_name;
				var isReady = true;
				for(var i in depends){
					if(!contexts[depends[i]].isReady){
						isReady = false;
						break;
					}
				}
				if(isReady) {alert("isReady:"+module_name);
					loadedModules[module_name] = content();
					contexts[module_name].isReady = true;
					for(var i in contexts[module_name].needed){
						if(undefined !== loadedModules[contexts[module_name].needed[i].module]) continue;
						contexts[module_name].needed[i]();
					}
				}else{
					for(var i in depends){alert("register callback:"+module_name+" to "+depends[i]);
						contexts[depends[i]].needed[module_name] = checkReady;
					}
				}
			}
			contexts[module_name] = {isReady: false, callback: checkReady, needed: []};
			if(0 === depends.length){
				checkReady();
			}
			for(var i in depends){
				var url = god.appPath + depends[i] + '.js';
				//rq(depends[i], checkReady);
				loadScript(url, checkReady);
			}
		},
		req: function(depends, callback){
			function checkReady(){
				var isReady = true;
				for(var i in depends){
					if(!contexts[depends[i]].isReady){
						isReady = false;
						break;
					}
				}
				if(isReady) {
					for(var i in contexts[depends[i]].callbacks){
						contexts[depends[i]].callbacks[i]();
					}
				}
			}
			for(var i in depends){
				contexts[depends[i]] = {isReady: false, callbacks: [checkReady]};
				var url = this.appPath + depends[i] + '.js';
				function completeLoad(){
					
				}
				loadScript(url, function(){})
			}
		}
	};
	function loadScript(url, callback){alert("create tag:"+url)
		var head = document.getElementsByTagName('head')[0];
		tag = document.createElement('script');
		tag.type = 'text/javascript';
		tag.charset = 'utf-8';
		tag.async = true;
		if(tag.attachEvent){
			tag.attachEvent('onreadystatechange', callback);
		}else{
			tag.addEventListener('load', callback, false);
		}
		tag.src = url;
		head.appendChild(tag);
	}
	function Controller() {
	}
	Controller.prototype = {
		view : '',
		deps : {},
		isLoaded : false,
		/*
		 * the load function is just return the registered module instance, the
		 * depende issue is already sattled down by extend function
		 */
		load : function(id) {
			return new god.loadedControllers[id];
		},
		setView : function(view) {
			this.view = view;
		}
	};
	Controller.prototype.define = function(controller_name, depends, obj) {
		var self = this;
		function Ctrl() {
			if (this.init)
				this.init();
		}
		Ctrl.prototype = new Controller;
		for ( var i in obj) {
			Ctrl.prototype[i] = obj[i];
		}
		god.define('controller/'+controller_name, depends, Ctrl);
		return Ctrl;
	};
	God.prototype.controller = new Controller;
	window.god = new God;
})(window);