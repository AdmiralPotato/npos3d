var subset = function (ob, string) {
	var output = {}, propList = string.split(','), i;
	for (i = 0; i < propList.length; i += 1) {
		output[propList[i]] = ob[propList[i]];
	}
	return output;
};

var get_type = function (input) {
	if (input === null) {
		return "[object Null]"; // special case
	}
	return Object.prototype.toString.call(input);
};

var initVal = function () { //A function designed to compensate for lack of function (value = default)
	var i;
	if (arguments.length < 1) {
		throw 'ur doin it wrong. initVal function requires > 1 arguments';
	}
	for (i = 0; i < arguments.length; i += 1) {
		if (arguments[i] !== undefined && arguments[i] !== null) {
			return arguments[i];
		}
	}
	return arguments[i];
};

var debug = false;
var displayDebug = function (input) {
	var output = [], keyName;
	if (get_type(input).match(/Number/i)) {
		output.push(input + '<br>');
	} else {
		output.push(input.constructor.name + '<br>');
	}
	for (keyName in input) {
		if (input.hasOwnProperty(keyName)) {
			output.push(keyName.toString() + ': ' + get_type(input[keyName]) + ' - ' + input[keyName] + '<br>');
		}
	}
	if (!debug) {
		debug = document.createElement('pre');
		debug.style.display = 'block';
		debug.style.position = 'fixed';
		debug.style.top = 0;
		debug.style.left = 0;
		debug.style.zIndex = 9001;
		debug.style.fontFamily = 'monospace';
		debug.style.fontSize = '10px';
		debug.style.lineHeight = '7px';
		debug.style.color = 'hsl(' + (Math.random() * 360) + ',100%,50%)';
		document.body.appendChild(debug);
	}
	debug.innerHTML += output.join("\n");
};
var clearDebug = function () {
	debug.innerHTML = '';
};

var NPos3d = NPos3d || {
	pi: Math.PI,
	tau: (Math.PI * 2),
	deg: (Math.PI / 180),
	sin: Math.sin,
	cos: Math.cos,
	square: function (num) {
		return num * num;
	},
	//--------------------------------
	//Some basic boundary / collission testing maths.
	//--------------------------------
	//I'm sure this function causes lag. Please use the 2D and 3D speciffic versions instead.
	pointInNBounds: function (point, bounds) {
		var d;
		//Works for 2D, 3D, and nD! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//d stands for dimention
		for (d = 0; d < point.length; d += 1) {
			//dimentional value check
			if (point[d] < bounds[0][d] || point[d] > bounds[1][d]) {
				return false;
			}
		}
		return true;
	},
	pointIn2dBounds: function (point, bounds) {
		//Works for 2D! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//dimentional value check
		if (
			point[0] < bounds[0][0] || point[0] > bounds[1][0] ||
			point[1] < bounds[0][1] || point[1] > bounds[1][1]
		) {
			return false;
		}
		return true;
	},
	pointIn3dBounds: function (point, bounds) {
		//Works for 3D! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//dimentional value check
		if (
			point[0] < bounds[0][0] || point[0] > bounds[1][0] ||
			point[1] < bounds[0][1] || point[1] > bounds[1][1] ||
			point[2] < bounds[0][2] || point[2] > bounds[1][2]
		) {
			return false;
		}
		return true;
	},
	addSceneToChildren: function aSTC(scene, children){
		var len = children.length, i, o;
		for (i = 0; i < len; i += 1) {
			o = children[i];
			o.scene = scene;
			if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
				aSTC(scene, o.children);
			}
		}
	},
	addFunc: function (o) {
		var t = this, len, i;
		if(t.children === undefined){
			t.children = [];
		}else{
			//It is never a good idea to allow an item to be a child of a parent more than once.
			//Trust me.
			len = t.children.length;
			for (i = 0; i < len; i += 1) {
				if (t.children[i] === o) {
					return false;
				}
			}
		}
		if(o.parent){ //If the object already has a parent, remove it from that one first.
			o.parent.remove(o);
		}
		if(t.childrenToBeAdded === undefined){
			t.childrenToBeAdded = [];
		}
		t.childrenToBeAdded.push(o);
		return true;
	},
	removeFunc: function (o) {
		if (o.onRemove !== undefined) {
			o.onRemove();
		}
		o.parent = false;
		o.expired = true;
		return false;
	},
	destroyFunc: function () {
		var t = this;
		if (t.parent) {
			return t.parent.remove(t);
		}
		return false;
	}
};



NPos3d.Scene = function (args) {
	var t = this, args = args || {};
	if (t === window) {
		throw 'You must use the `new` keyword when calling a Constructor Method!';
	}

	t.debug = args.debug || false;
	t.mpos = {x: 0,y: 0};
	t.camera = args.camera || new NPos3d.Camera();
	t.frameRate = args.frameRate || 30;
	t.pixelScale = args.pixelScale || 1;
	t.globalCompositeOperation = args.globalCompositeOperation || 'source-over';
	t.backgroundColor = args.backgroundColor || 'transparent';
	t.strokeStyle = args.strokeStyle || '#fff';
	t.fillStyle = args.fillStyle || '#fff';
	t.lineWidth = args.lineWidth || undefined;
	t.fullScreen = args.fullScreen === undefined || args.fullScreen === true ? true : false;

	t.isMobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));

	t.canvasId = args.canvasId || 'canvas';
	t.canvas = args.canvas || document.createElement('canvas');
	t.canvas.id = t.canvasId;
	t.c = t.canvas.getContext('2d');
	if (args.canvas === undefined) {
		document.body.appendChild(t.canvas);
	}
	if (t.fullScreen) {
		t.canvas.parentNode.style.margin = 0;
		t.canvas.parentNode.style.padding = 0;
		t.canvas.style.display = 'block';
		t.canvas.style.top = 0;
		t.canvas.style.left = 0;
		t.canvas.style.zIndex = args.zIndex ||-10;
		if (t.isMobile) {
			t.checkWindow = function () {
				t.w = Math.ceil(window.outerWidth / t.pixelScale);
				t.h = Math.ceil(window.outerHeight / t.pixelScale);
			};
		} else {
			t.checkWindow = function () {
				t.w = Math.ceil(window.innerWidth / t.pixelScale);
				t.h = Math.ceil(window.innerHeight / t.pixelScale);
			};
		}
	} else {
		t.checkWindow = function () {
			t.w = Math.ceil(t.canvas.width / t.pixelScale);
			t.h = Math.ceil(t.canvas.height / t.pixelScale);
		};
		if (t.canvas.width == '') { t.canvas.width = args.width || 512; }
		if (t.canvas.height == '') { t.canvas.height = args.height || 384; }
	}
	if (t.pixelscale !== 1) {
		t.canvas.style.imageRendering = '-moz-crisp-edges';
		t.canvas.style.imageRendering = '-webkit-optimize-contrast';
		//reference: http://stackoverflow.com/questions/10525107/html5-canvas-image-scaling-issue
		t.c.imageSmoothingEnabled = false;
		t.c.mozImageSmoothingEnabled = false;
		t.c.webkitImageSmoothingEnabled = false;
	}else if (!isMobile) {
		t.canvas.style.position = 'fixed';
	}
	//console.log(isMobile);

	t.checkWindow();
	t.resize();
	t.setInvertedCameraPos();

	//t.canvas.style.width=  t.w + 'px';
	//t.canvas.style.height= t.h + 'px';
	t.canvas.style.backgroundColor = '#000';
	t.cursorPosition = args.canvas !== undefined ? 'absolute' : 'relative';
	t.mouseHandler = function (e) {
		//console.dir(e);
		//displayDebug(e.target);
		if(e.target === t.canvas || e.target === window){
			e.preventDefault();
		}
		var canvasOffset = {x: 0,y: 0};
		if (!t.fullscreen) {
			var offset = t.canvas.getBoundingClientRect();
			canvasOffset.x = offset.left;
			canvasOffset.y = offset.top;
		}
		if (e.touches && e.touches.length) {
			//t.mpos.x = e.touches[0].screenX - t.cx;
			//t.mpos.y = e.touches[0].screenY - t.cy;
			if(t.cursorPosition === 'absolute'){
				t.mpos.x = Math.ceil(((e.touches[0].screenX - canvasOffset.x) / t.pixelScale) - t.cx);
				t.mpos.y = Math.ceil(((e.touches[0].screenY - canvasOffset.y) / t.pixelScale) - t.cy);
			}else{
				t.mpos.x = Math.ceil((e.touches[0].screenX / t.pixelScale) - t.cx);
				t.mpos.y = Math.ceil((e.touches[0].screenY / t.pixelScale) - t.cy);
			}
		} else {
			//t.mpos.x = e.pageX - t.cx;
			//t.mpos.y = e.pageY - t.cy;
			if(t.cursorPosition === 'absolute'){
				t.mpos.x = Math.ceil(((e.clientX - canvasOffset.x) / t.pixelScale) - t.cx);
				t.mpos.y = Math.ceil(((e.clientY - canvasOffset.y) / t.pixelScale) - t.cy);
			}else{
				t.mpos.x = Math.ceil((e.clientX / t.pixelScale) - t.cx);
				t.mpos.y = Math.ceil((e.clientY / t.pixelScale) - t.cy);
			}
		}
	}
	window.addEventListener('mousemove',t.mouseHandler,false);
	window.addEventListener('touchstart',t.mouseHandler,false);
	window.addEventListener('touchmove',t.mouseHandler,false);
	//window.addEventListener('touchend',t.mouseHandler,false);
	//console.log(window.innerHeight, window.outerHeight);

	t.children = [];

	t.start();
	t.globalize();
	return this;
};

NPos3d.Scene.prototype = {
	isScene: true,
	globalize: function () {
		//Because it's a pain to have to reference too much. I'll unpack my tools so I can get to work.
		window.pi = NPos3d.pi;
		window.tau = NPos3d.tau;
		window.deg = NPos3d.deg;
		window.sin = NPos3d.sin;
		window.cos = NPos3d.cos;
		window.square = NPos3d.square;
	},
	resize: function () {
		var t = this;
		t.cx = Math.floor(t.w/2);
		t.cy = Math.floor(t.h/2);
		t.mpos.x = 0;
		t.mpos.y = 0;
		t.canvas.width = t.w;
		t.canvas.height = t.h;
		if (t.pixelScale !== 1) {
			t.canvas.style.width = t.w*t.pixelScale + 'px';
			t.canvas.style.height = t.h*t.pixelScale + 'px';
		}
		t.lw = t.w;
		t.lh = t.h;
		//Normally, this function would end here,
		//but both FireFox and "Web" for Android refuse to allow me to display pages pixel-per-pixel in any sane way.
		//This does 3 things -
		//	1: Make the canvas very, very large, which kills performance
		//	2: Make the render output SUCK
		//	3: HULK SMASH!!!
		var meta = document.getElementById('vp');
		if (!meta) {
			var meta = document.createElement('meta');
			meta.setAttribute('name','viewport');
			meta.setAttribute('id','vp');
		}
		if (meta && meta.parentNode === document.head) {
			document.head.removeChild(meta);
		}
		//var oldSize = subset(window,'innerHeight,innerWidth,outerWidth,outerHeight');
		meta.setAttribute('content','width=' + t.w + ', user-scalable=0, target-densityDpi=device-dpi');
		document.head.appendChild(meta);
		if(t.isMobile){
			window.scrollTo(0,1);
		}
		//window.scrollTo(0,0);
		//displayDebug(oldSize);
	},
	setInvertedCameraPos: function () {
		//There is a really, really good reason to have this function.
		//If you add the position of the camera to all objects in the scene,
		//they display offset in the direction -oposite- of where they would
		//had you moved a physical camera - so it is better to add negative
		//camera position each frame. Also, if the rendering methods all use
		//t.invertedCameraPos as it is defined at the start of each frame,
		//you won't have rendering issues caused by objects within the scene
		//changing the position of the camera and some objects rending at the
		//old position with others rendering in the new position.
		this.invertedCameraPos = [
			-this.camera.pos[0],
			-this.camera.pos[1],
			-this.camera.pos[2]
		];
	},
	updateRecursively: function uR(o,a,i){
		var i, child;
			if(!o.isScene){
				o.update();
			}
		if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
			for (i = 0; i < o.children.length; i += 1) {
				child = o.children[i];
				uR(child, o);
			}
		}
	},
	removeExpiredChildrenRecursively: function rECR(o){
		var len, i, child;
		if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
			len = o.children.length;
			for (i = len - 1; i >= 0; i -= 1) {
				child = o.children[i];
				rECR(child);
				if(child.expired){
					o.children.splice(i,1);
					child.expired = false;
					child.scene = false;
				}
			}
		}
	},
	addNewChildrenRecursively: function aNCR(o){
		var i, child, newChild, scene = false;
		if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
			for (i = 0; i < o.children.length; i += 1) {
				child = o.children[i];
				aNCR(child);
			}
		}
		if (o.isScene === true) {
			scene = o;
		} else {
			scene = o.scene;
		}
		//This bit is nifty: thanks to scene = false at init,
		//if a node is parented to another node with no scene,
		//then all child nodes have their scene removed as well.
		if(o.childrenToBeAdded !== undefined && o.childrenToBeAdded.length !== undefined && o.childrenToBeAdded.length > 0){
			for (i = 0; i < o.childrenToBeAdded.length; i += 1) {
				newChild = o.childrenToBeAdded[i];
				newChild.expired = false;
				o.children.push(newChild);
				newChild.parent = o;
				newChild.scene = scene;
				if (newChild.onAdd !== undefined) {
					newChild.onAdd();
				}
			}
			delete o.childrenToBeAdded;
		}
	},
	update: function () {
		try{
			var t = this, i, len = t.children.length, child;
			t.checkWindow();
			if (t.w !== t.lw || t.h !== t.lh) {t.resize();}
			t.setInvertedCameraPos();

			if (t.debug) {
				var newSize = subset(window,'innerHeight,innerWidth,outerWidth,outerHeight');
				clearDebug();
				displayDebug(newSize);
			}

			if(t.backgroundColor === 'transparent'){
				t.c.clearRect(0,0,t.w,t.h);
			}else{
				t.c.fillStyle = t.backgroundColor;
				t.c.fillRect(0,0,t.w,t.h);
			}
			t.c.save();
			t.c.translate(t.cx, t.cy);
			t.children.sort(t.sortByObjectZDepth);

			t.updateRecursively(t,'SCENE UPDATE!!!');
			t.removeExpiredChildrenRecursively(t);
			t.addNewChildrenRecursively(t);

			t.c.restore();
		} catch(e){
			t.stop();
			console.log(e, e.stack, t);
		}
	},
	start: function () {
		var t = this;
		t.interval = setInterval(function () {t.update();}, 1000 / t.frameRate);
	},
	stop: function () {
		clearInterval(this.interval);
	},
	sortByObjectZDepth: function (a,b) {return a.pos[2] - b.pos[2];},
//--------------------------------
//This is where all of the 3D and math happens
//--------------------------------
	project3Dto2D: function (p3) {
		//return {x: p3[0],y: p3[1]}; Orthographic!
		var scale = this.camera.fov/(this.camera.fov + -p3[2]), p2 = {};
		p2.x = (p3[0] * scale);
		p2.y = (p3[1] * scale);
		p2.scale = scale;
		p2.color = p3[3] || false;
		return p2;
	},
	getVecLength2D: function (x,y) {
		return Math.sqrt(NPos3d.square(x) + NPos3d.square(y));
	},
	getSquareVecLength2D: function (x,y) {
		return NPos3d.square(x) + NPos3d.square(y);
	},
	getRelativeAngle3D: function (p3) { //DO NOT try to optomize out the use of sqrt in this function!!!
		var topAngle =  Math.atan2(p3[0], p3[1]);
		var sideAngle = tau - Math.atan2(p3[2], this.getVecLength2D(p3[0],p3[1]));
		return [sideAngle,0,-topAngle];
	},
	pointAt: function (o,endPos) {
		var posDiff = [
			endPos[0] - o.pos[0],
			endPos[1] - o.pos[1],
			endPos[2] - o.pos[2]
		];
		o.rot = this.getRelativeAngle3D(posDiff);
	},
	rotatePoint: function (x,y,rot) {
		var length = Math.sqrt((x * x) + (y * y));
		var currentRot = Math.atan2(x,y);
		x = Math.sin(currentRot - rot) * length;
		y = Math.cos(currentRot - rot) * length;
		var output = [x,y];
		return output;
	},
	totalRotationCalculations: 0,
	getP3Rotated: function (p3,rot,order) {
		//return p3;
		var t = this, x = p3[0], y = p3[1], z = p3[2], xr = rot[0], yr = rot[1], zr = rot[2];
		//Alright, here's something interesting.
		//The order you rotate the dimensions is IMPORTANT to rotation animation!
		//Here's my quick, no math approach to applying that.
		for (var r = 0; r < order.length; r += 1) {
			if (order[r] === 0) {
				//x...
				if (xr !== 0) {
					var zy = t.rotatePoint(z,y,xr);
					z = zy[0];
					y = zy[1];
					t.totalRotationCalculations += 1;
				}
			}else if (order[r] === 1) {
				//y...
				if (yr !== 0) {
					var xz = t.rotatePoint(x,z,yr);
					x = xz[0];
					z = xz[1];
					t.totalRotationCalculations += 1;
				}
			}else if (order[r] === 2) {
				//z...
				if (zr !== 0) {
					var xy = t.rotatePoint(x,y,zr);
					x = xy[0];
					y = xy[1];
					t.totalRotationCalculations += 1;
				}
			} else {
				throw 'up';
			}
		}
		return [x,y,z];
	},
	getP3Scaled: function (p3,scale) {
		//return p3;
		return [p3[0]*scale[0], p3[1]*scale[1], p3[2]*scale[2]];;
	},
	//I used to use a function in here named nGetOffsets that would do the same thing, looping through dimentions.
	//It was TERRIBLY inefficient at this task, so I replaced it in favor of nDimention specific versions.
	getP3Offset: function (p3,offset) {
		//an efficient hack to quickly add an offset to a 3D point
		return [p3[0]+offset[0], p3[1]+offset[1], p3[2]+offset[2]];
	},
	getP2Offset: function (p2,offset) {
		//an efficient hack to quickly add an offset to a 2D point
		return [p2[0]+offset[0], p2[1]+offset[1]];
	},
	getP3String: function (p3) {
		return 'x: '+p3[0]+' y: '+p3[1]+' z: '+p3[2];
	},
	nGetBounds: function (pointList) {
		//Works for 2D, 3D, and nD!
		var min = [];
		var max = [];
		var p = pointList[0];
		for (var d = 0; d < p.length; d += 1) {
			min[d] = p[d]; max[d] = p[d];
		}
		for (var i = 1; i < pointList.length; i += 1) {
			var p = pointList[i];
			//d stands for dimention
			for (var d = 0; d < p.length; d += 1) {
				if (p[d] < min[d]) {min[d] = p[d];}
				else if (p[d] > max[d]) {max[d] = p[d];}
			}
		}
		return [min,max];
	},
	makeBBCubeFromTwoPoints: function (bbMinOffset,bbMaxOffset) {
		return [
			[bbMinOffset[0],bbMinOffset[1],bbMaxOffset[2]],
			[bbMaxOffset[0],bbMinOffset[1],bbMaxOffset[2]],
			[bbMaxOffset[0],bbMaxOffset[1],bbMaxOffset[2]],
			[bbMinOffset[0],bbMaxOffset[1],bbMaxOffset[2]],
			[bbMinOffset[0],bbMinOffset[1],bbMinOffset[2]],
			[bbMaxOffset[0],bbMinOffset[1],bbMinOffset[2]],
			[bbMaxOffset[0],bbMaxOffset[1],bbMinOffset[2]],
			[bbMinOffset[0],bbMaxOffset[1],bbMinOffset[2]]
		];
	},
	lineRenderLoop: function (o) {
		var t = this, c = t.c;
		var computedPointList = [];
		for (var i = 0; i < o.shape.points.length; i += 1) {
			//to make sure I'm not messing with the original array...
			var point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = t.getP3Offset(point, o.pos);
			point = t.getP3Offset(point, t.invertedCameraPos);
			computedPointList[i] = point;
		}
		for (var i = 0; i < o.transformedLineCache.length; i += 1) {
			//offset the points by the object's position
			if (o.explosionFrame === undefined) {
				var p3a = computedPointList[o.transformedLineCache[i][0]];
				var p3b = computedPointList[o.transformedLineCache[i][1]];
			} else {
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
				p3a = t.getP3Offset(t.getP3Offset(t3a, o.pos), t.invertedCameraPos);
				p3b = t.getP3Offset(t.getP3Offset(t3b, o.pos), t.invertedCameraPos);
			}


			//if the depths of the first and second point in the line are not behind the camera...
			//and the depths of the first and second point in the line are closer than the far plane...
			if (p3a[2] < t.camera.clipNear &&
			   p3b[2] < t.camera.clipNear &&
			   p3a[2] > t.camera.clipFar &&
			   p3b[2] > t.camera.clipFar) {

				var p0 = t.project3Dto2D(p3a);
				var p1 = t.project3Dto2D(p3b);
				//                   min        max
				var screenBounds = [[-t.cx, -t.cy],[t.cx, t.cy]];
				var p0InBounds = NPos3d.pointIn2dBounds([p0.x,p0.y],screenBounds);
				var p1InBounds = NPos3d.pointIn2dBounds([p1.x,p1.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if (p0InBounds || p1InBounds) {
					c.beginPath();
					c.moveTo(p0.x,p0.y);
					c.lineTo(p1.x,p1.y);
					c.strokeStyle= o.transformedLineCache[i][2] || o.shape.color || o.color || t.strokeStyle;
					c.lineWidth= o.lineWidth || o.parent.lineWidth || 1;
					c.lineCap='round';
					c.stroke();
				}
			}
		}
	},
	recurseForInheritedProperties:function rfip(o, propName){
		if(o[propName] !== undefined){
			return o[propName];
		}
		if(o.parent){
			return rfip(o.parent, propName);
		}
	},
	drawLines: function (o) {
		var t = this;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if (o.lastRotString !== t.getP3String(o.rot) || o.lastScaleString !== t.getP3String(o.scale)) {
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for (var i = 0; i < o.shape.points.length; i += 1) {
				//to make sure I'm not messing with the original array...
				var point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = t.getP3Scaled(point, o.scale);
				point = t.getP3Rotated(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}

			//Now with Z-Depth sorting for each line on an object!
			o.transformedLineCache = []; //Fixes a bug earlier where I -assumed- that transformedLineCache was already an array
			for (var i = 0; i < o.shape.lines.length; i += 1) {
				//to make sure I'm not messing with the original array...
				if (o.shape.lines[i][2] !== undefined) {
					var line = [o.shape.lines[i][0],o.shape.lines[i][1],o.shape.lines[i][2]];
				} else {
					var line = [o.shape.lines[i][0],o.shape.lines[i][1]];
				}
				o.transformedLineCache[i] = line;
			}
			//Fixing a nasty strange bug that happened if you sorted a one key array
			if (o.transformedLineCache.length > 1) {
				o.transformedLineCache.sort(function (a,b) {
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

		if (o.renderAlways) {
			t.lineRenderLoop(o);
			return;
		}

		var bbMinOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[0], o.pos), t.invertedCameraPos);
		var bbMaxOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[1], o.pos), t.invertedCameraPos);

		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if (bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear) {
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			var bbCube = t.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			var bbOffscreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for (var i = 0; i < bbCube.length && bbOffscreen; i += 1) {
				bbp = t.project3Dto2D(bbCube[i]);
				if (bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy) {
					bbOffscreen = false;
				}
			}
			if (!bbOffscreen) {
				t.lineRenderLoop(o);
			}
		}
	},
	drawPoints: function (o) {
		var t = this;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if (o.lastRotString !== t.getP3String(o.rot) || o.lastScaleString !== t.getP3String(o.scale)) {
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for (var i = 0; i < o.shape.points.length; i += 1) {
				//to make sure I'm not messing with the original array...
				var point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = t.getP3Scaled(point, o.scale);
				point = t.getP3Rotated(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}
			//Now with Z-Depth sorting for each point on an object!
			if (o.transformedPointCache.length > 1) {
				o.transformedPointCache.sort(function (a,b) {
					return a[2] - b[2];
				});
			}
			//end z-sorting for the points

			o.boundingBox = t.nGetBounds(o.transformedPointCache);
			o.lastScaleString = t.getP3String(o.scale);
			o.lastRotString = t.getP3String(o.rot);
		}

		if (o.renderAlways) {
			t.pointRenderLoop(o);
			return;
		}

		var bbMinOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[0], o.pos), t.invertedCameraPos);
		var bbMaxOffset = t.getP3Offset(t.getP3Offset(o.boundingBox[1], o.pos), t.invertedCameraPos);

		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if (bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear) {
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			var bbCube = t.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			var bbOffscreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for (var i = 0; i < bbCube.length && bbOffscreen; i += 1) {
				bbp = t.project3Dto2D(bbCube[i]);
				if (bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy) {
					bbOffscreen = false;
				}
			}
			if (!bbOffscreen) {
				t.pointRenderLoop(o);
			}
		}
	},
	pointRenderLoop: function (o) {
		var t = this, c = t.c;
		var computedPointList = [];
		for (var i = 0; i < o.shape.points.length; i += 1) {
			//to make sure I'm not messing with the original array...
			var point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = t.getP3Offset(point, o.pos);
			point = t.getP3Offset(point, t.invertedCameraPos);
			point[3] = o.transformedPointCache[i][3] || false;//Point Color Preservation - no need to offset or rotate it
			computedPointList[i] = point;
		}
		for (var i = 0; i < o.transformedPointCache.length; i += 1) {
			//offset the points by the object's position
			var p3a = computedPointList[i];
			//if the depth of the point is not behind the camera...
			//and the depth of the point is closer than the far plane...
			if (p3a[2] < t.camera.clipNear && p3a[2] > t.camera.clipFar) {
				var p0 = t.project3Dto2D(p3a);
				//                   min        max
				var screenBounds = [[-t.cx, -t.cy],[t.cx, t.cy]];
				var p0InBounds = NPos3d.pointIn2dBounds([p0.x,p0.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if (p0InBounds) {
					//console.log(p0.color);
					c.moveTo(p0.x,p0.y);
					c.beginPath();
					c.arc(p0.x,p0.y,(p0.scale * o.pointScale),0,tau,false);
					if (o.pointStyle === 'fill') {
						c.fillStyle= p0.color || o.shape.color || o.color || t.fillStyle;
						c.fill();
					}else if (o.pointStyle === 'stroke') {
						c.strokeStyle= p0.color || o.shape.color || o.color || t.strokeStyle;
						c.lineWidth= o.lineWidth || o.scene.lineWidth || 1;
						c.lineCap='round';
						c.stroke();
					}
				}
			}
		}
	},
	add: NPos3d.addFunc,
	remove: NPos3d.removeFunc
};

NPos3d.Camera = function (args) {
	var t = this, args = args || {};
	if (t===window) {
		throw 'You must use the `new` keyword when calling a Constructor Method!';
	}
	//Field Of View; Important!
	t.fov = args.fov || 550;
	t.clipNear = args.clipNear || t.fov; //This line is also VERY important! Never have the clipNear less than the FOV!
	t.clipFar = args.clipFar || -1000;
	t.pos = args.pos || [0,0,0];
	t.rot = args.rot || [0,0,0];//Totally not implemented yet.
};

NPos3d.Geom = {};

//The only reason this isn't with the rest of the shapes is because I need to use it inside the prototype of ob3D
NPos3d.Geom.cube = {
	points: [
		[ 10, 10, 10],
		[ 10, 10,-10],
		[ 10,-10, 10],
		[ 10,-10,-10],
		[-10, 10, 10],
		[-10, 10,-10],
		[-10,-10, 10],
		[-10,-10,-10]
	],
	lines: [[0,1],[2,3],[4,5],[6,7],[3,1],[2,0],[7,5],[6,4],[5,1],[7,3],[4,0],[6,2]]
};

NPos3d.blessWith3DBase = function (o,args) {
	o.pos = args.pos || [0,0,0];
	o.rot = args.rot || [0,0,0];
	o.rotOrder = args.rotOrder || o.rotOrder || [0,1,2];
	o.scale = args.scale || o.scale || [1,1,1];
	o.lastScaleString = false;
	o.lastRotString = false;
	o.transformedPointCache = [];
	o.transformedLineCache = [];
	o.boundingBox = [[0,0,0],[0,0,0]];
	o.shape = args.shape || o.shape;
	o.color = args.color || o.color ||undefined;
	o.renderAlways = args.renderAlways || o.renderAlways || false;
	o.renderStyle = args.renderStyle || o.renderStyle || 'lines';//points, both
	o.pointScale = args.pointScale || o.pointScale || 2;
	o.pointStyle = args.pointStyle || o.pointStyle || 'fill';//stroke
	o.lineWidth = args.lineWidth || undefined;
	o.scene = false; //An object should know which scene it's in, if it would like to be destroyed.
	if (o.renderStyle === 'lines') {
		o.render = function () {
			o.scene.drawLines(o);
		}
	}else if (o.renderStyle === 'points') {
		o.render = function () {
			o.scene.drawPoints(o);
		}
	}else if (o.renderStyle === 'both') {
		o.render = function () {
			o.scene.drawLines(o);
			o.scene.drawPoints(o);
		}
	} else {
		throw 'Invalid renderStyle specified: ' + o.renderStyle;
	}
	o.expired = false;
	o.add = NPos3d.addFunc;
	o.remove = NPos3d.removeFunc;
	o.destroy = NPos3d.destroyFunc;
};

NPos3d.Ob3D = function (args) {
	var args = args || {};
	if (this === window) {throw 'You must use the `new` keyword when calling a Constructor Method!';}
	if (arguments.length > 1) {throw 'ob3D expects only one param, an object with the named arguments.';}
	NPos3d.blessWith3DBase(this,args);
	return this;
};

NPos3d.Ob3D.prototype = {
	shape: NPos3d.Geom.cube,
	update: function () {
		this.render();
	}
};
