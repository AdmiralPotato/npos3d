NPos3d.Geom.Circle = function(args){
	var t = this, type = 'Circle';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	t.color = args.color || undefined;
	t.segments = args.segments || 12;
	t.offset = args.offset || 0;
	t.points = [];
	t.lines = [];
	t.radius = args.radius || 20;
	t.axies = args.axies || [0,1,2];
	t.formCircle();
	return t;
};
NPos3d.Geom.Circle.prototype = {
	type: 'Circle',
	formCircle: function(){
		var t = this,
			m = NPos3d.Maths,
			slice = m.tau / t.segments,
			i, point, angle;
		t.points = [];
		t.lines = [];
		for(i = 0; i < t.segments; i += 1){
			point = [];
			angle = (slice * i) + t.offset;
			//relative x
			point[t.axies[0]] = m.cos(angle) * t.radius;
			//relative y
			point[t.axies[1]] = m.sin(angle) * t.radius;
			//relative z
			point[t.axies[2]] = 0;
			t.points.push(point);
			//creates the line between the current point and the previous point
			if(i > 0 && i <= t.segments){
				t.lines.push([i -1, i]); //,'#0f0'
				//closes the gap between the first point and the ending point
				if(i === t.segments -1){
					t.lines.push([i, 0]); //,'#f0f'
				}
			}
		}
		return t;
	}
};