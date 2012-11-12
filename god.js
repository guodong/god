/**
 * Godjs: A module loader and a MVC javascript programming framework used for
 * large and modularized web applications
 * 
 * @author guodong
 * @email gd@tongjo.com
 * @see https://github.com/tongjo/god
 * 
 * @notice the loading order is described as follows:
 * 1. execute script in loading file 
 * 2. execute callback such as onload callback and onreadystatechange callback
 * 
 * the register process is described as follows: 
 * 1. create context 
 * 2. define the callback that check if module is ready 
 * 3. parse and load dependences and bind callbacks 
 * 4. register to god.modules
 * 
 * @issues: there still exists some issues to be solved, here list them as follows:
 * 1. the cycle dependence, optional you can just use the god.exe method to call controller's action directly
 */
(function(window) {
	/**
	 * the global sequence number, used for require method to create a context like god.modules[3]
	 */
	var seq = 1;
	function God() {
		
	}
	God.prototype = {
		appPath: '',
		modules: [],
		config: function(obj) {
			this.appPath = obj.appPath;
		},
		define: function(module_name, deps, content) {
			// alert("define:" + module_name)
			/*
			 * the callback that check whether all dependences are ready, if
			 * ready, execute the content and register to god.module
			 */
			var callback = function() {
				// alert("callback:" + module_name + " deps:" + deps.join(' '));
				// var content = content;
				var isReady = true;
				for ( var i in deps) {
					// if depended module has not been defined, just break it.
					// Because it will call this callback when this depended
					// module finished
					if (undefined === god.modules[deps[i]]) {// alert("undef:"+deps[i])
						isReady = false;
						break;
					}
					// if there is dependence not ready, register this callback
					// to it, it will be executed once the dependence is ready
					if (!god.modules[deps[i]].isReady) {
						// alert("register " + module_name + ' to ' + deps[i]);

						// there exists this case: A rely on B,C and B rely on
						// D, C rely on nothing, when define(A), once B loaded,
						// this callback will be called, because B is not
						// complete, it will register to B's completeCallbacks;
						// But when C is loaded, this callback will be called
						// second time, and it will be registered to B twice,
						// thus making twice call when B is complete, so we use
						// sequence number to controll it just be registered
						// only once.
						var _seq = god.modules[module_name].seq;
						god.modules[deps[i]].completeCallbacks[_seq] = callback;
						isReady = false;
						break;
					}
				}
				
				if (isReady) {
					var module = god.modules[module_name];
					module.isReady = true;
					var args = [];
					for ( var i in deps) {
						args.push(god.modules[deps[i]].content);
					}
					module.content = content.apply(window, args);
					module.isComplete = true;
					for ( var i in module.completeCallbacks) {
						module.completeCallbacks[i]();
					}
				}
			};
			// register module to god.modules
			/**
			 * if (undefined === god.modules[module_name]) {
			 * god.modules[module_name] = { seq: seq++, // the sequence number
			 * is used for registering // completeCallback's index isReady:
			 * false, isComplete: false, completeCallbacks: [], // execute once
			 * all dependences are // complete and content has been //
			 * registered to god.modules content: null }; }
			 */

			for ( var i = 0 in deps) {// alert(god.modules[deps[i]])
				if (undefined === god.modules[deps[i]]) {
					god.modules[deps[i]] = {
						seq: seq++, // the sequence number is used for
									// registering
						// completeCallback's index
						isReady: false,
						isComplete: false,
						completeCallbacks: [], // execute once all dependences
												// are
						// complete and content has been
						// registered to god.modules
						content: null
					};
					var url = god.appPath + deps[i] + '.js';
					loadScript(url, callback);
				} else {// alert("loaded:"+deps[i])
					// god.modules[deps[i]].completeCallbacks.push(callback);
					var _seq = god.modules[deps[i]].seq;
					if (god.modules[deps[i]].isComplete) {
						callback();
					} else {
						god.modules[deps[i]].completeCallbacks[_seq] = callback;
					}
				}
			}
			// if the module has no dependence, just call the callback and it
			// will register the content to god.modules
			if (0 === deps.length) {
				callback();
			}
		},
		require: function(deps, callback) {
			// var d = new Date();

			/**
			 * use the sequence number to make a private context index, just
			 * like the module name in define function.
			 */
			var tmp_module_name = seq++;
			god.modules[tmp_module_name] = {
				seq: seq++, // the sequence number is used for registering
				// completeCallback's index
				isReady: false,
				isComplete: false,
				completeCallbacks: [], // execute once all dependences are
				// complete and content has been
				// registered to god.modules
				content: null
			};
			return this.define(tmp_module_name, deps, callback);
		},
		/**
		 * execute the controller's action, the arguments except first
		 * one(controller name and action name) will be transfered to the action
		 * For instance, god.exe('User.logout', {uid: 2});
		 * 
		 * @param action: the controller and action string
		 *            eg: 'User.logout'
		 * @returns {God} just for chain call
		 */
		exe: function(action){
			var t = action.split('.'), controller_name = t[0], action_name = t[1];
			var args = [], i, length = arguments.length;
			for(i=1; i<length; i++){
				args.push(arguments[i]);
			}
			god.require(['controller/'+controller_name], function(ctrl){
				var str = "ctrl." + action_name + ".apply(ctrl, args)";
				eval(str);
			});			
			return this; // make chain
		}
	};
	window.god = new God;
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
		/**
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
	Controller.prototype.extend = function(obj) {
		/**
		 * the initialize function will be called automatically
		 */
		function Ctrl() {
			if (this.initialize){
				this.initialize();
			}
				
		}
		Ctrl.prototype = new Controller;
		/**
		 * copy attribution from obj to Controller
		 */
		for ( var i in obj) {
			Ctrl.prototype[i] = obj[i];
		}
		return new Ctrl;
	};

	function Model() {
	}
	Model.prototype = {
		/**
		 * the url to fetch model data, used by fetch, save, delete...
		 */
		baseUrl: "",
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
	Model.prototype.extend = function(obj) {
		function Mdl() {
			if (this.init)
				this.init();
		}
		Mdl.prototype = new Model;
		for ( var i in obj) {
			Mdl.prototype[i] = obj[i];
		}
		return Mdl;
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
		 * @param dom: the id of dom
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

	View.prototype.extend = function(obj) {
		function Vi() {
			if (this.init)
				this.init();
		}
		Vi.prototype = new View;
		for ( var i in obj) {
			Vi.prototype[i] = obj[i];
		}
		return Vi;
	};
	
	God.prototype.controller = new Controller;
	God.prototype.model = new Model;
	God.prototype.view = new View;

	var Helper = {
		/**
		 * just load content without executing it in sync way. Used for View  templates
		 * 
		 * @notice	this method only can be used for same domain loading, thus determine the View templates must be load under app domain
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
			/**
			 * if it isn't sync, load and return the response
			 */
			if (!async) {
				return xmlHttp.responseText;
			}
		}
	}
})(window);