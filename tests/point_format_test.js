//OKAY FORGET ALL OF THIS. IT DIDN'T WORK BECAUSE THE BROWSER TIMED OUT. I HATE IT NOW.
/*
//var bigString = 'lols';
var justDoIt = function(string){
	console.log('Running!');
	var bigString = objToShapeParser(string);
	//console.log(bigString);
	var output = document.getElementById('output');
	output.innerHTML = bigString;
}
justGiveMeData('subsurfed_6_times.obj',justDoIt);
*/

var timer = {
	q:{},
	start:function(string){
		this.q[string] = {
			start: false,
			stop: false,
			diff: false
		};
		rec = this.q[string];
		var now = new Date();
		rec.start = now.getTime();
	},
	stop:function(string){
		rec = this.q[string];
		var now = new Date();
		rec.stop = now.getTime();
		rec.diff = rec.stop - rec.start;
		console.log(string, rec.diff);
	}
};

window.onload = function(){

var arrayPointList = [];

timer.start('Create array');
for(var i = 0; i < 1000000; i+=1){
	arrayPointList.push([
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]);
}
timer.stop('Create array');

var obPointList = [];


timer.start('Create object');
for(var i = 0; i < 1000000; i+=1){
	obPointList.push(new Vec3([
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]));
}
timer.stop('Create object');


var getP3Scaled = function(p3,scale){
	//return p3;
	return [p3[0]*scale[0], p3[1]*scale[1], p3[2]*scale[2]];;
}

timer.start('Scale array');
var transformedArrayList = [];
for(var i = 0; i < arrayPointList.length; i+=1){
	transformedArrayList.push(getP3Scaled(arrayPointList[i],[
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]));
}
timer.stop('Scale array');


timer.start('Scale object');
var transformedObList = [];
for(var i = 0; i < obPointList.length; i+=1){
	transformedObList.push(obPointList[i].clone().mul([
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]));
}
timer.stop('Scale object');





var rotatePoint = function(x,y,rad){
	var length = Math.sqrt((x * x) + (y * y));
	var currentRad = Math.atan2(x,y);
	x = Math.sin(currentRad - rad) * length;
	y = Math.cos(currentRad - rad) * length;
	var output = [x,y];
	return output;
}
var totalRotationCalculations = 0;
var getP3Rotated = function(p3,rot,order){
	//return p3;
	var order = order || [0,1,2];
	var x = p3[0], y = p3[1], z = p3[2];
	var xr = rot[0], yr = rot[1], zr = rot[2];
	//Alright, here's something interesting.
	//The order you rotate the dimentions is IMPORTANT to rotation animation!
	//Here's my quick, no math approach to applying that.
	for(var r = 0; r < order.length; r += 1){
		if(order[r] === 0){
			//x...
			if(xr !== 0){
				var zy = rotatePoint(z,y,xr);
				z = zy[0];
				y = zy[1];
				totalRotationCalculations += 1;
			}
		}else if(order[r] === 1){
			//y...
			if(yr !== 0){
				var xz = rotatePoint(x,z,yr);
				x = xz[0];
				z = xz[1];
				totalRotationCalculations += 1;
			}
		}else if(order[r] === 2){
			//z...
			if(zr !== 0){
				var xy = rotatePoint(x,y,zr);
				x = xy[0];
				y = xy[1];
				totalRotationCalculations += 1;
			}
		}else{
			throw 'up';
		}
	}
	return [x,y,z];
}


timer.start('Rotate array');
for(var i = 0; i < transformedArrayList.length; i+=1){
	transformedArrayList[i] = getP3Rotated(transformedArrayList[i],[
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]);
}
timer.stop('Rotate array');


timer.start('Rotate object');
for(var i = 0; i < transformedObList.length; i+=1){
	transformedObList[i].rotate([
		(Math.random() * 100),
		(Math.random() * 100),
		(Math.random() * 100)
	]);
}
timer.stop('Rotate object');

};