var timer = {
	q:{},
	start:function(string){
		this.q[string] = {
			start: false,
			stop: false,
			diff: false
		};
		var rec = this.q[string],
			now = new Date();
		rec.start = now.getTime();
		document.body.innerHTML += 'starting ' + string + '<br>';
	},
	stop:function(string){
		var rec = this.q[string],
			now = new Date();
		rec.stop = now.getTime();
		rec.diff = rec.stop - rec.start;
		return rec.diff;
	}
};

var totalRotationCalculations = 0;
var rotatePoint = function(x,y,rad){
	var length = Math.sqrt((x * x) + (y * y)),
		currentRad = Math.atan2(x,y);
	x = Math.sin(currentRad - rad) * length;
	y = Math.cos(currentRad - rad) * length;
	totalRotationCalculations += 1;
	return [x,y];
};
//--start array styled functions--
var arrayClone = function(a){
	return [a[0], a[1], a[2]];
};
var arrayAdd = function(a,b){
	a[0] += b[0];
	a[1] += b[1];
	a[2] += b[2];
};
var arraySub = function(a,b){
	a[0] -= b[0];
	a[1] -= b[1];
	a[2] -= b[2];
};
var arrayMul = function(a,n){
	a[0] *= n;
	a[1] *= n;
	a[2] *= n;
};
var arrayDiv = function(a,n){
	a[0] /= n;
	a[1] /= n;
	a[2] /= n;
};
var arrayScale = function(a,b){
	a[0] *= b[0];
	a[1] *= b[1];
	a[2] *= b[2];
};
var arrayRotate = function(a,rot,order){
	var x = a[0], y = a[1], z = a[2], r;
	order = order || [0,1,2];
	for(r = 0; r < order.length; r += 1){
		if(order[r] === 0){
			//x...
			if(rot[0] !== 0){
				var zy = rotatePoint(z,y,rot[0]);
				z = zy[0];
				y = zy[1];
			}
		}else if(order[r] === 1){
			//y...
			if(rot[1] !== 0){
				var xz = rotatePoint(x,z,rot[1]);
				x = xz[0];
				z = xz[1];
			}
		}else if(order[r] === 2){
			//z...
			if(rot[2] !== 0){
				var xy = rotatePoint(x,y,rot[2]);
				x = xy[0];
				y = xy[1];
			}
		}else{
			throw 'up';
		}
	}
	a[0] = x;
	a[1] = y;
	a[2] = z;
	return a;
};
//--end array styled functions--

//--start object styled functions--
var objectClone = function(a){
	return {x: a.x, y: a.y, z: a.z};
};
var objectAdd = function(a,b){
	a.x += b.x;
	a.y += b.y;
	a.z += b.z;
};
var objectSub = function(a,b){
	a.x -= b.x;
	a.y -= b.y;
	a.z -= b.z;
};
var objectScale = function(a,b){
	a.x *= b.x;
	a.y *= b.y;
	a.z *= b.z;
};
var objectMul = function(a,n){
	a.x *= n;
	a.y *= n;
	a.z *= n;
};
var objectDiv = function(a,n){
	a.x /= n;
	a.y /= n;
	a.z /= n;
};
var objectRotate = function(a,rot,order){
	var x = a.x, y = a.y, z = a.z, r;
	order = order || [0,1,2];
	for(r = 0; r < order.length; r += 1){
		if(order[r] === 0){
			//x...
			if(rot.x !== 0){
				var zy = rotatePoint(z,y,rot.x);
				z = zy[0];
				y = zy[1];
			}
		}else if(order[r] === 1){
			//y...
			if(rot.y !== 0){
				var xz = rotatePoint(x,z,rot.y);
				x = xz[0];
				z = xz[1];
			}
		}else if(order[r] === 2){
			//z...
			if(rot.z !== 0){
				var xy = rotatePoint(x,y,rot.z);
				x = xy[0];
				y = xy[1];
			}
		}else{
			throw 'up';
		}
	}
	a.x = x;
	a.y = y;
	a.z = z;
	return a;
};
//--end array styled functions--


var approaches = {
	array: {
		create: function(input, output, key) {
			input.push([
				(Math.random() * 100),
				(Math.random() * 100),
				(Math.random() * 100)
			]);
		},
		clone: function(input, output, key) {
			output.push(arrayClone(input[key]));
		},
		mul: function(input, output, key) {
			arrayMul(output[key], Math.random() * 100);
		},
		scale: function(input, output, key) {
			arrayScale(output[key], [
				(Math.random() * 100),
				(Math.random() * 100),
				(Math.random() * 100)
			]);
		},
		rotate: function(input, output, key) {
			arrayRotate(output[key], [
				(Math.random() * 100),
				(Math.random() * 100),
				(Math.random() * 100)
			]);
		}
	},
	objectLiteral: {
		create: function(input, output, key) {
			input.push({
				x: (Math.random() * 100),
				y: (Math.random() * 100),
				z: (Math.random() * 100)
			});
		},
		clone: function(input, output, key) {
			output.push(objectClone(input[key]));
		},
		mul: function(input, output, key) {
			objectMul(output[key], Math.random() * 100);
		},
		scale: function(input, output, key) {
			objectScale(output[key], {
				x: (Math.random() * 100),
				y: (Math.random() * 100),
				z: (Math.random() * 100)
			});
		},
		rotate: function(input, output, key) {
			objectRotate(output[key], {
				x: (Math.random() * 100),
				y: (Math.random() * 100),
				z: (Math.random() * 100)
			});
		}
	},
	vec3: {
		create: function(input, output, key) {
			input.push(new Vec3(
				(Math.random() * 100),
				(Math.random() * 100),
				(Math.random() * 100)
			));
		},
		clone: function(input, output, key) {
			output.push(input[key].clone());
		},
		mul: function(input, output, key) {
			output[key].mul(Math.random() * 100);
		},
		scale: function(input, output, key) {
			output[key].scale(
				(Math.random() * 100),
				(Math.random() * 100),
				(Math.random() * 100)
			);
		},
		rotate: function(input, output, key) {
			output[key].rotate(
				[
					(Math.random() * 100),
					(Math.random() * 100),
					(Math.random() * 100)
				]
			);
		}
	}
};

var operationCount = 500000;
var speedTest = function(taskName, task, input, output){
	var i;
	timer.start(taskName);
	for(i = 0; i < operationCount; i += 1){
		task(input, output, i);
	}
	return timer.stop(taskName);
};

var arrayList = [],
	arrayListTransformed = [],
	objectLiteralList = [],
	objectLiteralListTransformed = [],
	vec3List = [],
	vec3ListTransformed = [];

alert('Be patient, this is going to take a minute.');
var approach, task, result, table = ['All operations completed ', operationCount, ' times. Smaller numbers are better.<br><table border="1">'], tableHeader = [], tableRow = [], firstRowComplete = false;
for(approachName in approaches){
	if(approaches.hasOwnProperty(approachName)){
		approach = approaches[approachName];
		for(taskName in approach){
			if(approach.hasOwnProperty(taskName)){
				task = approach[taskName];
				console.log(approachName + ' ' + taskName);
				if(!firstRowComplete){
					tableHeader.push('<th>', taskName, '</th>');
				}
				result = speedTest(
					approachName + ' ' + taskName,
					task,
					window[approachName + 'List'],
					window[approachName + 'ListTransformed']
				);
				tableRow.push('<td>', result, '</td>');
			}
		}
		if(!firstRowComplete){
			table.push('<thead><tr><th>Type</th>', tableHeader.join(''), '</tr></thead><tbody>');
			firstRowComplete = true;
		}
		table.push('<tr><th>', approachName, '</th>', tableRow.join(''), '</tr>');
		tableRow = [];
	}
}
table.push('</tbody></table>');
document.body.innerHTML += table.join('');