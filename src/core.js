var subset = function(ob, string){
	output = {};
	var propList = string.split(',');
	for(var i = 0; i < propList.length; i += 1){
		output[propList[i]] = ob[propList[i]];
	}
	return output;
}
var get_type = function(input){
	if(input===null)return "[object Null]"; // special case
	return Object.prototype.toString.call(input);
}

var debug = false;
var displayDebug = function(input,ownProperty){
	if(get_type(input).match(/Number/i)){
		var output = input + '<br>\n';
	}else{
		var output = input.constructor.name + '<br>\n';
	}
	for(var i in input){
		if(ownProperty === undefined || input.hasOwnProperty(i)){
			output += i.toString() + ':' + get_type(input[i]) + ' - ' + input[i] + '<br>\n';
		}
	}
	if(!debug){
		debug = document.createElement('pre');
		debug.style.display='block';
		debug.style.position='fixed';
		debug.style.top=0;
		debug.style.left=0;
		debug.style.zIndex=9001;
		debug.style.fontFamily='monospace';
		debug.style.fontSize='10px';
		debug.style.lineHeight='7px';
		debug.style.color='hsl(' + (Math.random() * 360) + ',100%,50%)';
		document.body.appendChild(debug);
	}
	debug.innerHTML += output;
}
var clearDebug = function(){
	debug.innerHTML = '';
}

var NPos3d = NPos3d || {
	pi:Math.PI,
	tau:(Math.PI * 2),
	deg:(Math.PI / 180),
	sin:Math.sin,
	cos:Math.cos,
	//--------------------------------
	//Some basic boundary / collission testing maths.
	//--------------------------------
	//I'm sure this function causes lag. Please use the 2D and 3D speciffic versions instead.
	pointInNBounds:function (point,bounds){
		//Works for 2D, 3D, and nD! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//d stands for dimention
		for(var d = 0; d < point.length; d += 1){
			//dimentional value check
			if(point[d] < bounds[0][d] || point[d] > bounds[1][d]){
				return false;
			}
		}
		return true;
	},
	pointIn2dBounds:function (point,bounds){
		//Works for 2D! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//dimentional value check
		if(
			point[0] < bounds[0][0] || point[0] > bounds[1][0] ||
			point[1] < bounds[0][1] || point[1] > bounds[1][1]
		){
			return false;
		}
		return true;
	},
	pointIn3dBounds:function (point,bounds){
		//Works for 3D! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//dimentional value check
		if(
			point[0] < bounds[0][0] || point[0] > bounds[1][0] ||
			point[1] < bounds[0][1] || point[1] > bounds[1][1] ||
			point[2] < bounds[0][2] || point[2] > bounds[1][2]
		){
			return false;
		}
		return true;
	}
};


NPos3d.Scene = function(args){
	var t = this;
	if(t===window){throw 'You must use the `new` keyword when calling a Constructor Method!';}
	var args = args || {};

	t.mpos = {x:0,y:0};
	t.camera = new NPos3d.Camera();
	t.frameRate = args.frameRate || 30;

	var isMobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
	if(isMobile){
		t.checkWindow = function(){t.w = window.outerWidth;t.h = window.outerHeight;};
	}
	else{
		t.checkWindow = function(){t.w = window.innerWidth;t.h = window.innerHeight;};
	}

	t.canvasId = args.canvasId || 'canvas';
	t.canvas = document.createElement('canvas');
	t.canvas.id = t.canvasId;
	document.body.appendChild(t.canvas);
	t.canvas.parentNode.style.margin=0;
	t.canvas.parentNode.style.padding=0;
	t.canvas.style.display='block';
	t.canvas.style.position='fixed';
	t.canvas.style.top=0;
	t.canvas.style.left=0;
	t.canvas.style.zIndex=-10;

	t.checkWindow();
	t.resize();

	//t.canvas.style.width=  t.w + 'px';
	//t.canvas.style.height= t.h + 'px';
	t.canvas.style.backgroundColor='#000';
	t.c = t.canvas.getContext('2d');

	t.mouseHandler = function(e){
		//console.dir(e);
		e.preventDefault();
		if(e.touches && e.touches.length){
			t.mpos.x = e.touches[0].screenX - t.cx;
			t.mpos.y = e.touches[0].screenY - t.cy;
		}else{
			t.mpos.x = e.pageX - t.cx;
			t.mpos.y = e.pageY - t.cy;
		}
	}
	window.addEventListener('mousemove',t.mouseHandler,false);
	window.addEventListener('touchstart',t.mouseHandler,false);
	window.addEventListener('touchmove',t.mouseHandler,false);
	//window.addEventListener('touchend',t.mouseHandler,false);
	//console.log(window.innerHeight, window.outerHeight);

	t.rQ = [];//RenderQueue
	t.cro = 0;//CurrentlyRenderingObject
	t.update = function(){
		t.checkWindow();
		if(t.w !== t.lw || t.h !== t.lh){t.resize();}

		var newSize = subset(window,'innerHeight,innerWidth,outerWidth,outerHeight');
		newSize.bodyHeight = document.body.style.height;
		clearDebug();
		displayDebug(newSize);

		t.c.clearRect(0,0,t.w,t.h);
		t.c.save();
		//c.strokeStyle = '#fff';
		t.c.translate(t.cx,t.cy);
		t.rQ.sort(t.sortByObjectZDepth);

		for(t.cro = 0; t.cro < t.rQ.length; t.cro += 1){
			t.rQ[t.cro].update(t);
		}

		t.c.restore();
	}

	t.interval = setInterval(t.update,1000/t.framerate);
	
	t.globalize();
	return this;
}

NPos3d.Scene.prototype={
	globalize:function(){
		//Because it's a pain to have to reference too much.
		window.pi = NPos3d.pi;
		window.tau = NPos3d.tau;
		window.deg = NPos3d.deg;
		window.sin = NPos3d.sin;
		window.cos = NPos3d.cos;
	},
	resize:function(){
		var t = this;
		t.cx=Math.floor(t.w/2);
		t.cy=Math.floor(t.h/2);
		t.mpos.x = 0;
		t.mpos.y = 0;
		t.canvas.width=t.w;
		t.canvas.height=t.h;
		t.lw=t.w;
		t.lh=t.h;
		//Normally, this function would end here,
		//but both FireFox and "Web" for Android refuse to allow me to display pages pixel-per-pixel in any sane way.
		//This does 3 things -
		//	1: Make the canvas very, very large, which kills performance
		//	2: Make the render output SUCK
		//	3: HULK SMASH!!!
		var meta = document.getElementById('vp');
		if(!meta){
			var meta = document.createElement('meta');
			meta.setAttribute('name','viewport');
			meta.setAttribute('id','vp');
		}
		if(meta && meta.parentNode === document.head){
			document.head.removeChild(meta);
		}
		//var oldSize = subset(window,'innerHeight,innerWidth,outerWidth,outerHeight');
		meta.setAttribute('content','width=' + t.w + ', user-scalable=0, target-densityDpi=device-dpi');
		document.head.appendChild(meta);
		document.body.style.height = t.h.toString() + 'px';
		window.scrollTo(0,1);
		//window.scrollTo(0,0);
		//displayDebug(oldSize);
		//displayDebug(document.body.style);
	},
	sortByObjectZDepth:function(a,b){return a.pos[2] - b.pos[2];},
//--------------------------------
//This is where all of the 3D and math happens
//--------------------------------
	project3Dto2D:function(p3){
		//return {x:p3[0],y:p3[1]}; Orthographic!
		var scale = this.camera.fov/(this.camera.fov + -p3[2]), p2 = {};
		p2.x = (p3[0] * scale);
		p2.y = (p3[1] * scale);
		p2.scale = scale;
		p2.color = p3[3] || false;
		return p2;
	},
	square:function(num){return num * num;},
	getRelativeAngle3d:function(p3){ //DO NOT try to optomize out the use of sqrt in this function!!!
		var topAngle =  Math.atan2(p3[0], p3[1]);
		var sideAngle = tau - Math.atan2(p3[2], Math.sqrt(this.square(p3[0]) + this.square(p3[1])));
		return [sideAngle,0,-topAngle];
	},
	pointAt:function(o,endPos){
		var posDiff = [
			endPos[0] - o.pos[0],
			endPos[1] - o.pos[1],
			endPos[2] - o.pos[2]
		];
		o.rot = this.getRelativeAngle3d(posDiff);
	},
	rotatePoint:function(x,y,rad){
		var length = Math.sqrt((x * x) + (y * y));
		var currentRad = Math.atan2(x,y);
		x = Math.sin(currentRad - rad) * length;
		y = Math.cos(currentRad - rad) * length;
		var output = [x,y];
		return output;
	},
	totalRotationCalculations:0,
	getP3Rotated:function(p3,rot,order){
		var t = this;
		//return p3;
		var x = p3[0], y = p3[1], z = p3[2];
		var xr = rot[0], yr = rot[1], zr = rot[2];
		//Alright, here's something interesting.
		//The order you rotate the dimentions is IMPORTANT to rotation animation!
		//Here's my quick, no math approach to applying that.
		for(var r = 0; r < order.length; r += 1){
			if(order[r] === 0){
				//x...
				if(xr !== 0){
					var zy = t.rotatePoint(z,y,xr);
					z = zy[0];
					y = zy[1];
					t.totalRotationCalculations += 1;
				}
			}else if(order[r] === 1){
				//y...
				if(yr !== 0){
					var xz = t.rotatePoint(x,z,yr);
					x = xz[0];
					z = xz[1];
					t.totalRotationCalculations += 1;
				}
			}else if(order[r] === 2){
				//z...
				if(zr !== 0){
					var xy = t.rotatePoint(x,y,zr);
					x = xy[0];
					y = xy[1];
					t.totalRotationCalculations += 1;
				}
			}else{
				throw 'up';
			}
		}
		return [x,y,z];
	},
	getP3Scaled:function(p3,scale){
		//return p3;
		return [p3[0]*scale[0], p3[1]*scale[1], p3[2]*scale[2]];;
	},
	//I used to use a function in here named nGetOffsets that would do the same thing, looping through dimentions.
	//It was TERRIBLY inefficient at this task, so I replaced it in favor of nDimention specific versions.
	getP3Offset:function(p3,offset){
		//an efficient hack to quickly add an offset to a 3D point
		return [p3[0]+offset[0], p3[1]+offset[1], p3[2]+offset[2]];
	},
	getP2Offset:function(p2,offset){
		//an efficient hack to quickly add an offset to a 2D point
		return [p2[0]+offset[0], p2[1]+offset[1]];
	},
	getP3String:function(p3){
		return 'x:'+p3[0]+' y:'+p3[1]+' z:'+p3[2];
	},
	nGetBounds:function(pointList){
		//Works for 2D, 3D, and nD!
		var min = [];
		var max = [];
		var p = pointList[0];
		for(var d = 0; d < p.length; d += 1){
			min[d] = p[d]; max[d] = p[d];
		}
		for(var i = 1; i < pointList.length; i += 1){
			var p = pointList[i];
			//d stands for dimention
			for(var d = 0; d < p.length; d += 1){
				if(p[d] < min[d]){min[d] = p[d];}
				else if(p[d] > max[d]){max[d] = p[d];}
			}
		}
		return [min,max];
	},
	makeBBCubeFromTwoPoints:function(bbMinOffset,bbMaxOffset){
		return [
			[bbMinOffset[0],bbMinOffset[1],bbMaxOffset[2]],
			[bbMaxOffset[0],bbMinOffset[1],bbMaxOffset[2]],
			[bbMaxOffset[0],bbMaxOffset[1],bbMaxOffset[2]],
			[bbMinOffset[0],bbMaxOffset[1],bbMaxOffset[2]],
			[bbMinOffset[0],bbMinOffset[1],bbMinOffset[2]],
			[bbMaxOffset[0],bbMinOffset[1],bbMinOffset[2]],
			[bbMaxOffset[0],bbMaxOffset[1],bbMinOffset[2]],
			[bbMinOffset[0],bbMaxOffset[1],bbMinOffset[2]],
		];
	},
	lineRenderLoop:function(o){
		var t = this, c = t.c;
		var computedPointList = [];
		for(var i = 0; i < o.shape.points.length; i += 1){
			//to make sure I'm not messing with the original array...
			var point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = t.getP3Offset(point, o.pos);
			point = t.getP3Offset(point, t.camera.pos);
			computedPointList[i] = point;
		}
		for(var i = 0; i < o.transformedLineCache.length; i += 1){
			//offset the points by the object's position
			if(o.explosionFrame === undefined){
				var p3a = computedPointList[o.transformedLineCache[i][0]];
				var p3b = computedPointList[o.transformedLineCache[i][1]];
			}else{
				//O great architect of all source that is far more elegant than that of my own,
				//please forgive me for the sins that I am about to commit with my limited remaining brain power... (6 AM)
				var t3a = o.transformedPointCache[o.transformedLineCache[i][0]];
				var t3b = o.transformedPointCache[o.transformedLineCache[i][1]];
				t3a = t.getP3Offset(t3a,[0,0,0]);
				t3b = t.getP3Offset(t3b,[0,0,0]);
				var lineCenter = [
					t3a[0] + ((t3b[0] - t3a[0]) /2),
					t3a[1] + ((t3b[1] - t3a[1]) /2),
					t3a[2] + ((t3b[2] - t3a[2]) /2)
				];
				var dir = Math.atan2( lineCenter[0], lineCenter[1]);
				var ofs = [Math.sin(dir) * o.explosionFrame*2,Math.cos(dir) * o.explosionFrame*2];
				//var ofs = [100,100];
				//var ofs = [1,2];
				t3a[0] = lineCenter[0] + ofs[0] + (Math.sin(o.explosionFrame*deg*10 + dir)*(t3a[0] - lineCenter[0]));
				t3a[1] = lineCenter[1] + ofs[1] + (Math.cos(o.explosionFrame*deg*10 + dir)*(t3a[1] - lineCenter[1]));
				t3b[0] = lineCenter[0] + ofs[0] + (Math.sin(o.explosionFrame*deg*10 + dir)*(t3b[0] - lineCenter[0]));
				t3b[1] = lineCenter[1] + ofs[1] + (Math.cos(o.explosionFrame*deg*10 + dir)*(t3b[1] - lineCenter[1]));
				t3a[2] = t3a[2] + (o.explosionFrame*2);
				t3b[2] = t3b[2] + (o.explosionFrame*2);
				p3a = t.getP3Offset(t.getP3Offset(t3a, o.pos), t.camera.pos);
				p3b = t.getP3Offset(t.getP3Offset(t3b, o.pos), t.camera.pos);
			}
	
	
			//if the depths of the first and second point in the line are not behind the camera...
			//and the depths of the first and second point in the line are closer than the far plane...
			if(p3a[2] < t.camera.clipNear &&
			   p3b[2] < t.camera.clipNear &&
			   p3a[2] > t.camera.clipFar &&
			   p3b[2] > t.camera.clipFar){
	
				var p0 = t.project3Dto2D(p3a);
				var p1 = t.project3Dto2D(p3b);
				//                   min        max
				var screenBounds = [[-t.cx, -t.cy],[t.cx, t.cy]];
				var p0InBounds = NPos3d.pointIn2dBounds([p0.x,p0.y],screenBounds);
				var p1InBounds = NPos3d.pointIn2dBounds([p1.x,p1.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if(p0InBounds || p1InBounds){
					c.beginPath();
					c.moveTo(p0.x,p0.y);
					c.lineTo(p1.x,p1.y);
					c.strokeStyle= o.transformedLineCache[i][2] || o.shape.color || '#fff';
					c.lineWidth=2;
					c.lineCap='round';
					c.stroke();
				}
			}
		}
	},
	drawLines:function(o){
		var t = this;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if(o.lastRotString !== t.getP3String(o.rot) || o.lastScaleString !== t.getP3String(o.scale)){
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for(var i = 0; i < o.shape.points.length; i += 1){
				//to make sure I'm not messing with the original array...
				var point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = t.getP3Scaled(point, o.scale);
				point = t.getP3Rotated(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}

			//Now with Z-Depth sorting for each line on an object!
			o.transformedLineCache = []; //Fixes a bug earlier where I -assumed- that transformedLineCache was already an array
			for(var i = 0; i < o.shape.lines.length; i += 1){
				//to make sure I'm not messing with the original array...
				if(o.shape.lines[i][2] !== undefined){
					var line = [o.shape.lines[i][0],o.shape.lines[i][1],o.shape.lines[i][2]];
				}else{
					var line = [o.shape.lines[i][0],o.shape.lines[i][1]];
				}
				o.transformedLineCache[i] = line;
			}
			//Fixing a nasty strange bug that happened if you sorted a one key array
			if(o.transformedLineCache.length > 1){
				o.transformedLineCache.sort(function(a,b) {
					var az = Math.min(
						o.transformedPointCache[a[0]][2],
						o.transformedPointCache[a[1]][2]
					);
					var bz = Math.min(
						o.transformedPointCache[b[0]][2],
						o.transformedPointCache[b[1]][2]
					);
					return az - bz;
				});
			}
			//end z-sorting for the lines

			o.boundingBox = t.nGetBounds(o.transformedPointCache);
			o.lastScaleString = t.getP3String(o.scale);
			o.lastRotString = t.getP3String(o.rot);
		}
	
		if(o.renderAlways){
			t.lineRenderLoop(o);
			return;
		}
	
		var bbMinOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[0], o.pos), t.camera.pos);
		var bbMaxOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[1], o.pos), t.camera.pos);
	
		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if(bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear){
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			var bbCube = t.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			var bbOffscreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for(var i = 0; i < bbCube.length && bbOffscreen; i += 1){
				bbp = t.project3Dto2D(bbCube[i]);
				if(bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy){
					bbOffscreen = false;
				}
			}
			if(!bbOffscreen){
				t.lineRenderLoop(o);
			}
		}
	},
	drawPoints:function(o){
		var t = this;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if(o.lastRotString !== t.getP3String(o.rot) || o.lastScaleString !== t.getP3String(o.scale)){
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for(var i = 0; i < o.shape.points.length; i += 1){
				//to make sure I'm not messing with the original array...
				var point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = t.getP3Scaled(point, o.scale);
				point = t.getP3Rotated(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}
			//Now with Z-Depth sorting for each point on an object!
			if(o.transformedPointCache.length > 1){
				o.transformedPointCache.sort(function(a,b) {
					return a[2] - b[2];
				});
			}
			//end z-sorting for the points

			o.boundingBox = t.nGetBounds(o.transformedPointCache);
			o.lastScaleString = t.getP3String(o.scale);
			o.lastRotString = t.getP3String(o.rot);
		}
	
		if(o.renderAlways){
			t.pointRenderLoop(o);
			return;
		}
	
		var bbMinOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[0], o.pos), t.camera.pos);
		var bbMaxOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[1], o.pos), t.camera.pos);
	
		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if(bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear){
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			var bbCube = t.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			var bbOffscreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for(var i = 0; i < bbCube.length && bbOffscreen; i += 1){
				bbp = t.project3Dto2D(bbCube[i]);
				if(bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy){
					bbOffscreen = false;
				}
			}
			if(!bbOffscreen){
				t.pointRenderLoop(o);
			}
		}
	},
	pointRenderLoop:function(o){
		var t = this, c = t.c;
		var computedPointList = [];
		for(var i = 0; i < o.shape.points.length; i += 1){
			//to make sure I'm not messing with the original array...
			var point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = t.getP3Offset(point, o.pos);
			point = t.getP3Offset(point, t.camera.pos);
			point[3] = o.transformedPointCache[i][3] || false;//Point Color Preservation - no need to offset or rotate it
			computedPointList[i] = point;
		}
		for(var i = 0; i < o.transformedPointCache.length; i += 1){
			//offset the points by the object's position
			var p3a = computedPointList[i];
			//if the depth of the point is not behind the camera...
			//and the depth of the point is closer than the far plane...
			if(p3a[2] < t.camera.clipNear && p3a[2] > t.camera.clipFar){
				var p0 = t.project3Dto2D(p3a);
				//                   min        max
				var screenBounds = [[-t.cx, -t.cy],[t.cx, t.cy]];
				var p0InBounds = NPos3d.pointIn2dBounds([p0.x,p0.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if(p0InBounds){
					//console.log(p0.color);
					c.moveTo(p0.x,p0.y);
					c.beginPath();
					c.arc(p0.x,p0.y,(p0.scale * o.pointScale),0,tau,false);
					if(o.pointStyle === 'fill'){
						c.fillStyle= p0.color || o.shape.color || '#fff';
						c.fill();
					}else if(o.pointStyle === 'stroke'){
						c.strokeStyle= p0.color || o.shape.color || '#fff';
						c.lineWidth=2;
						c.lineCap='round';
						c.stroke();
					}
				}
			}
		}
	},
	destroyFunc:function(){
		if(this === window){throw 'JIM TYPE ERROR';}
		for(var i = 0; i < rQ.length; i += 1){
			if(t.rQ[i] === this){
				t.rQ.splice(i,1);
				//I FOUND THE BLINKING FOR REAL THIS TIME!!!
				//console.log(cro,i);
				//If the object being removed from the render queue is positioned earlier than
				//the object that's currently being rendered, subtract 1 from the 'render state'
				//to compensate for the object being taken out, so on cro +=1 in the global
				//'update' loop, we don't skip a beat for that same render pass. Oh yeah!
				if(i <= t.cro ){
					t.cro -= 1;
				}
			}
		}
	}
};

NPos3d.Camera = function(args){
	var t = this;
	if(t===window){throw 'You must use the `new` keyword when calling a Constructor Method!';}
	var args = args || {};
	//Field Of View; Important!
	t.fov = args.fov || 550;
	t.clipNear = args.clipNear || t.fov; //This line is also VERY important! Never have the clipNear less than the FOV!
	t.clipFar = args.clipFar || -1000;
	t.pos = args.pos || [0,0,0];
	t.rot = args.rot || [0,0,0];//Totally not implemented yet.
}

NPos3d.Geom = {};

//The only reason this isn't with the rest of the shapes is because I need to use it inside the prototype of ob3D
NPos3d.Geom.cube = {
	color:'#999',
	points:[
		[ 10, 10, 10],
		[ 10, 10,-10],
		[ 10,-10, 10],
		[ 10,-10,-10],
		[-10, 10, 10],
		[-10, 10,-10],
		[-10,-10, 10],
		[-10,-10,-10]
	],
	lines:[[0,1],[2,3],[4,5],[6,7],[3,1],[2,0],[7,5],[6,4],[5,1],[7,3],[4,0],[6,2]],
};

NPos3d.blessWith3DBase = function(o,args){
	o.pos = args.pos || [0,0,0];
	o.rot = args.rot ||[0,0,0];
	o.rotOrder = args.rotOrder || [0,1,2];
	o.scale = args.scale || [1,1,1];
	o.lastScaleString = false;
	o.lastRotString = false;
	o.transformedPointCache = [];
	o.transformedLineCache = [];
	o.boundingBox = [[0,0,0],[0,0,0]];
	o.shape = args.shape || o.shape;
	o.renderAlways = args.renderAlways || false;
	o.renderStyle = args.renderStyle || 'lines';//points, both
	o.pointScale = args.pointScale || 2;
	o.pointStyle = args.pointStyle || 'fill';//stroke
	if(o.renderStyle === 'lines'){
		o.render = function(){
			s.drawLines(o);
		}
	}else if(o.renderStyle === 'points'){
		o.render = function(){
			s.drawPoints(o);
		}
	}else if(o.renderStyle === 'both'){
		o.render = function(){
			s.drawLines(o);
			s.drawPoints(o);
		}
	}else{
		throw 'Invalid renderStyle specified: ' + o.renderStyle;
	}
}
NPos3d.Ob3D = function(args){
	if(this === window){throw 'JIM TYPE ERROR';}
	if(arguments.length > 1){throw 'ob3D expects only one param, an object with the named arguments.';}
	var t = this;
	var args = args || {};
	NPos3d.blessWith3DBase(t,args);
	return this;
}
NPos3d.Ob3D.prototype = {
	shape: NPos3d.Geom.cube,
	update:function(s){
		this.render();
	},
	destroy:NPos3d.destroyFunc
};
