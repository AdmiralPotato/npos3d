NPos3d.Layout = NPos3d.Layout || {};

NPos3d.Layout.ResponsivePoint = function(args) {
	var t = this, type = 'ResponsivePoint';
	if(t.type !== type){throw type + ' must be invoked using the `new` keyword.';}
	args = args || {};
	if(typeof args.offset !== 'undefined' && typeof args.offset.length !== 'number'){
		throw type + ' constructor MUST be provided an `offset` array argument';
	}
	if(typeof args.scene !== 'undefined' && typeof args.offset.length !== 'number'){
		throw type + ' constructor MUST be provided a `scene` object argument';
	}
	t.offset = args.offset;
	t.scene = args.scene;
	t.scene.add(t); //adds itself to the scene automatically, because it needs the scene to work
	t.update();
	return t;
};

NPos3d.Layout.ResponsivePoint.prototype = []; //it has to smell like a normal vertex
NPos3d.Layout.ResponsivePoint.prototype.type = 'ResponsivePoint';
NPos3d.Layout.ResponsivePoint.prototype.update = function() {
	var t = this, i;
	if(t.offset[0] < 0) {
		t[0] = t.scene.cx - t.offset[0];
	} else if(t.offset[0] > 0) {
		t[0] = -t.scene.cx + t.offset[0];
	} else {
		t[0] = 0;
	}
	if(t.offset[1] < 0) {
		t[1] = t.scene.cy - t.offset[1];
	} else if(t.offset[0] > 0) {
		t[1] = -t.scene.cy + t.offset[1];
	} else {
		t[1] = 0;
	}
	t[2] = t.offset[2];
	if(typeof t.offset[3] !== 'undefined') { //set the color property, if it's a vertex
		t[3] = t.offset[3];
		t.length = 4;
	} else {
		t.length = 3;
	}
};