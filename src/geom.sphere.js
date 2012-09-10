NPos3d.Geom.Sphere = function(args){
	var o = {};//Output
	args = args || {};
	o.color = args.color || undefined;
	o.points = [];
	o.lines = [];
	o.order = args.order || 'xzy';
	var radius = args.radius || 20;
	var segments = args.segments || 12;
	var rad = tau / segments;
	var rings = args.rings || 8;
	var sliceWidth = pi / (rings -1);
	var pointNum = 0;
	var point = 0;
	for(var ring = 0; ring < rings; ring += 1){
		var z = (Math.cos(sliceWidth * ring) * (radius));
		if(ring === 0 || ring === (rings -1)){
			if     (o.order === 'xyz' || o.order === 'yxz'){o.points.push([0,0,z]);}
			else if(o.order === 'xzy' || o.order === 'yzx'){o.points.push([0,z,0]);}
			else if(o.order === 'zxy' || o.order === 'zyx'){o.points.push([z,0,0]);}
			pointNum = o.points.length - 1;
			if(ring === (rings -1)){
				for(point = 0; point < segments; point += 1){
					o.lines.push([(pointNum - point -1),pointNum]); //,'#0f0'
				}
			}
		}else{
			var amp = Math.sin(sliceWidth * ring) * radius;
			for(point = 0; point < segments; point += 1){
				var x = Math.sin(rad*point) * amp;
				var y = Math.cos(rad*point) * amp;

				if     (o.order === 'xyz'){o.points.push([x,y,z]);}
				else if(o.order === 'xzy'){o.points.push([x,z,y]);}
				else if(o.order === 'zyx'){o.points.push([z,y,x]);}
				else if(o.order === 'zxy'){o.points.push([z,x,y]);}
				else if(o.order === 'yxz'){o.points.push([y,x,z]);}
				else if(o.order === 'yzx'){o.points.push([y,z,x]);}
				pointNum = o.points.length - 1;

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