(function(window){
	var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
	loadModelRegExp = /[^.]\s*god\.model\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
	loadViewRegExp = /[^.]\s*god\.view\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
	var consts = {
		CONTROLLER: 'controller',
		MODEL: 'model',
		VIEW: 'view'
	};
	function God(){
		
	}
	God.prototype = {
		appPath: '',
		loadedModules: {
			controllers: [],
			models: [],
			views: []
		},
		context: [],
		exe: function(parts, param){
			//for(var i in parts){
				var t = parts.split('.'),
					controller_name = t[0],
					action_name = t[1];
				var task = function(){
					var cls = new god.loadedModules.controllers[controller_name];
					var str ="cls."+action_name+"(param)";
					//eval(str);
				};
				this.context[controller_name] = {nScripts: 1, callback: task};
				this.require(controller_name, task);
				return this; // make chain
			//}
		},
		require: function(controller_name, callback){
			var checkDone = function(){alert("check"+god.context[controller_name].nScripts)
				if(god.context[controller_name].nScripts === 0){
					callback();
				}
			}
			loadScript(consts.CONTROLLER, controller_name, controller_name, checkDone);
		},
		config: function(obj){
			this.appPath = obj.appPath;
		}
	};
	function loadScript(type, name, context, callback){alert("has"+god.context[context].nScripts)
		var url;
		switch(type){
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
		god.context[context].nScripts--;	// decrease the needed module count
		var head = document.getElementsByTagName('head')[0],
		dom = document.createElement('script');
		dom.src = url;
		dom.onload = function(){alert("load"+names)};
		head.appendChild(dom);
	}
	function clone(obj){alert(obj.toString())
	    if(typeof(obj) === 'function'){
	    	var o = eval(obj.toString());
	    	return o;
	    }
	}
	function Controller(){}
	Controller.prototype = {
		view: '',
		deps: {
			models: [],
			views: []
		},
		isLoaded: false,
		/*
		 * the load function is just return the registered module instance, the depende issue is already sattled down by extend function 
		 */
		load: function(id){
			return new god.loadedControllers[id];		
		},
		setView: function(view){
			this.view = view;
		}
	};
	Controller.prototype.extend = function(controller_name, obj){alert("extend contro")
		var self = this;
		function Ctrl(){
			if(this.init) this.init();
		}
		Ctrl.prototype = new Controller;
		/*
		 * scan the depended modules in controller
		 */
		for(var i in obj){
			if(typeof obj[i] === 'function'){
				obj[i].toString().replace(commentRegExp, '').replace(loadModelRegExp, function (match, dep) {
					self.deps.models.push(dep);
					god.context[controller_name].nScripts++;
				});
				obj[i].toString().replace(commentRegExp, '').replace(loadViewRegExp, function (match, dep) {
					self.deps.views.push(dep);
					god.context[controller_name].nScripts++;
				});
			}
			Ctrl.prototype[i] = obj[i];
		}alert("dps"+god.context[controller_name].nScripts)
		for(var i in this.deps.models){
			/**
			 * if the module is not loaded before, the load this script.
			 * else just decrease the depended scripts number
			 */
			if(undefined === god.loadedModules.models[this.deps.models[i]]){
				loadScript(consts.MODEL, this.deps.models[i], controller_name, god.context[controller_name].callback);
			} else {
				god.context[controller_name].nScripts--;
			}
		}
		for(var i in this.deps.views){
			if(undefined === god.loadedModules.views[this.deps.views[i]]){
				loadScript(consts.VIEW, this.deps.views[i], controller_name, god.context[controller_name].callback);
			} else {
				god.context[controller_name].nScripts--;
			}
		}
		god.loadedModules.controllers[controller_name] = Ctrl;
		return Ctrl;
	};
	
	function Model(){}
	Model.prototype = {
		baseUrl: "",	//the url to fetch model data, used by fetch, save, delete...
		defaults: {},
		load: function(id){
			return new god.loadedModules.models[id];
		},
		/**
		 * fetch data from remote server, server response should be like:
		 * {"name": "guodong", "age": 18, "isVip": true}
		 * @param param the param transfred to server using Get Method
		 */
		fetch: function(param){
			var data = Helper.load(this.baseUrl);
			for(var i in data){
				this.defaults[i] = data[i];
			}
		}
	};
	Model.prototype.extend = function(id, obj){alert("extend model"+id)
		function Mdl(){
			if(this.init) this.init();
		}
		Mdl.prototype = new Model;
		for(var i in obj){
			Mdl.prototype[i] = obj[i];
		}alert(id)
		god.loadedModules.models[id] = Mdl;
		return Mdl;
	};
	
	function View(){
		this.templatePath = '';
		this.vars = [];
	}
	View.prototype = {
		id: null,
		template: '',
		load: function(id){
			this.id = id;
			return new god.loadedModules.views[id];
		},
		set: function(key, value){
			this.vars[key] = value;
		},
		/**
		 * render the view page and replace the <%=..%> with vars
		 * @param dom the id of dom
		 */
		render: function(dom){
			if(this.templatePath === '') this.templatePath = this.id;
			var url = god.appPath + 'view/template/' + this.templatePath + ".js";
			this.template = Helper.load(url);
			var self = this, viewVarsRegExp = /<%=\s*(.*)\s*%>/g;
			this.template.replace(viewVarsRegExp, function (match, data) {
				var str = "self.vars."+data;
				var value = eval(str);
				self.template = self.template.replace(match, value);
			});
			document.getElementById(dom).innerHTML = self.template;
		}
	};
	View.prototype.extend = function(id, obj){
		function Vi(){
			if(this.init) this.init();
		}
		Vi.prototype = new View;
		for(var i in obj){
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
		/**
		 * just load content without executing it in sync way. Used for View templates
		 * @param path
		 */
		load: function(path){
			var xmlHttp;
			if(window.XMLHttpRequest){
				xmlHttp = new XMLHttpRequest();
			}else{
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlHttp.open("GET", path, false);
			xmlHttp.send();
			return xmlHttp.responseText;
		}
	}
})(window);

//god.exe(['User.checkLogin'])