/**
 * Godjs: A MVC javascript programming framework using CommonJS style
 * 
 * @author	guodong
 * @email	gd@tongjo.com
 * @see		https://github.com/tongjo/god
 */
(function(window){
	var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
	loadModelRegExp = /[^.]\s*god\.model\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
	var God = function(){
		this.appPath = '';
		this.appConfig = {};
		this.loadedControllers = [];
		this.loadedModels = [];
		this.context = [];
	};
	God.prototype = {
		/**
		 * load the controller and execute the action, the context id is the controller name, the depended modules will
		 * under the context namespace used for judging completement.
		 * if one dep is loaded, the judge whether all deps is loaded, if all is loaded, execute the task callback
		 * 
		 * @param path
		 * @param param
		 */
		use: function(path, param){
			var self = this;
			var arr = path.split('.'),
				controller_name = context = arr[0],
				action_name = arr[1];
			var task = function(){
				var cls = new god.loadedControllers[controller_name];
				var str ="cls."+action_name+"(param)";
				eval(str);
			};
			/*
			 * if the controller is already loaded before, and the depended modules must be already loaded, just do the task and return
			 */
			if(undefined !== god.loadedControllers[controller_name]){
				task();
				return;
			}
			/*
			 * initialize the loading context, modules under this context will be used by this controller
			 */
			this.context[context] = {numScripts: 0, callback: task};
			/*
			 * check if all depended modules are loaded, if loaded then do the task
			 */
			var checkDone = function(){
				if(god.context[context].numScripts === 0){
					task();
				}
			};
			var url = this.appPath + 'controller/' + controller_name + '.js';
			/*
			 * load a module and decrease the number of depended scripts under context[controller_name]
			 * once loaded, check if depended modules are already loaded
			 */
			loadScript(url, context, checkDone);
		},
		config: function(obj){
			this.appPath = obj.appPath;
		},
	};
	function loadScript(url, id, callback){
		var head = document.getElementsByTagName('head')[0],
			dom = document.createElement('script');
		dom.src = url;
		dom.onload = callback;
		head.appendChild(dom);
		god.context[id].numScripts--;	// decrease the needed module count
	}
	
	function Controller(){}
	Controller.prototype = {
		view: '',
		deps: [],
		isLoaded: false,
		load: function(id){
			return new god.loadedControllers[id];		
		},
		setView: function(view){
			this.view = view;
		}
	};
	Controller.prototype.extend = function(id, obj){
		var self = this;
		function Ctrl(){
			if(this.init) this.init();
		}
		Ctrl.prototype = new Controller;
		for(var i in obj){
			if(typeof obj[i] === 'function'){
				obj[i].toString().replace(commentRegExp, '').replace(loadModelRegExp, function (match, dep) {
					self.deps.push(dep);
					god.context[id].numScripts++;
				});
			}
			Ctrl.prototype[i] = obj[i];
		}
		for(var i in this.deps){
			if(undefined === god.loadedModels[this.deps[i]]){
				var url = god.appPath + 'model/' + this.deps[i] + '.js';
				loadScript(url, id, god.context[id].callback);
			}
		}
		god.loadedControllers[id] = Ctrl;
		return Ctrl;
	};
	
	
	function Model(){}
	Model.prototype = {
		baseUrl: "",	//the url to fetch model data, used by fetch, save, delete...
		defaults: {},
		load: function(id){
			return new god.loadedModels[id];
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
	Model.prototype.extend = function(id, obj){
		function Mdl(){
			if(this.init) this.init();
		}
		Mdl.prototype = new Model;
		for(var i in obj){
			Mdl.prototype[i] = obj[i];
		}
		god.loadedModels[id] = Mdl;
		return Mdl;
	};
	
	function View(){
		this.template = "";
		this.templatePath = '';
		this.vars = [];
	}
	View.prototype = {
		id: null,
		load: function(id){
			this.id = id;
			return new god.loadedViews[id];
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
		god.loadedViews[id] = Vi;
		return Vi;
	}
	
	//here init the god object, and init the controller, model, view
	var god = new God;
	God.prototype.controller = new Controller;
	God.prototype.model = new Model;
	God.prototype.view = new View;
	
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
	window.god = god;
})(window);