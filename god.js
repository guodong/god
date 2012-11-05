/**
 * Godjs: A MVC javascript programming framework using CommonJS style
 * 
 * @author	guodong
 * @email	gd@tongjo.com
 * @see		https://github.com/tongjo/god
 */
(function(window){
	var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
    cjsRequireRegExp = /[^.]\s*\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
	loadModelRegExp = /[^.]\s*god\.model\.load\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
	var God = function(){
		this.appPath = '';
		this.loadedControllers = [];
		this.loadedModels = [];
		this.context = [];
	};
	God.prototype = {
		use: function(path, param){
			var self = this;
			var arr = path.split('.'),
				controller_name = arr[0],
				action_name = arr[1];
			var task = function(){
				var cls = new god.loadedControllers[controller_name];
				var str ="cls."+action_name+"(param)";
				eval(str);
			};
			this.context[controller_name] = {numScripts: 0, callback: task};
			var checkDone = function(){
				if(god.context[controller_name].numScripts === 0){
					task();
				}
			}
			var url = this.appPath + 'controller/' + controller_name + '.js';
			loadScript(url, controller_name, checkDone);
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
		load: function(id, callback){
			if(god.loadedControllers[id] !== undefined){
				return new god.loadedControllers[id];
			}else{
				
			}			
		},
		setView: function(view){
			this.view = view;
			alert("setview")
		}
	}
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
			var url = god.appPath + 'model/' + this.deps[i] + '.js';
			loadScript(url, id, god.context[id].callback);
		}
		god.loadedControllers[id] = Ctrl;
		return Ctrl;
	};
	
	
	function Model(){}
	Model.prototype = {
		defaults: {},
		load: function(id){
			return new god.loadedModels[id];
		}
	}
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
	}
	var god = new God;
	God.prototype.controller = new Controller;
	God.prototype.model = new Model;
	window.god = god;
})(window);