/**
 * Godjs: A MVC javascript programming framework using CommonJS style
 * 
 * @author	guodong
 * @email	gd@tongjo.com
 * @see		https://github.com/tongjo/god
 * 
 * @notice when loading a script by adding script tag in head, the executing order is as follows:
 * 1.the loadScript function will load script in async way, and attach callback to onload
 * 2.execute script in loaded script, in godjs it will call the extend function, so it will execute the extend function,
 *   and the extend function will register the loaded module to god, just like in loadedControllers array, at the same time, scan the 
 *   depended modules like models and views, and added them to the loading context.
 * 3.execute the callback binded in the first step. Typically, in godjs it will check the context's numScripts which is the unloaded but depended scripts's number
 *   if it is zero, means that all deps is loaded, and call the callback function.
 */
(function(window) {
	var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, loadModelRegExp = /[^.]\s*god\.model\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g, loadViewRegExp = /[^.]\s*god\.view\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
	var consts = {
		CONTROLLER : 'controller',
		MODEL : 'model',
		VIEW : 'view'
	};
	function God() {

	}
	God.prototype = {
		appPath : '',
		/*
		 * the modules that has been loaded
		 */
		loadedModules : {
			controllers : [],
			models : [],
			views : []
		},
		context : [],
		exe : function(parts, param) {
			var t = parts.split('.'), controller_name = t[0], action_name = t[1];
			var task = function() {
				var cls = new god.loadedModules.controllers[controller_name];
				var str = "cls." + action_name + "(param)";
				eval(str);
			};
			if(undefined === god.loadedModules.controllers[controller_name]){
				var checkDone = function() {
					if (god.context[controller_name].nScripts === 0) {
						task();
					}
				}
				this.context[controller_name] = {
					nScripts : 1,
					callback : checkDone
				};
				this.require(controller_name);
			} else {
				task();
			}
			
			return this; // make chain
		},
		require : function(controller_name) {

			loadScript(consts.CONTROLLER, controller_name, controller_name);
		},
		config : function(obj) {
			this.appPath = obj.appPath;
		}
	};
	function loadScript(type, name, context) {
		var url;
		switch (type) {
		case consts.CONTROLLER:
			url = god.appPath + 'controller/' + name + '.js';
			break;
		case consts.MODEL:
			url = god.appPath + 'model/' + name + '.js';
			break;
		case consts.VIEW:
			url = god.appPath + 'view/script/' + name + '.js';
			break;
		default:
			url = god.appPath + name + '.js';
		}

		var xmlHttp;
		if (window.XMLHttpRequest) {
			xmlHttp = new XMLHttpRequest();
		} else {
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
				var str = xmlHttp.responseText;
				eval(str);
				god.context[context].nScripts--; // decrease the needed module count
				god.context[context].callback();	//once loaded a script, test the requiring context checkDone function
			}
		}
		xmlHttp.open("GET", url, true);
		xmlHttp.send();
	}
	function Controller() {
	}
	Controller.prototype = {
		view : '',
		deps : {
			models : [],
			views : []
		},
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
	Controller.prototype.extend = function(controller_name, obj) {
		var self = this;
		function Ctrl() {
			if (this.init)
				this.init();
		}
		Ctrl.prototype = new Controller;
		/*
		 * scan the depended modules in controller
		 */
		for ( var i in obj) {
			if (typeof obj[i] === 'function') {
				obj[i].toString().replace(commentRegExp, '').replace(
						loadModelRegExp, function(match, dep) {
							self.deps.models.push(dep);
							god.context[controller_name].nScripts++;
						});
				obj[i].toString().replace(commentRegExp, '').replace(
						loadViewRegExp, function(match, dep) {
							self.deps.views.push(dep);
							god.context[controller_name].nScripts++;
						});
			}
			Ctrl.prototype[i] = obj[i];
		}
		for ( var i in this.deps.models) {
			/**
			 * if the module is not loaded before, the load this script. else
			 * just decrease the depended scripts number
			 */
			if (undefined === god.loadedModules.models[this.deps.models[i]]) {
				loadScript(consts.MODEL, this.deps.models[i], controller_name,
						god.context[controller_name].callback);
			} else {
				god.context[controller_name].nScripts--;
			}
		}
		for ( var i in this.deps.views) {
			if (undefined === god.loadedModules.views[this.deps.views[i]]) {
				loadScript(consts.VIEW, this.deps.views[i], controller_name,
						god.context[controller_name].callback);
			} else {
				god.context[controller_name].nScripts--;
			}
		}
		god.loadedModules.controllers[controller_name] = Ctrl;
		return Ctrl;
	};

	function Model() {
	}
	Model.prototype = {
		baseUrl : "", // the url to fetch model data, used by fetch, save,
		// delete...
		defaults : {},
		load : function(model_name) {
			return new god.loadedModules.models[model_name];
		},
		/**
		 * fetch data from remote server, server response should be like:
		 * {"name": "guodong", "age": 18, "isVip": true}
		 * 
		 * @param param the param transfred to server using Get Method
		 */
		fetch : function(param) {
			var self = this, argstr = '?', t = [];
			for(var i in param){
				t[t.length] = i + '=' + param[i];
			}
			argstr += t.join('&');
			var data = Helper.ajax({url: this.baseUrl+argstr, async: false}, function(data){
				var d = JSON.parse(data);
				for ( var i in d) {
					self.defaults[i] = d[i];
				}
			});
		}
	};
	Model.prototype.extend = function(id, obj) {
		function Mdl() {
			if (this.init)
				this.init();
		}
		Mdl.prototype = new Model;
		for ( var i in obj) {
			Mdl.prototype[i] = obj[i];
		}
		god.loadedModules.models[id] = Mdl;
		return Mdl;
	};

	function View() {
	}
	View.prototype = {
		template : '',
		vars: [],
		templatePath: '',
		load : function(id) {
			this.id = id;
			return new god.loadedModules.views[id];
		},
		set : function(key, value) {
			this.vars[key] = value;
		},
		/**
		 * render the view page and replace the <%=..%> with vars
		 * 
		 * @param dom
		 *            the id of dom
		 */
		render : function(dom) {
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
			if(this.initRander) this.initRander();
		}
	};
	View.prototype.extend = function(id, obj) {
		function Vi() {
			if (this.init)
				this.init();
		}
		Vi.prototype = new View;
		for ( var i in obj) {
			Vi.prototype[i] = obj[i];
		}
		god.loadedModules.views[id] = Vi;
		return Vi;
	};
	God.prototype.controller = new Controller;
	God.prototype.model = new Model;
	God.prototype.view = new View;
	window.god = new God;

	var Helper = {
		/*
		 * just load content without executing it in sync way. Used for View
		 * templates
		 */
		load : function(path) {
			return this.ajax({url: path, async: false});
		},
		
		ajax: function(params, callback){
			var url = params.url,
				method = (params.method && params.method.toUpperCase() === "POST") || 'GET',
				async = (params.async === false)? false: true;
			var xmlHttp;
			if (window.XMLHttpRequest) {
				xmlHttp = new XMLHttpRequest();
			} else {
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlHttp.open(method, url, async);
			xmlHttp.send(null);
			if (undefined !== callback) {
				if(async){
					xmlHttp.onreadystatechange = function() {
						if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							callback(xmlHttp.responseText);
						}
					}
				}else{
					if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
						callback(xmlHttp.responseText);
					}
				}
				
			}
			// if it isn't sync, load and return the response
			if(!async){
				return xmlHttp.responseText;
			}
		}
	}
})(window);

// god.exe(['User.checkLogin'])
