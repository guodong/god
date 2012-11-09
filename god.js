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
				loadScript(url, checkReady);
			}
		},
		require: function(depends, callback){
			var d = new Date();
			var tmp_module_name = d.getMilliseconds() + Math.random();
			return this.define(tmp_module_name, depends, callback);
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
	window.god = new God;
})(window);