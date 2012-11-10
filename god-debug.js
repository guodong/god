/**
 * the loading order is described as follows: 1. execute script in loading file
 * 2. execute callback such as onload callback and onreadystatechange callback
 * 
 * the register process is described as follows: 1. create context
 */
(function(window) {
	function God() {
	}
	var Module = function(id, callback) {
		return this.load(id, callback);
	};
	Module.prototype = {
		load: function(id, callback) {

		}
	};
	/*
	 * module_id: {isReady: bool, readyCallbacks: [], depsReadyCallback, {},
	 * content: module_content}
	 */
	var contexts = {};
	var loadedModules = [];
	var isReady = function(module, deps) {
		var ready = true;
		for ( var i in deps) {
			if (undefined === loadedModules[deps[i]]) {
				ready = false;
				break;
			}
		}
		return ready;
	}
	var inArray = function(item, array){
		var isIn = false;
		for(var i in array){
			if(array[i] == item){
				isIn = true;
				break;
			}
		}
		return isIn;
	};
	God.prototype = {
		appPath: '',
		modules: [],
		config: function(obj) {
			this.appPath = obj.appPath;
		},
		define: function(module_name, deps, content) {
			alert("define:" + module_name)
			var checkReady = function(){
				
			}
			/*
			 * the callback that check whether all dependences are ready, if
			 * ready, execute the content and register to god.module
			 */
			var callback = function() {alert("callback:"+module_name+" deps:"+deps.join(' '));
				//var content = content;
				var isReady = true, self = this;
				for ( var i in deps) {
					if(undefined === god.modules[deps[i]]){alert("undef:"+deps[i])
						isReady = false;
						break;
					}
					// if there is dependence not ready, register this callback
					// to it, it will be executed once the dependence is ready
					if (!god.modules[deps[i]].isReady) {alert("register "+ module_name + ' to ' +deps[i]);
						if(!inArray(self, god.modules[deps[i].completeCallbacks])){
							god.modules[deps[i]].completeCallbacks.push(callback);
						}						
						isReady = false;
						break;
					}
				}alert('ready?:'+module_name+' '+isReady);
				if (isReady) {
					god.modules[module_name].isReady = true;
					god.modules[module_name].content = content();
					for(var i in god.modules[module_name].completeCallbacks){
						var t = god.modules[module_name].completeCallbacks[i];
						t();
					}
				}
			};
			// register module to god.modules
			if (undefined === god.modules[module_name]) {
				god.modules[module_name] = {
					isReady: false,
					completeCallbacks: [],	// execute once all dependences are complete and content has been registered to god.modules
					content: null
				};
			}
			
			for(var i=0 in deps){//alert(god.modules[deps[i]])
				if(undefined === god.modules[deps[i]]){
					var url = god.appPath + deps[i] + '.js';
					loadScript(url, callback);
				}else{
					god.modules[deps[i]].completeCallbacks.push(callback);
				}
			}
			// if the module has no dependence, just call the callback and it will register the content to god.modules
			if(0 === deps.length){
				callback();
			}
		},
		require: function(depends, callback) {
			var d = new Date();
			var tmp_module_name = Math.random() * 100000000000000000;// alert('rq:'+tmp_module_name);
			return this.define(tmp_module_name, depends, callback);
		}
	};
	function loadScript(url, callback) {// alert("create tag:"+url)
		var head = document.getElementsByTagName('head')[0];
		tag = document.createElement('script');
		tag.type = 'text/javascript';
		tag.charset = 'utf-8';
		tag.async = true;
		if (tag.attachEvent) {
			tag.attachEvent('onreadystatechange', callback);
		} else {
			tag.addEventListener('load', callback, false);
		}
		tag.src = url;
		head.appendChild(tag);
	}

	function Controller() {
	}
	Controller.prototype = {
		view: '',
		deps: {
			models: [],
			views: []
		},
		isLoaded: false,
		/*
		 * the load function is just return the registered module instance, the
		 * depende issue is already sattled down by extend function
		 */
		load: function(id) {
			return new god.loadedControllers[id];
		},
		setView: function(view) {
			this.view = view;
		}
	};
	Controller.prototype.define = function(controller_name, depends, content) {
		return god.define(controller_name, depends, content);
	};

	function Model() {
	}
	Model.prototype = {
		baseUrl: "", // the url to fetch model data, used by fetch, save,
		// delete...
		defaults: {},
		load: function(model_name) {
			return new god.loadedModules.models[model_name];
		},
		/**
		 * fetch data from remote server, server response should be like:
		 * {"name": "guodong", "age": 18, "isVip": true}
		 * 
		 * @param param
		 *            the param transfred to server using Get Method
		 */
		fetch: function(param) {
			var self = this, argstr = '?', t = [];
			for ( var i in param) {
				t[t.length] = i + '=' + param[i];
			}
			argstr += t.join('&');
			var data = Helper.ajax({
				url: this.baseUrl + argstr,
				async: false
			}, function(data) {
				var d = JSON.parse(data);
				for ( var i in d) {
					self.defaults[i] = d[i];
				}
			});
		}
	};
	Model.prototype.define = function(model_name, depends, content) {
		return god.define(model_name, depends, content);
	};

	function View() {
	}
	View.prototype = {
		template: '',
		vars: [],
		templatePath: '',
		load: function(id) {
			this.id = id;
			return new god.loadedModules.views[id];
		},
		set: function(key, value) {
			this.vars[key] = value;
		},
		/**
		 * render the view page and replace the <%=..%> with vars
		 * 
		 * @param dom
		 *            the id of dom
		 */
		render: function(dom) {
			if (this.templatePath === '')
				this.templatePath = this.id;
			var url = god.appPath + 'view/template/' + this.templatePath
					+ ".js";
			this.template = Helper.load(url);
			var self = this, viewVarsRegExp = /<%=\s*(.*)\s*%>/g;
			this.template.replace(viewVarsRegExp, function(match, data) {
				var str = "self.vars." + data;
				var value = eval(str);
				self.template = self.template.replace(match, value);
			});
			document.getElementById(dom).innerHTML = self.template;
			if (this.initRander)
				this.initRander();
		}
	};
	View.prototype.define = function(view_name, depends, content) {
		return god.define(view_name, depends, content);
	};
	God.prototype.controller = new Controller;
	God.prototype.model = new Model;
	God.prototype.view = new View;

	var Helper = {
		/*
		 * just load content without executing it in sync way. Used for View
		 * templates
		 */
		load: function(path) {
			return this.ajax({
				url: path,
				async: false
			});
		},

		ajax: function(params, callback) {
			var url = params.url, method = (params.method && params.method
					.toUpperCase() === "POST")
					|| 'GET', async = (params.async === false) ? false : true;
			var xmlHttp;
			if (window.XMLHttpRequest) {
				xmlHttp = new XMLHttpRequest();
			} else {
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlHttp.open(method, url, async);
			xmlHttp.send(null);
			if (undefined !== callback) {
				if (async) {
					xmlHttp.onreadystatechange = function() {
						if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							callback(xmlHttp.responseText);
						}
					}
				} else {
					if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
						callback(xmlHttp.responseText);
					}
				}

			}
			// if it isn't sync, load and return the response
			if (!async) {
				return xmlHttp.responseText;
			}
		}
	}
	window.god = new God;
})(window);