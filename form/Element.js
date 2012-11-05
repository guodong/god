define(function(){
	return function(val, reg, nm){
		var value = val,
		regex = reg,
		name = nm,
		isValid = true;
		
		this.setValue = function(value){
			value = value;
		};
		this.setRegex = function(regex){
			regex = regex;
		};
		this.isValid = function(){
			if(regex){
				var reg = new RegExp(regex);
				isValid = true && reg.test(value);
				return isValid;
			}
			return true;
		};
		this.getName = function(){
			return name;
		};
		this.getIsValid = function(){
			return isValid;
		}
	};
});