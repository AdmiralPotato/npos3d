NPos3d.Geom.Lathe = function(args) {
	var t = this, type = 'Lathe';
	if(t.type !== type){ throw type + ' constructor requires the use of the `new` keyword.'; }
	if(
		typeof args.shape !== 'object' ||
		typeof args.shape.points !== 'object' ||
		typeof args.shape.points.length !== 'number'
	){ throw type + ' constructor requires the that the configuration object contains a `shape` property containing an object with a `points` array.'; }
	t.shape = args.shape;
	t.axis = args.axis === 0 ? 0 : args.axis || 1;
	t.segments = args.segments || 12;
	t.frac = args.frac || tau;
	t.points = [];
	t.lines = [];
	t.generate();
};

NPos3d.Geom.Lathe.prototype = {
	type: 'Lathe',
	generate: function() {
		var t = this, m = NPos3d.Maths,
			segment, segmentAngle = t.frac / parseInt(t.segments), segmentEuler = [0,0,0], segmentMatrix = m.makeMat4(),
			pointIndex, pointNum = t.shape.points.length, point,
			lineIndex, lineNum = t.shape.lines.length, line;
		t.points.length = 0;
		t.lines.length = 0;
		for(segment = 0; segment < t.segments; segment += 1){
			segmentEuler[t.axis] = segmentAngle * segment;
			m.eulerToMat4(segmentEuler, [0,1,2], segmentMatrix);
			for(pointIndex = 0; pointIndex < pointNum; pointIndex += 1){
				point = t.shape.points[pointIndex];
				t.points.push(m.p3Mat4Mul(point, segmentMatrix));
				if(t.shape.lines.length > 0){
					if(segment > 0) {
						t.lines.push([
							(segment * pointNum) + pointIndex,
							((segment - 1) * pointNum) + pointIndex
						]);
					}
					if(segment === t.segments -1) {
						t.lines.push([
							(segment * pointNum) + pointIndex,
							pointIndex
						]);
					}
				}
			}
			for(lineIndex = 0; lineIndex < lineNum; lineIndex += 1){
				line = t.shape.lines[lineIndex];
				t.lines.push([
					(segment * pointNum) + line[0],
					(segment * pointNum) + line[1]
				]);
			}
		}

	}
};
