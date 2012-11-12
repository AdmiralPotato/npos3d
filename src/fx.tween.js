NPos3d.Fx = NPos3d.Fx || {};

NPos3d.Fx.Tween = function(args){
	var t = this, type = 'Tween';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	if(!args.object){
		throw 'Fx.Tween requires an Object as the value for the `object` argument in the passed configuration object.';
	}
	if(!args.properties){
		throw 'Fx.Tween requires an Object as the value for the `properties` argument in the passed configuration object.';
	}
	t.o = args.object;
	t.properties = args.properties;
	t.onUpdate = args.onUpdate || undefined;
	t.callback = args.callback || undefined;
	t.method = args.method || t.transitionLinear;
	t.frames = args.frames || 60;
	t.frameState = 0;
	t.frac = 0;
	t.initialValues = {};
	t.pos = [0,0,0]; // required if the tween is to be in the scene's update queue
	for(var p in t.properties){
		if(t.properties.hasOwnProperty(p)){
			var prop = t.properties[p];
			if(prop.length !== undefined){ //if property is an array, clone it
				t.initialValues[p] = t.o[p].slice(0);
			}else{
				t.initialValues[p] = t.o[p];
			}
		}
	}
	t.o.add(this);
	return t;
};

NPos3d.Fx.Tween.prototype = {
	type: 'Tween',
	transitionLinear:function(n){return n;},
	update:function(){
		var t = this;
		t.frac = t.method(t.frameState / t.frames);
		for(var p in t.properties){
			if(t.properties.hasOwnProperty(p)){
				var prop = t.properties[p];
				var init = t.initialValues[p];
				if(prop.length !== undefined){ //if property is an array, loop through it
					for(var i = 0; i < prop.length; i += 1){
						t.o[p][i] = init[i] + ((prop[i] - init[i]) * t.frac);
					}
				}else{
					t.o[p] = init + ((prop - init) * t.frac);
				}
			}
		}
		if(t.onUpdate !== undefined){
			t.onUpdate(t);
		}
		t.frameState += 1;
		if(t.frameState > t.frames){
			if(t.callback !== undefined){
				t.callback(t);
			}
			t.o.remove(t);
		}
	}
};