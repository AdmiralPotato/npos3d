NPos3d.Geom.Sphere = function(args){
	var o = {};//Output
	var args = args || {};
	o.color = args.color || '#fff';
	o.points = [];
	o.lines = [];
	var radius = args.radius || 20;
	var segments = args.segments || 12;
	var rad = tau / segments;
	var rings = args.rings || 8;
	var sliceWidth = pi / (rings -1);
	var pointNum = 0;
	for(var ring = 0; ring < rings; ring += 1){
		var z = (Math.cos(sliceWidth * ring) * (radius));
		if(ring === 0 || ring === (rings -1)){
			o.points.push([0,z,0]);
			var pointNum = o.points.length - 1;
			if(ring === (rings -1)){
				for(var point = 0; point < segments; point += 1){
					o.lines.push([(pointNum - point -1),pointNum]); //,'#0f0'
				}
			}
		}else{
			var amp = Math.sin(sliceWidth * ring) * radius;
			for(var point = 0; point < segments; point += 1){
				var x = Math.sin(rad*point) * amp;
				var y = Math.cos(rad*point) * amp;
				o.points.push([x,z,y]);
				var pointNum = o.points.length - 1;

				//creates the line between this point and the last
				if(pointNum < segments +1){
					o.lines.push([0,pointNum]); //,'#0f0'
				}

				//draws the rings...
				if(pointNum > 1 && point > 0){
					o.lines.push([pointNum -1, pointNum]); //,'#00f'
				}

				//closes the gap between the first point in a ring and the last
				if(point === segments -1){
					o.lines.push([pointNum - (segments -1), pointNum]); //,'#f0f'
				}

				//draws the rings...
				if(pointNum > segments){
					o.lines.push([pointNum -segments, pointNum]);
				}

				
				//if(pointNum > segments){
				//s.lines.push([pointNum,]);
			}
		}
	}
	return o;
}