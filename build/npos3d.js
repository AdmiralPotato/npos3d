var NPos3d = NPos3d || {
	addFunc: function (o) {
		var t = this, len, i;
		if(o.parent){ //If the object already has a parent, remove it from that one first.
			o.parent.remove(o);
		}
		if(t.children === undefined){
			t.children = [];
		} else {
			//It is never a good idea to allow an item to be a child of a parent more than once.
			//Trust me.
			len = t.children.length;
			for (i = 0; i < len; i += 1) {
				if (t.children[i] === o) {
					return false;
				}
			}
		}
		if(t.childrenToBeAdded === undefined){
			t.childrenToBeAdded = [];
		} else {
			//Check here too, in case it was added multiple times per frame.
			len = t.childrenToBeAdded.length;
			for (i = 0; i < len; i += 1) {
				if (t.childrenToBeAdded[i] === o) {
					return false;
				}
			}
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
		t.scene.updateMatrices(t);
		if(!t.shape || !t.shape.points || !t.shape.points.length){
			t.transformedPointCache.length = 0;
		} else {
			t.scene.updateTransformedPointCache(t);
			//if there are no points, there is nothing to render with these methods!
			if(t.transformedPointCache.length > 0){
				if (t.renderStyle === 'both' || t.renderStyle === 'lines') {
					if(
						//I can't render a line if I don't have at least 2 points and 1 line.
						t.transformedPointCache.length > 1 &&
						t.shape.lines !== undefined &&
						typeof t.shape.lines.length === 'number' &&
						t.shape.lines.length > 0
					) {
						t.scene.drawLines(t);
					}
				}
				if (t.renderStyle === 'both' || t.renderStyle === 'points') {
					t.scene.drawPoints(t);
				}
				if(t.renderStyle !== 'both' && t.renderStyle !== 'lines' && t.renderStyle !== 'points') {
					throw 'Invalid renderStyle specified: ' + t.renderStyle;
				}
			}
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
	getRelativeAngle3D: function (p3) { //DO NOT try to optimize out the use of Math.sqrt in this function!!!
		var topAngle =  Math.atan2(p3[1], p3[0]),
			length = NPos3d.Maths.getVecLength2D(p3[0], p3[1]),
			sideAngle = -Math.atan2(p3[2], length);
		return [ 0, sideAngle, topAngle];
	},
	p3Add: function (a, b, outputPoint) {
		var o = outputPoint || [];
		o[0] = a[0] + b[0];
		o[1] = a[1] + b[1];
		o[2] = a[2] + b[2];
		o[3] = a[3]; //preserve point color
		return o;
	},
	p3Sub: function (a, b, outputPoint) {
		var o = outputPoint || [];
		o[0] = a[0] - b[0];
		o[1] = a[1] - b[1];
		o[2] = a[2] - b[2];
		o[3] = a[3]; //preserve point color
		return o;
	},
	pointAt: function (o, endPos) {
		var m = NPos3d.Maths,
			posDiff = m.p3Sub(endPos, o.gPos);
		//works only for this rotOrder at the moment
		if(o.rotOrder !== [2,1,0]){
			o.rotOrder = [2,1,0];
		}
		o.rot = m.getRelativeAngle3D(posDiff);
	},
	__mat4Identity: [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
	],
	makeMat4: function() {
		return this.__mat4Identity.slice();
	},
	mat3ToMat4Translation: [
		[0,1,2],
		[4,5,6],
		[8,9,10]
	],
	rotOrders: {
			  /* i, j, k, parity */
		'0,1,2':[0, 1, 2, 0], /* XYZ */
		'0,2,1':[0, 2, 1, 1], /* XZY */
		'1,0,2':[1, 0, 2, 1], /* YXZ */
		'1,2,0':[1, 2, 0, 0], /* YZX */
		'2,0,1':[2, 0, 1, 0], /* ZXY */
		'2,1,0':[2, 1, 0, 1]  /* ZYX */
	},
	//The below function mostly converted from Blender source (so much love for team Blender),
	//plus a little redundancy reduction if no rotation or same as last rotation
	//Original function was named: eulO_to_mat3 - Construct 3x3 matrix from Euler angles (in radians).
	//http://projects.blender.org/scm/viewvc.php/trunk/blender/source/blender/blenlib/intern/math_rotation.c?view=markup&root=bf-blender
	eulerToMat4: function(euler, order, outputMatrix) {
		var m = this,
			o = outputMatrix || m.makeMat4(),
			M = m.mat3ToMat4Translation,
			eulerString = euler.toString(),
			orderString = order.toString(),
			R = m.rotOrders[orderString],
			i = R[0],
			j = R[1],
			k = R[2],
			parity = R[3],
			ti, tj, th, ci, cj, ch, si, sj, sh, cc, cs, sc, ss;
		if(o.euler !== eulerString && o.rotOrder !== orderString) {
			o.euler = eulerString;
			o.order = orderString;
			if(eulerString === '0,0,0'){ //if no rotation, do no work and just return an identity matrix
				o[00] = 1,
				o[01] = 0,
				o[02] = 0,
				o[04] = 0,
				o[05] = 1,
				o[06] = 0,
				o[08] = 0,
				o[09] = 0,
				o[10] = 1;
			} else {
				//below here is all of the Blender magic
				//ti, th, tj are all inverted for NPos3d purposes
				if (parity) {
					ti = euler[i];
					tj = euler[j];
					th = euler[k];
				}
				else {
					ti = -euler[i];
					tj = -euler[j];
					th = -euler[k];
				}

				ci = m.cos(ti);
				cj = m.cos(tj);
				ch = m.cos(th);
				si = m.sin(ti);
				sj = m.sin(tj);
				sh = m.sin(th);

				cc = ci * ch;
				cs = ci * sh;
				sc = si * ch;
				ss = si * sh;

				o[M[i][i]] = cj * ch;
				o[M[j][i]] = sj * sc - cs;
				o[M[k][i]] = sj * cc + ss;
				o[M[i][j]] = cj * sh;
				o[M[j][j]] = sj * ss + cc;
				o[M[k][j]] = sj * cs - sc;
				o[M[i][k]] = -sj;
				o[M[j][k]] = cj * si;
				o[M[k][k]] = cj * ci;
			}
		}
		return o;
	},
	mat4Set: function(a, b) { // essentially `a = b`
		a[00] = b[00], a[01] = b[01], a[02] = b[02], a[03] = b[03],
		a[04] = b[04], a[05] = b[05], a[06] = b[06], a[07] = b[07],
		a[08] = b[08], a[09] = b[09], a[10] = b[10], a[11] = b[11],
		a[12] = b[12], a[13] = b[13], a[14] = b[14], a[15] = b[15],
		a.euler = b.euler, a.order = b.order;
		return a;
	},
	mat4Mul: function(a, b, outputMatrix) {
		var a00=a[00],a01=a[01],a02=a[02],a03=a[03],a04=a[04],a05=a[05],a06=a[06],a07=a[07],
			a08=a[08],a09=a[09],a10=a[10],a11=a[11],a12=a[12],a13=a[13],a14=a[14],a15=a[15],
			b00=b[00],b01=b[01],b02=b[02],b03=b[03],b04=b[04],b05=b[05],b06=b[06],b07=b[07],
			b08=b[08],b09=b[09],b10=b[10],b11=b[11],b12=b[12],b13=b[13],b14=b[14],b15=b[15],
			o = outputMatrix || [];
		//performance testing this approach versus`o[00] = b[01] * a[01] ...`
		//on 10 million points indicated that this is a lot faster
		o[00] = b00 * a00 + b01 * a04 + b02 * a08 + b03 * a12,
		o[01] = b00 * a01 + b01 * a05 + b02 * a09 + b03 * a13,
		o[02] = b00 * a02 + b01 * a06 + b02 * a10 + b03 * a14,
		o[03] = b00 * a03 + b01 * a07 + b02 * a11 + b03 * a15,
		o[04] = b04 * a00 + b05 * a04 + b06 * a08 + b07 * a12,
		o[05] = b04 * a01 + b05 * a05 + b06 * a09 + b07 * a13,
		o[06] = b04 * a02 + b05 * a06 + b06 * a10 + b07 * a14,
		o[07] = b04 * a03 + b05 * a07 + b06 * a11 + b07 * a15,
		o[08] = b08 * a00 + b09 * a04 + b10 * a08 + b11 * a12,
		o[09] = b08 * a01 + b09 * a05 + b10 * a09 + b11 * a13,
		o[10] = b08 * a02 + b09 * a06 + b10 * a10 + b11 * a14,
		o[11] = b08 * a03 + b09 * a07 + b10 * a11 + b11 * a15,
		o[12] = b12 * a00 + b13 * a04 + b14 * a08 + b15 * a12,
		o[13] = b12 * a01 + b13 * a05 + b14 * a09 + b15 * a13,
		o[14] = b12 * a02 + b13 * a06 + b14 * a10 + b15 * a14,
		o[15] = b12 * a03 + b13 * a07 + b14 * a11 + b15 * a15;
		return o;
	},
	mat4P3Translate: function (m, v, outputMatrix) {
		var o = outputMatrix || this.makeMat4(),
			aX = m[03],
			aY = m[07],
			aZ = m[11],
			x = v[0],
			y = v[1],
			z = v[2];
		o[03] = aX + x,
		o[07] = aY + y,
		o[11] = aZ + z;
		return o;
	},
	mat4P3Scale: function (m, v, outputMatrix) { //scales both rotation and translation
		var o = outputMatrix || this.makeMat4(),
			x = v[0],
			y = v[1],
			z = v[2],
			a00 = m[00],
			a01 = m[01],
			a02 = m[02],
			a03 = m[03],
			a04 = m[04],
			a05 = m[05],
			a06 = m[06],
			a07 = m[07],
			a08 = m[08],
			a09 = m[09],
			a10 = m[10],
			a11 = m[11];
		o[00] = a00 * x,
		o[01] = a01 * x,
		o[02] = a02 * x,
		o[03] = a03 * x,
		o[04] = a04 * y,
		o[05] = a05 * y,
		o[06] = a06 * y,
		o[07] = a07 * y,
		o[08] = a08 * z,
		o[09] = a09 * z,
		o[10] = a10 * z,
		o[11] = a11 * z;
		return o;
	},
	p3Mat4Mul: function(v, m, outputPoint) {
		var o = outputPoint || [],
			x = v[0],
			y = v[1],
			z = v[2],
			color = v[3] || false; //Point Color Preservation - no need to offset or rotate it
		o[0] = (x * m[00]) + (y * m[01]) + (z * m[02]) + m[03];
		o[1] = (x * m[04]) + (y * m[05]) + (z * m[06]) + m[07];
		o[2] = (x * m[08]) + (y * m[09]) + (z * m[10]) + m[11];
		//o[3] = (x * m[12]) + (y * m[13]) + (z * m[14]) + (w * m[15]);
		o[3] = color;
		return o;
	},
	__matrix: false,
	//Probably performance hazardous but Human friendly - use only sparingly.
	p3Rotate: function (p3, rot, order){
		var m = NPos3d.Maths;
		if(!m.__matrix){
			m.__matrix = m.makeMat4();
		}
		m.eulerToMat4(rot, order, m.__matrix);
		return m.p3Mat4Mul(p3, m.__matrix);
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

NPos3d.Utils = {
	subset: function (ob, string) {
		var output = {}, propList = string.split(','), i;
		for (i = 0; i < propList.length; i += 1) {
			output[propList[i]] = ob[propList[i]];
		}
		return output;
	},
	initVal: function () { //A function designed to compensate for lack of function (value = default)
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
	},
	get_type: function (input) {
		if (input === null) {
			return "[object Null]"; // special case
		}
		return Object.prototype.toString.call(input);
	},
	displayDebug: function (input) {
		var u = NPos3d.Utils, output = [], keyName;
		if (u.get_type(input).match(/Number/i)) {
			output.push(input + '<br>');
		} else {
			output.push(input.constructor.name + '<br>');
		}
		for (keyName in input) {
			if (input.hasOwnProperty(keyName)) {
				output.push(keyName.toString() + ': ' + u.get_type(input[keyName]) + ' - ' + input[keyName] + '<br>');
			}
		}
		if (!u.display) {
			u.display = document.createElement('pre');
			u.display.style.display = 'block';
			u.display.style.position = 'fixed';
			u.display.style.top = 0;
			u.display.style.left = 0;
			u.display.style.zIndex = 9001;
			u.display.style.fontFamily = 'monospace';
			u.display.style.fontSize = '10px';
			u.display.style.lineHeight = '7px';
			u.display.style.whiteSpace = 'pre-wrap';
			u.display.style.color = 'hsl(' + Math.round(Math.random() * 360) + ',100%,50%)';
		}
		document.body.appendChild(u.display);
		u.display.innerHTML += output.join("\n");
	},
	clearDebug: function () {
		var u = NPos3d.Utils;
		if(u.display){
			u.display.innerHTML = '';
			if(u.display.parentNode === document.body){
				document.body.removeChild(u.display);
			}
		}
	}
};

NPos3d.Scene = function (args) {
	var t = this, type = 'Scene';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};

	t.debugViewport = args.debugViewport || false;
	t.mpos = {x: 0,y: 0};
	t.camera = args.camera || new NPos3d.Camera();
	t.frameRate = args.frameRate || 30;
	t.lastFrameRate = t.frameRate;
	t.pixelScale = args.pixelScale || 1;
	t.globalCompositeOperation = args.globalCompositeOperation || 'source-over';
	t.backgroundColor = args.backgroundColor || 'transparent';
	t.strokeStyle = args.strokeStyle || '#fff';
	t.fillStyle = args.fillStyle || '#fff';
	t.lineWidth = args.lineWidth || undefined;
	t.fullScreen = args.fullScreen === undefined || args.fullScreen === true ? true : false;

	t.oldAndroid = /android 2/i.test(navigator.userAgent);
	t.mobileSafari = /iphone|ipad|ipod/i.test(navigator.userAgent);
	t.isMobile = t.oldAndroid || t.mobileSafari || /android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent);
	t.isChrome = /Chrome/i.test(navigator.userAgent);
	t.newChromeMobile = t.isMobile && t.isChrome && parseInt(navigator.userAgent.match(/Chrome\/(\d*)/i)[1]) > 18;
	t.mobileFireFox = t.isMobile && /firefox/i.test(navigator.userAgent);
	t.useOuterWidth = t.oldAndroid || t.mobileFireFox;

	t.canvasId = args.canvasId || 'canvas';
	t.existingCanvas = args.canvas !== undefined;
	t.canvas = args.canvas || document.createElement('canvas');
	t.canvas.style.backgroundColor = args.canvasStyleColor || '#000';
	t.canvas.id = t.canvasId;
	t.c = t.canvas.getContext('2d');
	if (args.canvas === undefined) {
		document.body.appendChild(t.canvas);
	}
	if (t.fullScreen) {
		t.canvas.parentNode.style.margin = 0;
		t.canvas.parentNode.style.padding = 0;
		t.canvas.style.display = 'block';
		t.canvas.style.position = 'fixed';
		t.canvas.style.top = 0;
		t.canvas.style.left = 0;
		if(args.zIndex !== undefined){
			t.canvas.style.zIndex = args.zIndex;
		}
		if (t.useOuterWidth) {
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

	t.canvas.style.backgroundColor = t.canvasStyleColor;
	t.cursorPosition = args.canvas !== undefined ? 'absolute' : 'relative';
	t.mouseHandler = function (e) {
		var canvasOffsetX = 0,
			canvasOffsetY = 0,
			ratio = window.devicePixelRatio || 1,
			pointX = 0,
			pointY = 0;
		if(e.target === t.canvas || e.target === window){
			e.preventDefault();
		}
		if (!t.fullScreen) {
			var offset = t.canvas.getBoundingClientRect();
			canvasOffsetX = offset.left;
			canvasOffsetY = offset.top;
		}
		if (e.touches && e.touches.length) {
			pointX = e.touches[0].screenX;
			pointY = e.touches[0].screenY;
		} else {
			pointX = e.clientX;
			pointY = e.clientY;
		}
		if(ratio !== undefined || ratio !== 1){
			pointX *= ratio;
			pointY *= ratio;
		}
		if(t.cursorPosition === 'absolute'){
			pointX -= canvasOffsetX;
			pointY -= canvasOffsetY;
		}
		t.mpos.x = Math.ceil((pointX / t.pixelScale) - t.cx);
		t.mpos.y = Math.ceil((pointY / t.pixelScale) - t.cy);
		//console.log(t.mpos.x, t.mpos.y);
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
		var t = this, meta, ratio;
		t.cx = Math.floor(t.w/2);
		t.cy = Math.floor(t.h/2);
		t.mpos.x = 0;
		t.mpos.y = 0;
		t.canvas.width = t.w;
		t.canvas.height = t.h;
		if (t.pixelScale !== 1) {
			t.canvas.style.width = Math.ceil(t.w * t.pixelScale) + 'px';
			t.canvas.style.height = Math.ceil(t.h * t.pixelScale) + 'px';
		} else {
			t.canvas.style.width = t.w + 'px';
			t.canvas.style.height = t.h + 'px';
		}
		t.lw = t.w;
		t.lh = t.h;
		if(t.isMobile){
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
			//Mobile FireFox: https://developer.mozilla.org/en-US/docs/Mobile/Viewport_meta_tag
			//Android Viewport reference: http://developer.android.com/guide/webapps/targeting.html#Metadata
			//Some Actual User testing: http://stackoverflow.com/questions/11345896/full-webpage-and-disabled-zoom-viewport-meta-tag-for-all-mobile-browsers#answer-12270403
			if(t.mobileFireFox){
				meta.setAttribute('content','width=' + t.w + ', user-scalable=no, target-densityDpi=device-dpi');
			} else if(t.mobileSafari || t.newChromeMobile) {
				ratio = 1 / (window.devicePixelRatio || 1);
				meta.setAttribute('content','width=device-width, initial-scale=' + ratio + ', minimum-scale=' + ratio + ', maximum-scale=' + ratio + ', user-scalable=no');
			} else {
				meta.setAttribute('content','width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, target-densityDpi=device-dpi');
			}
			document.head.appendChild(meta);
			//used to scroll to remove header on oldAndroid
			//if(t.fullScreen && t.isMobile && ! t.oldAndroid){
			//	window.scrollTo(0,1);
			//}
			//window.scrollTo(0,0);
		}
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
		var t = this, i, len = t.children.length, child, u = NPos3d.Utils;
		try{
			t.checkWindow();
			if (t.w !== t.lw || t.h !== t.lh) {t.resize();}
			t.setInvertedCameraPos();

			if (t.debugViewport) {
				var newSize = u.subset(window,'innerHeight,innerWidth,outerWidth,outerHeight,devicePixelRatio');
				newSize.screenSizeWidth = window.screen.width;
				newSize.screenSizeHeight = window.screen.height;
				newSize.documentElementClientWidth = document.documentElement.clientWidth;
				newSize.documentElementClientHeight = document.documentElement.clientHeight;
				newSize.devicePixelRatio = window.devicePixelRatio || 1;
				newSize.navigator = navigator.userAgent;
				u.clearDebug();
				u.displayDebug(newSize);
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
			t.c.globalCompositeOperation = t.globalCompositeOperation;
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
		t.interval = setInterval(
			function () {
				t.update();
				if(t.frameRate !== t.lastFrameRate){ //automatically updates frameRate if updated mid-usage
					t.stop();
					t.lastFrameRate = t.frameRate;
					t.start();
				}
			},
			1000 / t.frameRate
		);
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
	updateMatrices: function(o) {
		var m = NPos3d.Maths, p = o.parent;
		//localScale: ,
		//localRotation: ,
		//localComposite: ,
		//globalComposite

		//START updating the object's local matrices

		//scale
		m.mat4P3Scale(m.__mat4Identity, o.scale, o.matrices.localScale);

		//rotate
		m.eulerToMat4(o.rot, o.rotOrder, o.matrices.localRotation);

		//composite matrix starts out as scale, no need to multiply
		m.mat4Set(o.matrices.localComposite, o.matrices.localScale);
		m.mat4Mul(o.matrices.localComposite, o.matrices.localRotation, o.matrices.localComposite);
		//no need to multiply the local composite, adding 3 keys will be faster
		//this is also why we don't need a local localPosition matrix.
		m.mat4P3Translate(o.matrices.localComposite, o.pos, o.matrices.localComposite);

		//END updating the object's local matrices

		//Multiply the localComposite by the patent's globalComposite to get this object's globalComposite
		if(p !== undefined && p !== false && p.isScene !== true){
			m.mat4Mul(o.matrices.localComposite, p.matrices.globalComposite, o.matrices.globalComposite);
		} else { //it's probably the root object.
			m.mat4Set(o.matrices.globalComposite, o.matrices.localComposite);
		}

		m.p3Mat4Mul([0,0,0], o.matrices.globalComposite, o.gPos); //because it rocks to be able to read a global position
		m.p3Mat4Mul(o.scale, o.matrices.globalComposite, o.gScale); //Would this even work?
	},
	updateTransformedPointCache: function (o) {
		var t = this, m = NPos3d.Maths, i, point, currentGlobalCompositeMatrixString;
		t.updateMatrices(o);
		if(o.transformedPointCache.length !== o.shape.points.length){
			o.transformedPointCache.length = 0; //empty the array, keep the object reference
			for (i = 0; i < o.shape.points.length; i += 1) {
				o.transformedPointCache[i] = [0,0,0];
			}
			o.lastGlobalCompositeMatrixString = false;
		}
		currentGlobalCompositeMatrixString = o.matrices.globalComposite.toString();
		if (!o.lastGlobalCompositeMatrixString || o.lastGlobalCompositeMatrixString !== currentGlobalCompositeMatrixString) {
			for (i = 0; i < o.shape.points.length; i += 1) {
				//to make sure I'm not messing with the original shape array...
				point = o.transformedPointCache[i];
				m.p3Mat4Mul(o.shape.points[i], o.matrices.globalComposite, point);
			}
			o.boundingBox = m.nGetBounds(o.transformedPointCache);
			o.lastGlobalCompositeMatrixString = currentGlobalCompositeMatrixString;
		}
	},
	lineRenderLoop: function (o) {
		var t = this, m = NPos3d.Maths, computedPointList = [], i, point, p3a, p3b, t3a, t3b;
		for (i = 0; i < o.transformedPointCache.length; i += 1) {
			//to make sure I'm not messing with the original array...
			point = o.transformedPointCache[i];
			computedPointList[i] = point;
		}
		for (i = 0; i < o.shape.lines.length; i += 1) {
			//offset the points by the object's position
			p3a = m.p3Add(computedPointList[o.shape.lines[i][0]], t.invertedCameraPos);
			p3b = m.p3Add(computedPointList[o.shape.lines[i][1]], t.invertedCameraPos);

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
		var t = this, m = NPos3d.Maths, i, bbCube, bbMinOffset, bbMaxOffset, bbOffScreen, bbp;

		if (o.renderAlways) {
			t.lineRenderLoop(o);
			return;
		}

		bbMinOffset = o.boundingBox[0];
		bbMaxOffset = o.boundingBox[1];

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
		var t = this, m = NPos3d.Maths, i, bbMinOffset, bbMaxOffset, bbCube, bbOffScreen, bbp;

		if (o.renderAlways) {
			t.pointRenderLoop(o);
			return;
		}

		bbMinOffset = o.boundingBox[0];
		bbMaxOffset = o.boundingBox[1];

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
		for (i = 0; i < o.transformedPointCache.length; i += 1) {
			//to make sure I'm not messing with the original array...
			point = o.transformedPointCache[i];
			computedPointList[i] = point;
		}
		for (i = 0; i < o.transformedPointCache.length; i += 1) {
			//offset the points by the object's position
			p3a = m.p3Add(computedPointList[i], t.invertedCameraPos);
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

NPos3d.Geom = {
	//The only reason this isn't with the rest of the shapes is because I need to use it inside the prototype of ob3D
	cube: {
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
	},
	axies: {
		points: [
			[ 4, 0, 0,'#f00'],
			[32, 0, 0,'#f00'],
			[22, 6,-6,'#f00'],
			[22,-6, 6,'#f00'],
			[ 0, 4, 0,'#0f0'],
			[ 0,32, 0,'#0f0'],
			[ 6,22,-6,'#0f0'],
			[-6,22, 6,'#0f0'],
			[ 0, 0, 4,'#00f'],
			[ 0, 0,32,'#00f'],
			[-6, 6,22,'#00f'],
			[ 6,-6,22,'#00f']
		],
		lines: [
			[0,1,'#f00'],
			[1,2,'#f00'],
			[1,3,'#f00'],
			[4,5,'#0f0'],
			[5,6,'#0f0'],
			[5,7,'#0f0'],
			[8,9,'#00f'],
			[9,10,'#00f'],
			[9,11,'#00f']
		]
	}
};

NPos3d.blessWith3DBase = function (o,args) {
	var m = NPos3d.Maths;
	o.pos = args.pos || [0,0,0];
	o.rot = args.rot || [0,0,0];
	o.rotOrder = args.rotOrder || o.rotOrder || [0,1,2];
	o.scale = args.scale || o.scale || [1,1,1];
	o.gPos = o.pos.slice(); //global position
	o.gScale = o.scale.slice(); //global scale
	o.matrices = {
		localScale: m.makeMat4(),
		localRotation: m.makeMat4(),
		localComposite: m.makeMat4(),
		globalComposite: m.makeMat4()
	};
	o.lastGlobalCompositeMatrixString = false;
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
//Because it's just fine to spend 12K worth of data to include a sexy vector font that I designed in about an hour and a half
NPos3d.Geom.font = {
	"!":{"points":[[1,0],[1,2],[1,3],[1,4]],"lines":[[0,1],[2,3]]},
	"\"":{"points":[[1,1],[1,0],[0,0],[0,1]],"lines":[[0,1],[2,3]]},
	"#":{"points":[[2,4],[1,4],[0,3],[0,1],[1,0],[2,0],[2,1],[2,3]],"lines":[[0,5],[1,4],[2,7],[3,6]]},
	"$":{"points":[[1,0],[1,4],[0,3],[0,1],[2,1],[2,3]],"lines":[[0,1],[0,3],[0,4],[1,2],[1,5],[3,5]]},
	"%":{"points":[[0,4],[2,0],[1,4],[2,3],[1,3],[0,1],[1,0],[1,1]],"lines":[[0,1],[2,3],[2,4],[3,4],[5,7],[5,6],[6,7]]},
	"&":{"points":[[2,4],[2,1],[0,1],[1,0],[1,2],[2,3],[0,3],[1,4]],"lines":[[0,2],[1,3],[2,3],[4,6],[5,7],[6,7]]},
	"'":{"points":[[1,1],[1,0]],"lines":[[0,1]]},
	"(":{"points":[[2,0],[2,4],[1,3],[1,1]],"lines":[[0,3],[1,2],[2,3]]},
	")":{"points":[[1,1],[1,3],[0,4],[0,0]],"lines":[[0,1],[0,3],[1,2]]},
	"*":{"points":[[1,3],[1,1],[0,2],[2,2],[0,3],[2,3],[0,1],[2,1]],"lines":[[0,1],[2,3],[4,7],[5,6]]},
	"+":{"points":[[2,2],[0,2],[1,1],[1,3]],"lines":[[0,1],[2,3]]},
	",":{"points":[[0,4],[1,3]],"lines":[[0,1]]},
	"-":{"points":[[2,2],[0,2]],"lines":[[0,1]]},
	".":{"points":[[1,4],[1,3],[0,4]],"lines":[[0,2],[0,1],[1,2]]},
	"/":{"points":[[2,1],[0,3]],"lines":[[0,1]]},
	"0":{"points":[[2,3],[2,1],[0,1],[0,3],[1,4],[1,0]],"lines":[[0,4],[0,1],[1,3],[1,5],[2,3],[2,5],[3,4]]},
	"1":{"points":[[0,1],[0,4],[2,4],[1,0],[1,4]],"lines":[[0,3],[1,2],[3,4]]},
	"2":{"points":[[0,4],[2,1],[1,0],[2,4],[0,1]],"lines":[[0,3],[0,1],[1,2],[2,4]]},
	"3":{"points":[[1,4],[1,0],[0,1],[0,3],[1,2],[2,1],[2,3]],"lines":[[0,3],[0,6],[1,2],[1,5],[4,5],[4,6]]},
	"4":{"points":[[0,0],[2,0],[2,4],[0,2],[2,2]],"lines":[[0,3],[1,2],[3,4]]},
	"5":{"points":[[2,3],[1,2],[0,2],[0,4],[2,0],[1,4],[0,0]],"lines":[[0,5],[0,1],[1,2],[2,6],[3,5],[4,6]]},
	"6":{"points":[[1,0],[0,1],[2,3],[1,4],[0,3],[1,2]],"lines":[[0,1],[1,4],[2,5],[2,3],[3,4],[4,5]]},
	"7":{"points":[[1,4],[2,0],[0,0]],"lines":[[0,1],[1,2]]},
	"8":{"points":[[1,2],[1,4],[1,0],[0,1],[0,3],[2,1],[2,3]],"lines":[[0,6],[0,5],[0,3],[0,4],[1,4],[1,6],[2,3],[2,5]]},
	"9":{"points":[[1,2],[2,1],[1,0],[0,1],[2,3],[1,4]],"lines":[[0,1],[0,3],[1,2],[1,4],[2,3],[4,5]]},
	":":{"points":[[1,0],[1,1],[1,4],[1,3]],"lines":[[0,1],[2,3]]},
	";":{"points":[[1,3],[0,4],[1,1],[1,0]],"lines":[[0,1],[2,3]]},
	"<":{"points":[[2,0],[2,4],[0,2]],"lines":[[0,2],[1,2]]},
	"=":{"points":[[2,1],[0,1],[2,3],[0,3]],"lines":[[0,1],[2,3]]},
	">":{"points":[[2,2],[0,0],[0,4]],"lines":[[0,1],[0,2]]},
	"?":{"points":[[1,2],[2,1],[0,1],[1,0],[1,4],[1,3]],"lines":[[0,1],[1,3],[2,3],[4,5]]},
	"@":{"points":[[2,1],[0,1],[1,0],[0,3],[1,4],[1,2],[1,3],[2,2],[2,3]],"lines":[[0,2],[1,2],[1,3],[3,4],[4,8],[5,7],[5,6],[6,7],[7,8]]},
	"A":{"points":[[2,4],[1,0],[0,2],[0,4],[2,2]],"lines":[[0,4],[1,2],[1,4],[2,4],[2,3]]},
	"B":{"points":[[2,3],[2,1],[1,2],[0,4],[0,0],[1,0],[1,4]],"lines":[[0,2],[0,6],[1,2],[1,5],[3,4],[3,6],[4,5]]},
	"C":{"points":[[2,3],[2,1],[0,1],[0,3],[1,4],[1,0]],"lines":[[0,4],[1,5],[2,3],[2,5],[3,4]]},
	"D":{"points":[[1,4],[1,0],[0,4],[0,0],[2,1],[2,3]],"lines":[[0,2],[0,5],[1,3],[1,4],[2,3],[4,5]]},
	"E":{"points":[[2,4],[2,0],[2,2],[0,4],[0,0],[0,2]],"lines":[[0,3],[1,4],[2,5],[3,4]]},
	"F":{"points":[[0,0],[0,4],[2,2],[2,0],[0,2]],"lines":[[0,3],[0,1],[2,4]]},
	"G":{"points":[[1,2],[2,2],[2,1],[2,3],[1,0],[1,4],[0,3],[0,1]],"lines":[[0,1],[1,3],[2,4],[3,5],[4,7],[5,6],[6,7]]},
	"H":{"points":[[2,4],[2,0],[0,4],[0,0],[0,2],[2,2]],"lines":[[0,1],[2,3],[4,5]]},
	"I":{"points":[[0,4],[2,4],[0,0],[2,0],[1,0],[1,4]],"lines":[[0,1],[2,3],[4,5]]},
	"J":{"points":[[2,0],[2,3],[1,4],[0,3]],"lines":[[0,1],[1,2],[2,3]]},
	"K":{"points":[[0,0],[0,4],[2,0],[2,4],[0,2]],"lines":[[0,1],[2,4],[3,4]]},
	"L":{"points":[[0,0],[2,4],[0,4]],"lines":[[0,2],[1,2]]},
	"M":{"points":[[2,4],[0,4],[1,2],[0,0],[2,0]],"lines":[[0,4],[1,3],[2,3],[2,4]]},
	"N":{"points":[[2,0],[2,4],[0,0],[0,4]],"lines":[[0,1],[1,2],[2,3]]},
	"O":{"points":[[1,0],[1,4],[0,3],[0,1],[2,1],[2,3]],"lines":[[0,3],[0,4],[1,2],[1,5],[2,3],[4,5]]},
	"P":{"points":[[1,0],[0,0],[0,4],[1,2],[2,1],[0,2]],"lines":[[0,1],[0,4],[1,2],[3,4],[3,5]]},
	"Q":{"points":[[2,4],[2,3],[2,1],[0,1],[0,3],[1,4],[1,0]],"lines":[[0,5],[1,5],[1,2],[2,6],[3,4],[3,6],[4,5]]},
	"R":{"points":[[2,4],[2,1],[1,2],[0,4],[0,0],[1,0],[0,2]],"lines":[[0,2],[1,2],[1,5],[2,6],[3,4],[4,5]]},
	"S":{"points":[[2,3],[2,1],[0,1],[0,3],[1,4],[1,0]],"lines":[[0,2],[0,4],[1,5],[2,5],[3,4]]},
	"T":{"points":[[1,4],[2,0],[0,0],[1,0]],"lines":[[0,3],[1,2]]},
	"U":{"points":[[2,3],[2,0],[0,0],[0,3],[1,4]],"lines":[[0,4],[0,1],[2,3],[3,4]]},
	"V":{"points":[[1,4],[0,1],[0,0],[2,0],[2,1]],"lines":[[0,1],[0,4],[1,2],[3,4]]},
	"W":{"points":[[0,4],[2,4],[1,2],[2,0],[0,0]],"lines":[[0,2],[0,4],[1,2],[1,3]]},
	"X":{"points":[[2,0],[0,0],[2,4],[0,4]],"lines":[[0,3],[1,2]]},
	"Y":{"points":[[1,4],[1,2],[0,0],[2,0]],"lines":[[0,1],[1,2],[1,3]]},
	"Z":{"points":[[0,0],[2,4],[2,0],[0,4]],"lines":[[0,2],[1,3],[2,3]]},
	"[":{"points":[[1,0],[1,4],[2,4],[2,0]],"lines":[[0,1],[0,3],[1,2]]},
	"\\":{"points":[[2,3],[0,1]],"lines":[[0,1]]},
	"]":{"points":[[0,0],[0,4],[1,4],[1,0]],"lines":[[0,3],[1,2],[2,3]]},
	"^":{"points":[[0,1],[2,1],[1,0]],"lines":[[0,2],[1,2]]},
	"_":{"points":[[0,4],[2,4]],"lines":[[0,1]]},
	"`":{"points":[[0,0],[1,1]],"lines":[[0,1]]},
	"a":{"points":[[2,4],[2,3],[2,2],[0,2],[0,3],[1,4],[1,1]],"lines":[[0,1],[1,2],[1,5],[2,6],[3,4],[3,6],[4,5]]},
	"b":{"points":[[1,4],[0,0],[0,4],[1,2],[2,3],[0,2]],"lines":[[0,2],[0,4],[1,2],[3,4],[3,5]]},
	"c":{"points":[[1,1],[1,4],[0,3],[0,2],[2,2],[2,3]],"lines":[[0,3],[0,4],[1,2],[1,5],[2,3]]},
	"d":{"points":[[0,3],[1,2],[2,4],[2,0],[1,4],[2,2]],"lines":[[0,1],[0,4],[1,5],[2,4],[2,3]]},
	"e":{"points":[[2,3],[2,2],[0,2],[0,3],[1,4],[1,1]],"lines":[[0,4],[1,2],[1,5],[2,3],[2,5],[3,4]]},
	"f":{"points":[[2,2],[1,1],[1,3],[0,4],[0,2],[0,3]],"lines":[[0,1],[1,4],[2,5],[3,4]]},
	"g":{"points":[[0,5],[1,6],[2,5],[1,1],[1,4],[0,3],[0,2],[2,2],[2,3]],"lines":[[0,1],[1,2],[2,7],[3,6],[3,7],[4,5],[4,8],[5,6]]},
	"h":{"points":[[2,4],[0,0],[0,4],[1,2],[2,3],[0,2]],"lines":[[0,4],[1,2],[3,4],[3,5]]},
	"i":{"points":[[1,1],[1,0],[1,2],[2,4],[0,4],[1,4]],"lines":[[0,1],[2,5],[3,4]]},
	"j":{"points":[[1,2],[1,6],[0,5],[2,5],[2,2]],"lines":[[0,4],[1,3],[1,2],[3,4]]},
	"k":{"points":[[2,4],[0,4],[0,0],[2,3],[2,1],[1,2],[0,2]],"lines":[[0,3],[1,2],[3,5],[4,5],[5,6]]},
	"l":{"points":[[0,2],[2,4],[0,0]],"lines":[[0,1],[0,2]]},
	"m":{"points":[[0,4],[2,1],[1,1],[1,2],[2,4],[0,1],[0,2]],"lines":[[0,5],[1,3],[1,4],[2,3],[2,6]]},
	"n":{"points":[[2,4],[0,4],[1,1],[2,2],[0,2],[0,1]],"lines":[[0,3],[1,4],[2,3],[2,4],[4,5]]},
	"o":{"points":[[2,3],[2,2],[0,2],[0,3],[1,4],[1,1]],"lines":[[0,4],[0,1],[1,5],[2,3],[2,5],[3,4]]},
	"p":{"points":[[2,3],[1,4],[0,6],[0,2],[1,2],[0,4]],"lines":[[0,1],[0,4],[1,5],[2,3],[3,4]]},
	"q":{"points":[[1,2],[2,2],[2,6],[1,4],[0,3],[2,4]],"lines":[[0,1],[0,4],[1,2],[3,4],[3,5]]},
	"r":{"points":[[0,4],[0,1],[1,1],[2,2],[0,2]],"lines":[[0,1],[2,3],[2,4]]},
	"s":{"points":[[1,1],[1,4],[0,3],[0,2],[2,2],[2,3]],"lines":[[0,3],[0,4],[1,2],[1,5],[3,5]]},
	"t":{"points":[[1,1],[0,2],[2,2],[1,4]],"lines":[[0,3],[1,2]]},
	"u":{"points":[[1,4],[0,3],[0,1],[2,1],[2,3]],"lines":[[0,1],[0,4],[1,2],[3,4]]},
	"v":{"points":[[2,1],[0,1],[1,4]],"lines":[[0,2],[1,2]]},
	"w":{"points":[[2,1],[2,3],[0,1],[1,3],[0,4],[1,4]],"lines":[[0,1],[1,5],[2,4],[3,4],[3,5]]},
	"x":{"points":[[2,1],[0,1],[1,2],[0,4],[2,4],[1,3]],"lines":[[0,2],[1,2],[2,5],[3,5],[4,5]]},
	"y":{"points":[[2,1],[0,1],[1,2],[1,4]],"lines":[[0,2],[1,2],[2,3]]},
	"z":{"points":[[0,4],[2,1],[2,4],[0,1]],"lines":[[0,1],[0,2],[1,3]]},
	"{":{"points":[[1,1],[1,3],[0,2],[2,0],[2,4],[1,4],[1,0]],"lines":[[0,2],[0,6],[1,2],[1,5],[3,6],[4,5]]},
	"|":{"points":[[1,0],[1,4]],"lines":[[0,1]]},
	"}":{"points":[[1,1],[1,3],[2,2],[1,0],[1,4],[0,4],[0,0]],"lines":[[0,2],[0,3],[1,2],[1,4],[3,6],[4,5]]},
	"~":{"points":[[1,1],[1,3],[2,2],[0,2]],"lines":[[0,1],[0,3],[1,2]]}
};

//VectorText generation! Weeeeeeeeeeeee!!!

NPos3d.VText = function(args){
	var t = this, type = 'VText';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	NPos3d.blessWith3DBase(t,args);
	t.string = args.string || 'NEED INPUT';
	t.textAlign = args.textAlign || 'center';
	t.characterWidth = 2; //This is set static because of the design of the font.
	t.characterHeight = 4; //This is set static because of the design of the font.
	t.characterHeightOffset = 2; //This is set static because of the design of the font.
	t.letterSpacing = args.letterSpacing || 1;
	t.lineHeight = args.lineHeight || 6;
	t.fontSize = args.fontSize|| 32;
	t.shape = {
		points:[],
		lines:[]
	};
	t.stringCached = false;
	t.font = args.font || NPos3d.Geom.font;
	t.cacheTextGeom();
}
NPos3d.VText.prototype = {
	type: 'VText',
	getStateString:function(){
		var t = this;
		return (t.string + t.textAlign + t.characterWidth + t.letterSpacing + t.lineHeight + t.fontSize).toString();
	},
	cacheTextGeom:function(){
		var t = this;
		//this line is -important-: if any text property changes, new point caches won't be updated without scaling or rotating the object.
		t.lastGlobalCompositeMatrixString = false;

		//clear the geom, but keep the array references
		t.shape.points.length = 0;
		t.shape.lines.length = 0;

		var offsetPointCount = 0;
		var textAlignTypes = {
			left:{
				charOffset:function(){
					return 0;
				},
				spacingOffset: 0
			},
			right:{
				charOffset:function(num){
					return -num;
				},
				spacingOffset: t.letterSpacing
			},
			center: {
				charOffset: function(num){
					//Plus 2 because each character is 2 wide.
					return -(num / 2);
				},
				spacingOffset: t.letterSpacing /2
			}
		};
		if(textAlignTypes.hasOwnProperty(t.textAlign)){
			var offsetSpacing = textAlignTypes[t.textAlign].spacingOffset;
			var linesOText = t.string.split("\n");
			for(var lineNum = 0; lineNum < linesOText.length; lineNum += 1){
				var thisLine = linesOText[lineNum];
				var charCount = thisLine.length;
				var offsetCharCount = textAlignTypes[t.textAlign].charOffset(charCount);
				for(var charNum = 0; charNum < charCount; charNum += 1){
					var thisChar = thisLine[charNum];
					//console.log(t.string[i]);
					if(thisChar === ' '){
						//This is a space character.
						//I need to bump over the text by one char,
						//but I don't need to add any geom.
					}else if(thisChar === '\t'){
						//This is a tab character.
						//I need to bump over the text by TWO chars,
						//but I don't need to add any geom.
						offsetCharCount += 1;
					}else if(t.font.hasOwnProperty(thisChar)){
						var letter = t.font[thisChar];
						for(var p = 0; p < letter.points.length; p += 1){
							t.shape.points.push([
								(letter.points[p][0] + ((t.characterWidth + t.letterSpacing) * offsetCharCount) + offsetSpacing) * t.fontSize / t.characterHeight,
								(letter.points[p][1] + (t.lineHeight * lineNum) - t.characterHeightOffset) * t.fontSize / t.characterHeight,
								letter.points[p][2] || 0
							]);
						}
						for(var l = 0; l < letter.lines.length; l += 1){
							var line = letter.lines[l];
							t.shape.lines.push([line[0] + offsetPointCount, line[1] + offsetPointCount]);
						}
						//console.log('#char',thisChar,'#points',t.shape.points,'#lines',t.shape.lines);
						offsetPointCount = t.shape.points.length;
					}else{
						throw('This font does not contain the character "' + ch + '"');
					}
					offsetCharCount += 1;
				}
				offsetCharCount = 0;
			}
		}else{
			throw('You passed an unsupported textAlign type named "' + t.textAlign + '"');
		}

		t.stringCached = t.getStateString();
	},
	update:function(s){
		var t = this;
		if(t.getStateString() !== t.stringCached){
			t.cacheTextGeom();
		}
		t.shape.color = t.color;
		t.render();
	},
	destroy:NPos3d.destroyFunc
};
NPos3d.Layout = NPos3d.Layout || {};

NPos3d.Layout.ResponsivePoint = function(args) {
	var t = this, type = 'ResponsivePoint';
	if(t.type !== type){throw type + ' must be invoked using the `new` keyword.';}
	args = args || {};
	if(typeof args.offset !== 'undefined' && typeof args.offset.length !== 'number'){ //does it smell like an array?
		throw type + ' constructor MUST be provided an `offset` array argument';
	}
	if(
		typeof args.scene === 'undefined' ||
		typeof args.scene.type === 'undefined' ||
		args.scene.type !== 'Scene'
	){
		throw type + ' constructor MUST be provided a `Scene` object argument';
	}
	t.offset = args.offset;
	t.scene = args.scene;
	t.scene.add(t); //adds itself to the scene automatically, because it needs the scene to work
	t.update();
	return t;
};

NPos3d.Layout.ResponsivePoint.prototype = []; //it has to smell like a normal vertex
NPos3d.Layout.ResponsivePoint.prototype.type = 'ResponsivePoint';
NPos3d.Layout.ResponsivePoint.prototype.update = function() {
	var t = this, i;
	if(t.offset[0] < 0) {
		t[0] = t.scene.cx + t.offset[0];
	} else if(t.offset[0] > 0) {
		t[0] = t.offset[0] - t.scene.cx;
	} else {
		t[0] = 0;
	}
	if(t.offset[1] < 0) {
		t[1] = t.scene.cy + t.offset[1];
	} else if(t.offset[1] > 0) {
		t[1] = t.offset[1] - t.scene.cy;
	} else {
		t[1] = 0;
	}
	t[2] = t.offset[2];
	if(typeof t.offset[3] !== 'undefined') { //set the color property, if it's a vertex
		t[3] = t.offset[3];
		t.length = 4;
	} else {
		t.length = 3;
	}
};
NPos3d.Scene.prototype.drawSprite = function(c,o){
	c.save();
	c.translate(o.point2D.x, o.point2D.y);
	if(o.depthScale){
		c.scale(o.spriteScale * o.point2D.scale, o.spriteScale * o.point2D.scale);
	} else {
		c.scale(o.spriteScale, o.spriteScale);
	}
	c.rotate(o.spriteRot);
	if(o.numFrames > 1){
		o.frameState += 0.3;
		if(o.frameState >= o.numFrames){
			o.frameState = 0;
		}
		c.drawImage(o.image, (o.width * Math.floor(o.frameState)), 0, o.width, o.height, o.offset.x, o.offset.y, o.width, o.height);
	}else{
		c.drawImage(o.image, o.offset.x, o.offset.y);
	}
	c.restore();
};
NPos3d.Scene.prototype.renderSprite = function(o){
	var t = this;
	t.updateMatrices(o);
	if(o.loaded){
		//offset the points by the object's position
		var p3 = o.gPos;
		if( p3[2] < t.camera.clipNear && p3[2] > t.camera.clipFar ){
			o.point2D = t.project3Dto2D(p3); //a convenience measure
			//Just some basic positional culling... if it's not on screen, don't render it...
			if(
				(o.point2D.x + (o.offset.x * o.point2D.scale) < t.cx && o.point2D.x - (o.offset.x * o.point2D.scale) > -t.cx) &&
				(o.point2D.y + (o.offset.y * o.point2D.scale) < t.cy && o.point2D.y - (o.offset.y * o.point2D.scale) > -t.cy)
			){
				t.renderInstructionList.push({
					method: t.drawSprite,
					args: o, //It just seemed silly to re-define all of the render args over again in a new object
					z: p3[2]
				});
			}
		}
	}
};
NPos3d.renderSpriteFunc =  function(){
	this.scene.renderSprite(this);
}

NPos3d.blessWithSpriteBase = function(o,config){
	if(!config.path){throw 'You MUST provide an image `path` value on sprite type objects!'};

	NPos3d.blessWith3DBase(o, config); //Add universal 3D properties to the object first

	o.spriteRot = config.spriteRot || 0;
	o.spriteScale = config.spriteScale || 1;
	o.depthScale = config.depthScale || false; //Default behavior: Act as a non-scaling billboard
	o.numFrames = config.numFrames || 1;
	o.frameState = o.numFrames;
	o.width = 0;
	o.height = 0;
	o.loaded = false;
	o.image = new Image();
	o.image.onload = function(){
		o.width = o.image.width / o.numFrames;
		o.height = o.image.height;
		o.offset = {
			x:-Math.round(o.width/2),
			y:-Math.round(o.height/2)
		};
		o.boundingBox = [[o.offset.x,o.offset.y,-32],[-o.offset.x,-o.offset.y,32]];
		o.loaded = true;
		//console.log(t);
	};
	o.render = NPos3d.renderSpriteFunc;
	o.image.src = config.path;
	return o;
};

NPos3d.Sprite3D = function(config){
	var t = this, type = 'Sprite3D';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	NPos3d.blessWithSpriteBase(t,config);
	return t;
};

NPos3d.Sprite3D.prototype = {
	type: 'Sprite3D',
	update:function(){
		this.render();
	},
	destroy:NPos3d.destroyFunc
};
NPos3d.Utils = NPos3d.Utils || {};

NPos3d.Utils.Color = {
	detectCSSColorType: function(string){
		if(string.indexOf('#') > -1){
			return 'hex';
		}
		else if(string.toLowerCase().indexOf('rgb') > -1){
			return 'rgb';
		}
		else if(string.toLowerCase().indexOf('hsl') > -1){
			return 'hsl';
		}
		else if(string.toLowerCase().indexOf('hsv') > -1){
			return 'hsv';
		}
		return false;
	},
	hexToDec:function(string){
		return parseInt(string,16);
	},
	convertHexToRGBArray: function(string){
		var r, g, b,chars = string.split(''),h = NPos3d.Utils.Color.hexToDec;
		if(chars.length < 7){
			r = h(''+chars[1]+chars[1]);
			g = h(''+chars[2]+chars[2]);
			b = h(''+chars[3]+chars[3]);
		}else{
			r = h(''+chars[1]+chars[2]);
			g = h(''+chars[3]+chars[4]);
			b = h(''+chars[5]+chars[6]);
		}
		return [r, g, b];
	},
	parenColorToArray:function(string){
		return string.replace(/rgb|hsl|hsv|a|\(|\)|;|%| /g, '').split(',').map(function(v,k){if(k<3){return parseInt(v);}else{return parseFloat(v);}});
	},
	rgbArrayToHLSArray:function(inp){
		var o = NPos3d.Utils.Color.rgbToHsl(inp[0],inp[1],inp[2]);
		o[0] *= 360;
		o[1] *= 100;
		o[2] *= 100;
		if(inp.length > 3){o.push(inp[3]);}
		return o;
	},
	hslArrayToRGBArray:function(inp){
		var o = NPos3d.Utils.Color.hslToRgb((inp[0] % 360) / 360,inp[1] / 100, inp[2]/ 100), r = Math.round;
		o[0] = r(o[0]);
		o[1] = r(o[1]);
		o[2] = r(o[2]);
		if(inp.length > 3){o.push(inp[3]);}
		return o;
	},
	colorStringToHSLAArray:function(string){
		var t = NPos3d.Utils.Color, type = t.detectCSSColorType(string), nums = [], d;
		if(type === 'hex'){
			d = t.convertHexToRGBArray(string);
			d = t.rgbArrayToHLSArray(d);
			nums.push(d[0],d[1],d[2],1);
		}
		else if(type === 'rgb'){
			d = t.parenColorToArray(string);
			d = t.rgbArrayToHLSArray(d);
			nums.push(d[0],d[1],d[2],d[3]||1);
		}
		else if(type === 'hsl'){
			d = t.parenColorToArray(string);
			nums.push(d[0],d[1],d[2],d[3]||1);
		}
		return nums;
	},
	colorStringToHSLAString:function(string){
		var t = NPos3d.Utils.Color,
			n = t.colorStringToHSLAArray(string),
			output = ['hsla(',n[0]+',',n[1]+'%,',n[2]+'%,',n[3],');'];
		return output.join('');
	},
	colorStringToRGBAArray:function(string){
		var t = NPos3d.Utils.Color, type = t.detectCSSColorType(string), nums = [],d;
		if(type === 'hex'){
			d = t.convertHexToRGBArray(string);
			nums.push(d[0],d[1],d[2],1);
		}
		else if(type === 'hsl'){
			d = t.parenColorToArray(string);
			d = t.hslArrayToRGBArray(d);
			nums.push(d[0],d[1],d[2],d[3]||1);
		}
		else if(type === 'rgb'){
			d = t.parenColorToArray(string);
			nums.push(d[0],d[1],d[2],d[3]||1);
		}
		return nums;
	},
	colorStringToRGBAString:function(string){
		var t = NPos3d.Utils.Color,
			output = ['rgba(',t.colorStringToRGBAArray(string).join(),');'];
		return output.join('');
	},

	//The following functions pulled from:
	//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 *
	 * @param   Number  r       The red color value
	 * @param   Number  g       The green color value
	 * @param   Number  b       The blue color value
	 * @return  Array           The HSL representation
	 */
	rgbToHsl:function(r, g, b){
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min){
			h = s = 0; // achromatic
		}else{
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return [h, s, l];
	},
	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   Number  h       The hue
	 * @param   Number  s       The saturation
	 * @param   Number  l       The lightness
	 * @return  Array           The RGB representation
	 */
	hslToRgb:function(h, s, l){
		var r, g, b;

		if(s == 0){
			r = g = b = l; // achromatic
		}else{
			function hue2rgb(p, q, t){
				if(t < 0) t += 1;
				if(t > 1) t -= 1;
				if(t < 1/6) return p + (q - p) * 6 * t;
				if(t < 1/2) return q;
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}

		return [r * 255, g * 255, b * 255];
	}
};
NPos3d.Fx = NPos3d.Fx || {};

NPos3d.Fx.Tween = function(args){
	var t = this, type = 'Tween';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	if(!args.object){
		throw 'Fx.Tween requires an Object as the value for the `object` argument in the passed configuration object.';
	}
	if(!args.properties){
		throw 'Fx.Tween requires an Object as the value for the `properties` argument in the passed configuration object.';
	}
	t.o = args.object;
	t.properties = args.properties;
	t.onUpdate = args.onUpdate || undefined;
	t.callback = args.callback || undefined;
	t.method = args.method || t.transitionLinear;
	t.frames = args.frames || 60;
	t.frameState = 0;
	t.frac = 0;
	t.initialValues = {};
	t.pos = [0,0,0]; // required if the tween is to be in the scene's update queue
	for(var p in t.properties){
		if(t.properties.hasOwnProperty(p)){
			var prop = t.properties[p];
			if(prop.length !== undefined){ //if property is an array, clone it
				t.initialValues[p] = t.o[p].slice(0);
			}else{
				t.initialValues[p] = t.o[p];
			}
		}
	}
	t.o.add(this);
	return t;
};

NPos3d.Fx.Tween.prototype = {
	type: 'Tween',
	transitionLinear:function(n){return n;},
	update:function(){
		var t = this;
		t.frac = t.method(t.frameState / t.frames);
		for(var p in t.properties){
			if(t.properties.hasOwnProperty(p)){
				var prop = t.properties[p];
				var init = t.initialValues[p];
				if(prop.length !== undefined){ //if property is an array, loop through it
					for(var i = 0; i < prop.length; i += 1){
						t.o[p][i] = init[i] + ((prop[i] - init[i]) * t.frac);
					}
				}else{
					t.o[p] = init + ((prop - init) * t.frac);
				}
			}
		}
		if(t.onUpdate !== undefined){
			t.onUpdate(t);
		}
		t.frameState += 1;
		if(t.frameState > t.frames){
			if(t.callback !== undefined){
				t.callback(t);
			}
			t.o.remove(t);
		}
	}
};
NPos3d.Fx = NPos3d.Fx || {};

NPos3d.Fx.Explosion = function(args){
	var t = this, type = 'Explosion';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	if(NPos3d.Utils === undefined || NPos3d.Utils.Color === undefined){throw 'Please load the `NPos3d.Utils.Color` library prior to invoking the NPos3d.Fx.Explosion effects.';}
	args = args || {};
	//NPos3d.blessWith3DBase(t,args);
	if(!args.object || !args.object.shape.lines || !args.object.transformedPointCache){
		throw 'Fx.Explosion requires an Ob3D as the value for the `object` argument in the passed configuration object.';
	}
	if(!args.scene || args.scene.type !== 'Scene'){
		throw 'Fx.Explosion requires a Scene as the value for the `scene` argument in the passed configuration object.';
	}
	t.o = args.object;
	args.scene.add(t);
	return t;
};

NPos3d.Fx.Explosion.prototype = {
	type: 'Explosion',
	update: function() {
		var t = this;
		t.lines = t.o.shape.lines;
		t.points = t.o.transformedPointCache;
		//console.log(t);
		t.lines.forEach(function(line){
			var p1 = t.points[line[0]],
				p2 = t.points[line[1]],
				color = t.o.color || t.o.shape.color || line[2] || t.o.scene.strokeStyle;
			t.scene.add(new NPos3d.Fx.ExplosionLine({
				p1:p1,
				p2:p2,
				object:t.o,
				scene:t.scene,
				colorArray: NPos3d.Utils.Color.colorStringToRGBAArray(color)
			}));
		});
		t.o.destroy();
		t.destroy();
	},
	destroy: NPos3d.destroyFunc
};

NPos3d.Fx.ExplosionLine = function(args){
	var t = this, type = 'ExplosionLine';
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	args.shape = {};
	NPos3d.blessWith3DBase(t,args);
	t.o = args.object;
	t.scene = args.scene;
	t.pos = t.o.gPos.slice(0);
	t.p1 = t.subVel(args.p1.slice(0), t.pos); //cloning the points
	t.p2 = t.subVel(args.p2.slice(0), t.pos);
	t.midpoint = t.getMidpoint();
	t.addVel(t.pos,t.midpoint);
	t.subVel(t.p1,t.midpoint);
	t.subVel(t.p2,t.midpoint);
	t.shape.points = [t.p1,t.p2];
	t.shape.lines = [[0,1]];
	t.colorArray = args.colorArray;
	t.vel = args.vel || [t.rint(2),t.rint(2),t.rint(2)];
	t.rotVel = args.rotVel || [t.rneg(2) * deg,t.rneg(2) * deg,t.rneg(2) * deg];
	t.lifespan = 50 + t.rint(100);
	t.life = t.lifespan;
	t.scene.add(t);
	return t;
};

NPos3d.Fx.ExplosionLine.prototype = {
	type: 'ExplosionLine',
	rneg:function(num){return ((Math.random()*2)-1)*num;},
	rint:function(num){return Math.round(((Math.random()*2)-1)*num);},
	rpos:function(n){return Math.random() * n;},
	rintpos:function(n){return Math.round(Math.random() * n);},
	getMidpoint:function(){
		var t = this;
		var length = [
			t.p2[0] - t.p1[0],
			t.p2[1] - t.p1[1],
			t.p2[2] - t.p1[2]
		];
		length[0] /= 2;
		length[1] /= 2;
		length[2] /= 2;
		length[0] += t.p1[0];
		length[1] += t.p1[1];
		length[2] += t.p1[2];
		return length;
	},
	addVel:function(o,v){
		o[0] += v[0];
		o[1] += v[1];
		o[2] += v[2];
		return o;
	},
	subVel:function(o,v){
		o[0] -= v[0];
		o[1] -= v[1];
		o[2] -= v[2];
		return o;
	},
	update:function(){
		var t = this,ca = t.colorArray;
		t.addVel(t.pos,t.vel);
		t.addVel(t.rot,t.rotVel);
		t.color = ['rgba(',ca[0],',',ca[1],',',ca[2],',',(ca[3] * (t.life / t.lifespan)),')'].join('');
		t.render();
		t.life -= 1;
		if(t.life < 1){
			t.destroy();
		}
	}
};
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
	t.axies = args.axies || [0,1,2];
	t.formCircle();
	return t;
};
NPos3d.Geom.Circle.prototype = {
	type: 'Circle',
	formCircle: function(){
		var t = this,
			m = NPos3d.Maths,
			slice = m.tau / t.segments,
			i, point, angle;
		t.points = [];
		t.lines = [];
		for(i = 0; i < t.segments; i += 1){
			point = [];
			angle = (slice * i) + t.offset;
			//relative x
			point[t.axies[0]] = m.cos(angle) * t.radius;
			//relative y
			point[t.axies[1]] = m.sin(angle) * t.radius;
			//relative z
			point[t.axies[2]] = 0;
			t.points.push(point);
			//creates the line between the current point and the previous point
			if(i > 0 && i <= t.segments){
				t.lines.push([i -1, i]); //,'#0f0'
				//closes the gap between the first point and the ending point
				if(i === t.segments -1){
					t.lines.push([i, 0]); //,'#f0f'
				}
			}
		}
		return t;
	}
};
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
};
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
