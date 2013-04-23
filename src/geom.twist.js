NPos3d.Geom.Twist = function(args) {
	var t = this, type = 'Twist';
	if(t.type !== type){ throw type + ' constructor requires the use of the `new` keyword.'; }
	if(
		typeof args.shape !== 'object' ||
			typeof args.shape.points !== 'object' ||
			typeof args.shape.points.length !== 'number'
		){ throw type + ' constructor requires the that the configuration object contains a `shape` property containing an object with a `points` array.'; }
	t.shape = args.shape;
	if(args.axis === 0){
		t.axis = 0;
	} else {
		t.axis = args.axis || 1; //y axis
	}
	t.points = [];
	//in radians
	t.factor = args.factor === 0 ? 0 : args.factor || tau;
	//in radians
	t.offset = args.offset || 0;
	//TODO: implement limits!
	//t.limitUpper = args.limitUpper || 0;
	//t.limitLower = args.limitLower || 1;
	t.generate();
}

NPos3d.Geom.Twist.prototype = {
	type: 'Twist',
	generate: function() {
		var t = this,
			m = NPos3d.Maths,
			boundingBox = m.nGetBounds(t.shape.points),
			length = boundingBox[1][t.axis] - boundingBox[0][t.axis],
			pointIndex, pointNum = t.shape.points.length, point,
			axisProgression,
			twistEuler = [0,0,0],
			twistMatrix = m.makeMat4();
		t.points.length = 0;
		for(pointIndex = 0; pointIndex < pointNum; pointIndex += 1){
			point = t.shape.points[pointIndex].slice();
			axisProgression = ((point[t.axis] - boundingBox[0][t.axis]) / length) + t.offset;
			twistEuler[t.axis] = axisProgression * t.factor;
			m.eulerToMat4(twistEuler, [0,1,2], twistMatrix);
			m.p3Mat4Mul(point, twistMatrix, point);
			t.points.push(point);
		}
		if(t.shape.lines !== undefined){
			t.lines = t.shape.lines.slice();
		}
		//console.log(t.factor, twistEuler[t.axis]);
	}
};
