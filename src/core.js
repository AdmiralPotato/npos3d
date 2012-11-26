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

var debug;
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
	if(debug){
		debug.innerHTML = '';
	}
};

var NPos3d = NPos3d || {
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
	},
	renderFunc: function(){
		//This function should be assigned to objects in the scene which will be rendered;
		//Example: myObject.render = NPos3d.renderFunc;
		var t = this; //should be referring to the object being rendered
		if (t.renderStyle === 'lines') {
			t.scene.drawLines(t);
		}else if (t.renderStyle === 'points') {
			t.scene.drawPoints(t);
		}else if (t.renderStyle === 'both') {
			t.scene.drawLines(t);
			t.scene.drawPoints(t);
		} else {
			throw 'Invalid renderStyle specified: ' + t.renderStyle;
		}
	}
};

//Here lies almost anything related to trig/calc
NPos3d.Maths = {
	pi: Math.PI,
	tau: (Math.PI * 2),
	deg: (Math.PI / 180),
	sin: Math.sin,
	cos: Math.cos,
	square: function (num) {return num * num;},
	//--------------------------------
	//Some basic boundary / collission testing maths.
	//--------------------------------
	//I'm sure this function causes lag. Please use the 2D and 3D speciffic versions instead.
	pointInNBounds: function (point, bounds) {
		var d;
		//Works for 2D, 3D, and nD! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//d stands for dimension
		for (d = 0; d < point.length; d += 1) {
			//dimensional value check
			if (point[d] < bounds[0][d] || point[d] > bounds[1][d]) {
				return false;
			}
		}
		return true;
	},
	pointIn2dBounds: function (point, bounds) {
		//Works for 2D! Please, please feed in bounds generated like the line below.
		//var bounds = nGetBounds(pointList);
		//dimensional value check
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
		//dimensional value check
		if (
			point[0] < bounds[0][0] || point[0] > bounds[1][0] ||
				point[1] < bounds[0][1] || point[1] > bounds[1][1] ||
				point[2] < bounds[0][2] || point[2] > bounds[1][2]
			) {
			return false;
		}
		return true;
	},
	//--------------------------------
	//This is where all of the 3D and math happens
	//--------------------------------
	getSquareVecLength2D: function (x,y) {
		return NPos3d.Maths.square(x) + NPos3d.Maths.square(y);
	},
	getVecLength2D: function (x,y) {
		return Math.sqrt(NPos3d.Maths.getSquareVecLength2D(x,y));
	},
	getRelativeAngle3D: function (p3) { //DO NOT try to optomize out the use of sqrt in this function!!!
		var topAngle =  Math.atan2(p3[0], p3[1]);
		var sideAngle = tau - Math.atan2(p3[2], NPos3d.Maths.getVecLength2D(p3[0],p3[1]));
		return [sideAngle,0,-topAngle];
	},
	p3Add: function (a,b) {
		//an efficient hack to quickly add an offset to a 3D point
		return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
	},
	p3Sub: function(a,b){
		return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
	},
	pointAt: function (o,endPos) {
		var m = NPos3d.Maths, posDiff = m.p3Sub(endPos, o.pos);
		o.rot = m.getRelativeAngle3D(posDiff);
	},
	/*
	rotatePoint: function (x,y,rot) {
		var length = Math.sqrt((x * x) + (y * y));
		var currentRot = Math.atan2(x,y);
		x = Math.sin(currentRot - rot) * length;
		y = Math.cos(currentRot - rot) * length;
		return [x,y];
	},
	totalRotationCalculations: 0,
	p3RotateA: function (p3,rot,order) {
		//return p3;
		var m = NPos3d.Maths, x = p3[0], y = p3[1], z = p3[2], xr = rot[0], yr = rot[1], zr = rot[2];
		//Alright, here's something interesting.
		//The order you rotate the dimensions is IMPORTANT to rotation animation!
		//Here's my quick, no math approach to applying that.
		for (var r = 0; r < order.length; r += 1) {
			if (order[r] === 0) {
				//x...
				if (xr !== 0) {
					var zy = m.rotatePoint(z,y,xr);
					z = zy[0];
					y = zy[1];
					m.totalRotationCalculations += 1;
				}
			}else if (order[r] === 1) {
				//y...
				if (yr !== 0) {
					var xz = m.rotatePoint(x,z,yr);
					x = xz[0];
					z = xz[1];
					m.totalRotationCalculations += 1;
				}
			}else if (order[r] === 2) {
				//z...
				if (zr !== 0) {
					var xy = m.rotatePoint(x,y,zr);
					x = xy[0];
					y = xy[1];
					m.totalRotationCalculations += 1;
				}
			} else {
				throw 'up';
			}
		}
		return [x,y,z];
	},
	*/
	__matrix: [
		[[0,0,0],[0,0,0],[0,0,0]],
		[[0,0,0],[0,0,0],[0,0,0]],
		[[0,0,0],[0,0,0],[0,0,0]]
	],
	p3RotMatrix: function (r){
		var m = NPos3d.Maths,
			xc = 1,
			xs = 0,
			yc = 1,
			ys = 0,
			zc = 1,
			zs = 0;
		if(r[0] !== 0){
			xc = cos(r[0]),
			xs = sin(r[0]);
		}
		if(r[1] !== 0){
			yc = cos(r[1]),
			ys = sin(r[1]);
		}
		if(r[2] !== 0){
			zc = cos(r[2]),
			zs = sin(r[2]);
		}
		//using the same matrix repeatedly is a lot easier on the garbage collector

		m.__matrix[0][0][0] = 1, m.__matrix[0][0][1] = 0, m.__matrix[0][0][2] = 0,
		m.__matrix[0][1][0] = 0, m.__matrix[0][1][1] = xc, m.__matrix[0][1][2] = -xs,
		m.__matrix[0][2][0] = 0, m.__matrix[0][2][1] = xs, m.__matrix[0][2][2] = xc,

		m.__matrix[1][0][0] = yc, m.__matrix[1][0][1] = 0, m.__matrix[1][0][2] = ys,
		m.__matrix[1][1][0] = 0, m.__matrix[1][1][1] = 1, m.__matrix[1][1][2] = 0,
		m.__matrix[1][2][0] = -ys, m.__matrix[1][2][1] = 0, m.__matrix[1][2][2] = yc,

		m.__matrix[2][0][0] = zc, m.__matrix[2][0][1] = -zs, m.__matrix[2][0][2] = 0,
		m.__matrix[2][1][0] = zs, m.__matrix[2][1][1] = zc, m.__matrix[2][1][2] = 0,
		m.__matrix[2][2][0] = 0, m.__matrix[2][2][1] = 0, m.__matrix[2][2][2] = 1;
		return m.__matrix;
	},
	p3MatrixMultiply: function(point, rot, m, order) {
		var i, x, y, z, len = order.length,
			p = [point[0],point[1],point[2]]; //because point.slice() hurt performance quite a bit
		for(i = 0; i < 3; i += 1){ //allows for order to have more than 3 keys, if you feel exotic
			if(rot[order[i]] !== 0){ //only rotate if this axis is non-zero
				x = p[0], y = p[1], z = p[2];
				p[0] = (x * m[order[i]][0][0]) + (y * m[order[i]][0][1]) + (z * m[order[i]][0][2]);
				p[1] = (x * m[order[i]][1][0]) + (y * m[order[i]][1][1]) + (z * m[order[i]][1][2]);
				p[2] = (x * m[order[i]][2][0]) + (y * m[order[i]][2][1]) + (z * m[order[i]][2][2]);
			}
		}
		return p;
	},
	__lastRot: [0,0,0],
	p3Rotate: function (p3, rot, order){
		var m = NPos3d.Maths;
		if(m.__lastRot[0] !== rot[0] || m.__lastRot[1] !== rot[1] || m.__lastRot[2] !== rot[2]){
			m.__lastRot[0] = rot[0],
			m.__lastRot[1] = rot[1],
			m.__lastRot[2] = rot[2];
			m.p3RotMatrix(rot);
		}
		return m.p3MatrixMultiply(p3, rot, m.__matrix, order);
	},
	getP3Scaled: function (p3,scale) {
		//return p3;
		return [p3[0]*scale[0], p3[1]*scale[1], p3[2]*scale[2]];
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
		if(pointList.length < 1){return [[0,0,0],[0,0,0]];} //assume 3D if empty
		var min = [];
		var max = [];
		var p = pointList[0];
		for (var d = 0; d < p.length; d += 1) {
			min[d] = p[d]; max[d] = p[d];
		}
		for (var i = 1; i < pointList.length; i += 1) {
			var p = pointList[i];
			//d stands for dimension
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
	}
};


NPos3d.Scene = function (args) {
	var t = this, type = 'Scene';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};

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
	t.useWindowSize = (/nexus\s7/i.test(navigator.userAgent.toLowerCase()));

	t.canvasId = args.canvasId || 'canvas';
	t.existingCanvas = args.canvas !== undefined;
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
		if(args.zIndex !== undefined){
			t.canvas.style.zIndex = args.zIndex;
		}
		if (t.isMobile) {
			if(t.useWindowSize){
				t.checkWindow = function () {
					t.w = Math.ceil(window.screen.width / t.pixelScale);
					t.h = Math.ceil(window.screen.height / t.pixelScale);
				};
			} else {
				t.checkWindow = function () {
					t.w = Math.ceil(window.outerWidth / t.pixelScale);
					t.h = Math.ceil(window.outerHeight / t.pixelScale);
				};
			}
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
	if (t.pixelScale !== 1) {
		t.canvas.style.imageRendering = '-moz-crisp-edges';
		t.canvas.style.imageRendering = '-webkit-optimize-contrast';
		//reference: http://stackoverflow.com/questions/10525107/html5-canvas-image-scaling-issue
		t.c.imageSmoothingEnabled = false;
		t.c.mozImageSmoothingEnabled = false;
		t.c.webkitImageSmoothingEnabled = false;
	}
	if (!t.isMobile && !t.existingCanvas) {
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
		if (!t.fullScreen) {
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
	};
	window.addEventListener('mousemove',t.mouseHandler,false);
	window.addEventListener('touchstart',t.mouseHandler,false);
	window.addEventListener('touchmove',t.mouseHandler,false);
	//window.addEventListener('touchend',t.mouseHandler,false);
	//console.log(window.innerHeight, window.outerHeight);

	t.children = [];
	t.renderInstructionList = [];

	t.start();
	t.globalize();
	return this;
};

NPos3d.Scene.prototype = {
	type: 'Scene',
	isScene: true,
	globalize: function () {
		//Because it's a pain to have to reference too much. I'll unpack my tools so I can get to work.
		window.pi = NPos3d.Maths.pi;
		window.tau = NPos3d.Maths.tau;
		window.deg = NPos3d.Maths.deg;
		window.sin = NPos3d.Maths.sin;
		window.cos = NPos3d.Maths.cos;
		window.square = NPos3d.Maths.square;
	},
	resize: function () {
		var t = this, meta;
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
		meta = document.getElementById('vp');
		if (!meta) {
			meta = document.createElement('meta');
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
		//they display offset in the direction -opposite- of where they would
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
	project3Dto2D: function (p3) {
		//return {x: p3[0],y: p3[1]}; Orthographic!
		var scale = this.camera.fov/(this.camera.fov + -p3[2]), p2 = {};
		p2.x = (p3[0] * scale);
		p2.y = (p3[1] * scale);
		p2.scale = scale;
		p2.color = p3[3] || false;
		return p2;
	},
	updateRecursively: function updateRecursively(o){
		var i, child;
		if(!o.isScene){
			o.update();
		}
		if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
			for (i = 0; i < o.children.length; i += 1) {
				child = o.children[i];
				updateRecursively(child);
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
	addNewChildrenRecursively: function addNewChildrenRecursively(o){
		var i, child, newChild, scene = false;
		if(o.children !== undefined && o.children.length !== undefined && o.children.length > 0){
			for (i = 0; i < o.children.length; i += 1) {
				child = o.children[i];
				addNewChildrenRecursively(child);
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
	render: function(){
		var t = this, i, len, instruction;
		if(t.renderInstructionList !== undefined && t.renderInstructionList.length > 0){
			len = t.renderInstructionList.length;
			for(i = 0; i < len; i += 1){
				instruction = t.renderInstructionList[i];
				instruction.method(t.c,instruction.args);
			}
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
				newSize.screenSizeWidth = window.screen.width;
				newSize.screenSizeHeight = window.screen.height;
				newSize.documentElementClientWidth = document.documentElement.clientWidth;
				newSize.documentElementClientHeight = document.documentElement.clientHeight;
				//newSize.navigator = navigator.userAgent;
				clearDebug();
				displayDebug(newSize);
			}

			t.renderInstructionList = []; //the render methods on each object are supposed to populate this array
			t.updateRecursively(t,'SCENE UPDATE!!!');
			t.addNewChildrenRecursively(t);
			t.removeExpiredChildrenRecursively(t);

			if(t.backgroundColor === 'transparent'){
				t.c.clearRect(0,0,t.w,t.h);
			}else{
				t.c.fillStyle = t.backgroundColor;
				t.c.fillRect(0,0,t.w,t.h);
			}
			t.c.save();
			t.c.translate(t.cx, t.cy);
			t.renderInstructionList.sort(t.sortRenderInstructionByZDepth);
			t.render();
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
	sortRenderInstructionByZDepth: function (a,b) {return a.z - b.z;},
	recurseForInheritedProperties:function rfip(o, propName){
		if(o[propName] !== undefined){
			return o[propName];
		}
		if(o.parent){
			return rfip(o.parent, propName);
		}
	},
	drawLine: function(c,o){
		c.beginPath();
		c.moveTo(o.a.x,o.a.y);
		c.lineTo(o.b.x,o.b.y);
		if(c.strokeStyle !== o.color){c.strokeStyle = o.color;}
		if(c.lineWidth !== o.lineWidth){c.lineWidth = o.lineWidth;}
		if(c.lineCap !== 'round'){c.lineCap = 'round';}
		c.stroke();
	},
	drawCircle: function(c,o){
		var scale = o.pos.scale * o.pointScale;
		if(scale >= 0){
			c.moveTo(o.pos.x, o.pos.y);
			c.beginPath();
			c.arc(o.pos.x,o.pos.y,scale,0,tau,false);
			if (o.pointStyle === 'fill') {
				if(c.fillStyle !== o.color){c.fillStyle = o.color}
				c.fill();
			}else if (o.pointStyle === 'stroke') {
				if(c.strokeStyle !== o.color){c.strokeStyle = o.color;}
				if(c.lineWidth !== o.lineWidth){c.lineWidth = o.lineWidth;}
				if(c.lineCap !== 'round'){c.lineCap = 'round';}
				c.stroke();
			}
		}
	},
	lineRenderLoop: function (o) {
		var t = this, m = NPos3d.Maths, computedPointList = [], i, point, p3a, p3b, t3a, t3b;
		for (i = 0; i < o.shape.points.length; i += 1) {
			//to make sure I'm not messing with the original array...
			point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = m.p3Add(point, o.pos);
			point = m.p3Add(point, t.invertedCameraPos);
			computedPointList[i] = point;
		}
		for (i = 0; i < o.shape.lines.length; i += 1) {
			//offset the points by the object's position
			p3a = computedPointList[o.shape.lines[i][0]];
			p3b = computedPointList[o.shape.lines[i][1]];

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
				var p0InBounds = m.pointIn2dBounds([p0.x,p0.y],screenBounds);
				var p1InBounds = m.pointIn2dBounds([p1.x,p1.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if (p0InBounds || p1InBounds) {
					t.renderInstructionList.push({
						method: t.drawLine,
						args: {
							a: p0,
							b: p1,
							color: o.shape.lines[i][2] || o.shape.color || o.color || t.strokeStyle,
							lineWidth: o.lineWidth || o.parent.lineWidth || t.lineWidth || 1
						},
						z: Math.max(p3a[2], p3b[2])
					});
				}
			}
		}
	},
	drawLines: function (o) {
		var t = this, m = NPos3d.Maths, i, point, bbCube, bbMinOffset, bbMaxOffset, bbOffScreen, bbp;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if (o.lastRotString !== m.getP3String(o.rot) || o.lastScaleString !== m.getP3String(o.scale)) {
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for (i = 0; i < o.shape.points.length; i += 1) {
				//to make sure I'm not messing with the original array...
				point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = m.getP3Scaled(point, o.scale);
				point = m.p3Rotate(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}

			o.boundingBox = m.nGetBounds(o.transformedPointCache);
			o.lastScaleString = m.getP3String(o.scale);
			o.lastRotString = m.getP3String(o.rot);
		}

		if (o.renderAlways) {
			t.lineRenderLoop(o);
			return;
		}

		bbMinOffset = m.p3Add(m.p3Add(o.boundingBox[0], o.pos), t.invertedCameraPos);
		bbMaxOffset = m.p3Add(m.p3Add(o.boundingBox[1], o.pos), t.invertedCameraPos);

		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if (bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear) {
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			bbCube = m.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			bbOffScreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for (i = 0; i < bbCube.length && bbOffScreen; i += 1) {
				bbp = t.project3Dto2D(bbCube[i]);
				if (bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy) {
					bbOffScreen = false;
				}
			}
			if (!bbOffScreen) {
				t.lineRenderLoop(o);
			}
		}
	},
	drawPoints: function (o) {
		var t = this, m = NPos3d.Maths, i, point, bbMinOffset, bbMaxOffset, bbCube, bbOffScreen, bbp;
		//I see no reason to check whether the rotation/scale is different between processing each point,
		//so I'll just do that once per frame and have a loop just for rotating the points.
		if (o.lastRotString !== m.getP3String(o.rot) || o.lastScaleString !== m.getP3String(o.scale)) {
			//console.log(o.lastRotString);
			o.transformedPointCache = [];
			for (i = 0; i < o.shape.points.length; i += 1) {
				//to make sure I'm not messing with the original array...
				point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
				point = m.getP3Scaled(point, o.scale);
				point = m.p3Rotate(point, o.rot, o.rotOrder);
				point[3] = o.shape.points[i][3] || false;//Point Color Preservation - no need to offset or rotate it
				o.transformedPointCache[i] = point;
			}

			o.boundingBox = m.nGetBounds(o.transformedPointCache);
			o.lastScaleString = m.getP3String(o.scale);
			o.lastRotString = m.getP3String(o.rot);
		}

		if (o.renderAlways) {
			t.pointRenderLoop(o);
			return;
		}

		bbMinOffset = m.p3Add(m.p3Add(o.boundingBox[0], o.pos), t.invertedCameraPos);
		bbMaxOffset = m.p3Add(m.p3Add(o.boundingBox[1], o.pos), t.invertedCameraPos);

		//Checking to see if any part of the bounding box is in front on the camera and closer than the far plane before bothering to do anything else...
		if (bbMaxOffset[2] > t.camera.clipFar && bbMinOffset[2] < t.camera.clipNear && bbMaxOffset[2] > t.camera.clipFar && bbMaxOffset[2] < t.camera.clipNear) {
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			bbCube = m.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			bbOffScreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for (i = 0; i < bbCube.length && bbOffScreen; i += 1) {
				bbp = t.project3Dto2D(bbCube[i]);
				if (bbp.x < t.cx && bbp.x > -t.cx && bbp.y < t.cy && bbp.y > -t.cy) {
					bbOffScreen = false;
				}
			}
			if (!bbOffScreen) {
				t.pointRenderLoop(o);
			}
		}
	},
	pointRenderLoop: function (o) {
		var t = this, m = NPos3d.Maths, computedPointList = [], i, point, p3a, p0, screenBounds, circleArgs;
		for (i = 0; i < o.shape.points.length; i += 1) {
			//to make sure I'm not messing with the original array...
			point = [o.transformedPointCache[i][0],o.transformedPointCache[i][1],o.transformedPointCache[i][2]];
			point = m.p3Add(point, o.pos);
			point = m.p3Add(point, t.invertedCameraPos);
			point[3] = o.transformedPointCache[i][3] || false;//Point Color Preservation - no need to offset or rotate it
			computedPointList[i] = point;
		}
		for (i = 0; i < o.transformedPointCache.length; i += 1) {
			//offset the points by the object's position
			p3a = computedPointList[i];
			//if the depth of the point is not behind the camera...
			//and the depth of the point is closer than the far plane...
			if (p3a[2] < t.camera.clipNear && p3a[2] > t.camera.clipFar) {
				p0 = t.project3Dto2D(p3a);
				//                   min        max
				screenBounds = [[-t.cx, -t.cy],[t.cx, t.cy]];
				var p0InBounds = m.pointIn2dBounds([p0.x,p0.y],screenBounds);
				//If the line is completely off screen, do not bother rendering it.
				if (p0InBounds) {
					//console.log(p0.color);
					circleArgs = {
						pos: p0,
						pointScale: o.pointScale,
						pointStyle: o.pointStyle
					};
					if (o.pointStyle === 'fill') {
						circleArgs.color = p0.color || o.shape.color || o.color || t.fillStyle;
					}else if (o.pointStyle === 'stroke') {
						circleArgs.color = p0.color || o.shape.color || o.color || t.strokeStyle;
						circleArgs.lineWidth = o.lineWidth || o.scene.lineWidth || 1;
					}
					t.renderInstructionList.push({
						method: t.drawCircle,
						args: circleArgs,
						z: p3a[2]
					});

				}
			}
		}
	},

	add: NPos3d.addFunc,
	remove: NPos3d.removeFunc
};

NPos3d.Camera = function (args) {
	var t = this, type = 'Camera';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	//Field Of View; Important!
	t.fov = args.fov || 550;
	t.clipNear = args.clipNear || t.fov; //This line is also VERY important! Never have the clipNear less than the FOV!
	t.clipFar = args.clipFar || -1000;
	t.pos = args.pos || [0,0,0];
	t.rot = args.rot || [0,0,0];//Totally not implemented yet.
};
NPos3d.Camera.prototype = {
	type: 'Camera'
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
	o.boundingBox = [[0,0,0],[0,0,0]];
	o.shape = args.shape || o.shape;
	o.color = args.color || o.color ||undefined;
	o.renderAlways = args.renderAlways || o.renderAlways || false;
	o.renderStyle = args.renderStyle || o.renderStyle || 'lines';//points, both
	o.pointScale = args.pointScale || o.pointScale || 2;
	o.pointStyle = args.pointStyle || o.pointStyle || 'fill';//stroke
	o.lineWidth = args.lineWidth || undefined;
	o.scene = false; //An object should know which scene it's in, if it would like to be destroyed.

	o.expired = false;
	o.add = NPos3d.addFunc;
	o.remove = NPos3d.removeFunc;
	o.destroy = NPos3d.destroyFunc;
	o.render = NPos3d.renderFunc;
};

NPos3d.Ob3D = function (args) {
	var t = this, type = 'Ob3D';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	if (arguments.length > 1) {throw 'Ob3D expects only one argument, an object with the named configuration values.';}
	NPos3d.blessWith3DBase(t,args);
	return this;
};

NPos3d.Ob3D.prototype = {
	type: 'Ob3D',
	shape: NPos3d.Geom.cube,
	update: function () {
		this.render();
	}
};
