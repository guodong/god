/**
 * the loading order is described as follows:
 * 1. execute script in loading file
 * 2. execute callback such as onload callback and onreadystatechange callback
 * 
 * the register process is described as follows:
 * 1. create context
 */
(function(window) {
	function God() {
	}
	var contexts = {};
	var loadedModules = [];
	God.prototype = {
		appPath : '',
		config : function(obj) {
			this.appPath = obj.appPath;
		},
		define : function(module_name, depends, content) {//alert("define:"+module_name)
			if('[object Array]' !== Object.prototype.toString.call(depends)){
				content = depends;
				depends = [];
			}
			function checkReady(){//alert("checkReady && loaded:"+module_name);
				var isReady = true;
				for(var i in depends){
					if(!contexts[depends[i]].isReady){
						isReady = false;
						break;
					}
				}
				if(isReady) {//alert("isReady:"+module_name);
					var args = [];
					for(var i in depends){
						args.push(loadedModules[depends[i]]);
					}
					loadedModules[module_name] = content.apply(window, args);
					contexts[module_name].isReady = true;
					for(var i in contexts[module_name].needed){
						if(undefined !== loadedModules[i]) continue;
						contexts[module_name].needed[i]();
					}
					contexts[module_name].needed = [];
				}else{
					for(var i in depends){//alert("register callback:"+module_name+" to "+depends[i]);
						contexts[depends[i]].needed[module_name] = checkReady;
					}
				}
			}
			if(undefined === contexts[module_name]){
				contexts[module_name] = {isReady: false, callback: checkReady, needed: []};
			}
			
			if(0 === depends.length){
				checkReady();
			}
			for(var i in depends){
				if(undefined === contexts[depends[i]]){
					var url = god.appPath + depends[i] + '.js';
					loadScript(url, checkReady);
				}else{
					checkReady();
				}
				
			}
		},
		require: function(depends, callback){
			var d = new Date();
			var tmp_module_name = d.getMilliseconds() + Math.random();//alert('rq:'+tmp_module_name);
			return this.define(tmp_module_name, depends, callback);
		}
	};
	function loadScript(url, callback){//alert("create tag:"+url)
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
	window.god = new God;
})(window);