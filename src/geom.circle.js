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
	t.formCircle();
	return t;
}

NPos3d.Geom.Circle.prototype = {
	type: 'Circle',
	formCircle: function(){
		var t = this;
		t.points = [];
		t.lines = [];
		var rad = tau / t.segments;
		var z = 0;
		for(var point = 0; point < t.segments; point += 1){
			var x = Math.sin((rad*point) + t.offset) * t.radius;
			var y = Math.cos((rad*point) + t.offset) * t.radius;
			t.points.push([x,y,z]);

			//creates the line between the current point and the previous point
			if(point > 0 && point <= t.segments){
				t.lines.push([point -1 ,point]); //,'#0f0'

				//closes the gap between the first point and the ending point
				if(point === t.segments -1){
					t.lines.push([point, 0]); //,'#f0f'
				}

			}
		}
		return t;
	}
}