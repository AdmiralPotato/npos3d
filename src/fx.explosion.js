NPos3d.Fx = NPos3d.Fx || {};

NPos3d.Fx.Explosion = function(args){
	var t = this, type = 'Explosion';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	if(NPos3d.Utils === undefined || NPos3d.Utils.Color === undefined){throw 'Please load the `NPos3d.Utils.Color` library prior to invoking the NPos3d.Fx.Explosion effects.';}
	args = args || {};
	//NPos3d.blessWith3DBase(t,args);
	if(!args.object || !args.object.shape.lines || !args.object.transformedPointCache){
		throw 'Fx.Explosion requires an Ob3D as the value for the `object` argument in the passed configuration object.';
	}
	t.o = args.object;
	t.lines = t.o.shape.lines;
	t.points = t.o.transformedPointCache;
	t.children = [];
	//console.log(t);
	t.lines.forEach(function(line){
		var p1 = t.points[line[0]],
			p2 = t.points[line[1]],
			color = t.o.color || t.o.shape.color || line[2] || t.o.scene.strokeStyle;
		t.children.push(new NPos3d.Fx.ExplosionLine({
			p1:p1,
			p2:p2,
			object:t.o,
			colorArray: NPos3d.Utils.Color.colorStringToRGBAArray(color)
		}));
	});
	t.o.destroy();
	return t;
};

NPos3d.Fx.Explosion.prototype = {
	type: 'Explosion'
};

NPos3d.Fx.ExplosionLine = function(args){
	var t = this, type = 'ExplosionLine';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	args.shape = {};
	NPos3d.blessWith3DBase(t,args);
	t.o = args.object;
	t.pos = t.o.gPos.slice(0);
	t.p1 = t.subVel(args.p1.slice(0), t.pos); //cloning the points
	t.p2 = t.subVel(args.p2.slice(0), t.pos);
	t.midpoint = t.getMidpoint();
	t.addVel(t.pos,t.midpoint);
	t.subVel(t.p1,t.midpoint);
	t.subVel(t.p2,t.midpoint);
	t.shape.points = [t.p1,t.p2];
	t.shape.lines = [[0,1]];
	t.colorArray = args.colorArray;
	t.vel = args.vel || [t.rint(2),t.rint(2),t.rint(2)];
	t.rotVel = args.rotVel || [t.rneg(2) * deg,t.rneg(2) * deg,t.rneg(2) * deg];
	t.lifespan = 50 + t.rint(100);
	t.life = t.lifespan;
	t.o.scene.add(t);
	return t;
};

NPos3d.Fx.ExplosionLine.prototype = {
	type: 'ExplosionLine',
	rneg:function(num){return ((Math.random()*2)-1)*num;},
	rint:function(num){return Math.round(((Math.random()*2)-1)*num);},
	rpos:function(n){return Math.random() * n;},
	rintpos:function(n){return Math.round(Math.random() * n);},
	getMidpoint:function(){
		var t = this;
		var length = [
			t.p2[0] - t.p1[0],
			t.p2[1] - t.p1[1],
			t.p2[2] - t.p1[2]
		];
		length[0] /= 2;
		length[1] /= 2;
		length[2] /= 2;
		length[0] += t.p1[0];
		length[1] += t.p1[1];
		length[2] += t.p1[2];
		return length;
	},
	addVel:function(o,v){
		o[0] += v[0];
		o[1] += v[1];
		o[2] += v[2];
		return o;
	},
	subVel:function(o,v){
		o[0] -= v[0];
		o[1] -= v[1];
		o[2] -= v[2];
		return o;
	},
	update:function(){
		var t = this,ca = t.colorArray;
		t.addVel(t.pos,t.vel);
		t.addVel(t.rot,t.rotVel);
		t.color = ['rgba(',ca[0],',',ca[1],',',ca[2],',',(ca[3] * (t.life / t.lifespan)),')'].join('');
		t.render();
		t.life -= 1;
		if(t.life < 1){
			t.destroy();
		}
	}
};