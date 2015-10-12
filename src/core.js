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
		o.expired = true;
	},
	destroyFunc: function () {
		if (this.onRemove !== undefined) {
			this.onRemove();
		}
		this.expired = true;
	},
	updateMatricesFunc: function(viewMatrix) {
		var t = this,
			m = NPos3d.Maths,
			p = t.parent;
		//localScale: ,
		//localRotation: ,
		//localComposite: ,
		//globalComposite

		//START updating the object's local matrices

		//scale
		m.mat4P3Scale(m.__mat4Identity, t.scale, t.matrices.localScale);

		//rotate
		m.eulerToMat4(t.rot, t.rotOrder, t.matrices.localRotation);

		//composite matrix starts out as scale, no need to multiply
		m.mat4Set(t.matrices.localComposite, t.matrices.localScale);
		m.mat4Mul(t.matrices.localComposite, t.matrices.localRotation, t.matrices.localComposite);
		//no need to multiply the local composite, adding 3 keys will be faster
		//this is also why we don't need a local localPosition matrix.
		m.mat4P3Translate(t.matrices.localComposite, t.pos, t.matrices.localComposite);

		//END updating the object's local matrices

		//Multiply the localComposite by the patent's globalComposite to get this object's globalComposite
		if(p && !p.isScene){
			m.mat4Mul(t.matrices.localComposite, p.matrices.globalComposite, t.matrices.globalComposite);
		} else if(viewMatrix != undefined) {
			m.mat4Mul(t.matrices.localComposite, p.viewMatrix, t.matrices.globalComposite);
		} else {
			m.mat4Set(t.matrices.globalComposite, t.matrices.localComposite);
		}

		m.p3Mat4Mul([0,0,0], t.matrices.globalComposite, t.gPos); //because it rocks to be able to read a global position
		m.p3Mat4Mul(t.scale, t.matrices.globalComposite, t.gScale); //Would this even work?
	},
	recursivelyUpdateMatrices: function rUM(o) {
		if(o.parent && !o.parent.isScene) {
			rUM(o.parent);
		}
		o.updateMatrices();
	},
	transformPoints: function(o, outPoints) {
		var m = NPos3d.Maths, i;
		for (i = 0; i < o.shape.points.length; i += 1) {
			outPoints[i] = m.p3Mat4Mul(o.shape.points[i], o.matrices.globalComposite, outPoints[i]);
		}
	},
	getTransformedPointsFunc: function(){
		var t = this;
		var transformedPoints = [];
		if(t.shape && t.shape.points && t.shape.points.length){
			NPos3d.recursivelyUpdateMatrices(t);
			NPos3d.transformPoints(t, transformedPoints);
		}
		return transformedPoints;
	},
	getWorldPositionFunc: function(){
		NPos3d.recursivelyUpdateMatrices(this);
		return NPos3d.Maths.p3Mat4Mul([0,0,0], this.matrices.globalComposite);
	},
	renderFunc: function(){
		//This function should be assigned to objects in the scene which will be rendered;
		//Example: myObject.render = NPos3d.renderFunc;
		var t = this; //should be referring to the object being rendered
		t.updateMatrices(t, t.scene.viewMatrix);
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
		if(t.postRender){
			t.postRender();
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

	t.camera = args.camera || new NPos3d.Camera({scene: t});

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

	t.add(t.camera);
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
	updateRecursively: function updateRecursively(o){
		if(!o.isScene){
			o.update();
		}
		if(o.children){
			o.children.forEach(updateRecursively);
		}
	},
	renderRecursively: function renderRecursively(o){
		if(!o.isScene && o.render){
			o.render();
		}
		if(o.children){
			o.children.forEach(renderRecursively);
		}
	},
	removeExpiredChildrenRecursively: function rECR(o){
		var len, i, child;
		if(o.children){
			len = o.children.length;
			for (i = len - 1; i >= 0; i -= 1) {
				child = o.children[i];
				rECR(child);
				if(child.expired){
					o.children.splice(i,1);
					child.expired = false;
					child.parent = false;
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
				if(newChild.expired) {
					newChild.expired = false;
				}
				else {
					o.children.push(newChild);
					newChild.parent = o;
					newChild.scene = scene;
					if(newChild.onAdd !== undefined){
						newChild.onAdd();
					}
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
			t.addNewChildrenRecursively(t);
			t.updateRecursively(t);
			t.viewMatrix = t.inverseMatrix(t.camera);
			t.renderRecursively(t);
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
	inverseMatrix: function(o) {
		var m = NPos3d.Maths;
		var resultMatrix = m.makeMat4();
		do {
			var rotationMatrix = m.makeMat4();
			m.eulerToMat4(
				o.rot.map(function(n){
					return -n
				}),
				o.rotOrder.slice().reverse(),
				rotationMatrix
			);
			m.mat4P3Translate(resultMatrix, [-o.pos[0], -o.pos[1], -o.pos[2]], resultMatrix);
			m.mat4Mul(resultMatrix, rotationMatrix, resultMatrix);
			m.mat4P3Scale(resultMatrix, o.scale.map(function(n){
				return -n
			}));
			o = o.parent;
		} while(o && !o.isScene);
		return resultMatrix;
	},
	updateTransformedPointCache: function (o){
		var t = this, m = NPos3d.Maths, i, currentGlobalCompositeMatrixString;
		if(o.transformedPointCache.length !== o.shape.points.length){
			o.transformedPointCache.length = 0; //empty the array, keep the object reference
			o.lastGlobalCompositeMatrixString = false;
		}
		currentGlobalCompositeMatrixString = o.matrices.globalComposite.toString();
		if (!o.lastGlobalCompositeMatrixString || o.lastGlobalCompositeMatrixString !== currentGlobalCompositeMatrixString) {
			NPos3d.transformPoints(o, o.transformedPointCache);
			o.boundingBox = m.nGetBounds(o.transformedPointCache);
			o.lastGlobalCompositeMatrixString = currentGlobalCompositeMatrixString;
		}
	},
	lineRenderLoop: function (o) {
		var t = this, m = NPos3d.Maths,
			i, p3a, p3b;
		for (i = 0; i < o.shape.lines.length; i += 1) {
			//offset the points by the object's position
			p3a = o.transformedPointCache[o.shape.lines[i][0]];
			p3b = o.transformedPointCache[o.shape.lines[i][1]];

			//if the depths of the first and second point in the line are not behind the camera...
			//and the depths of the first and second point in the line are closer than the far plane...
			if (
				p3a[2] < t.camera.clipNear &&
				p3b[2] < t.camera.clipNear &&
				p3a[2] > t.camera.clipFar &&
				p3b[2] > t.camera.clipFar
			) {

				var p0 = t.camera.project3Dto2D(p3a);
				var p1 = t.camera.project3Dto2D(p3b);
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
				bbp = t.camera.project3Dto2D(bbCube[i]);
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
		if (
			bbMaxOffset[2] > t.camera.clipFar &&
			bbMinOffset[2] < t.camera.clipNear &&
			bbMaxOffset[2] > t.camera.clipFar &&
			bbMaxOffset[2] < t.camera.clipNear
		) {
			//Alright. It's in front and not behind. Now is the bounding box even partially on screen?
			//8 points determine the cube... let's start from the top left, spiraling down clockwise
			bbCube = m.makeBBCubeFromTwoPoints(bbMinOffset,bbMaxOffset);
			bbOffScreen = true;
			//At some point in the future if I wanted to get really crazy, I could probably determine which order
			//to sort the array above to orient the point closest to the center of the screen nearest the first of the list,
			//so I don't bother checking all 8 points to determine if it's on screen - or even off screen.
			for (i = 0; i < bbCube.length && bbOffScreen; i += 1) {
				bbp = t.camera.project3Dto2D(bbCube[i]);
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
		var t = this, m = NPos3d.Maths,
			i, p3a, p0, screenBounds, circleArgs;
		for (i = 0; i < o.transformedPointCache.length; i += 1) {
			//offset the points by the object's position
			p3a = o.transformedPointCache[i];
			//if the depth of the point is not behind the camera...
			//and the depth of the point is closer than the far plane...
			if (p3a[2] < t.camera.clipNear && p3a[2] > t.camera.clipFar) {
				p0 = t.camera.project3Dto2D(p3a);
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
	args = args || {};
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	if(!args.scene){throw 'You must provide a `scene` property when invoking the ' + type + ' constructor.';}
	NPos3d.blessWith3DBase(t, args);
	//Field Of View; Important!
	t.clipNear = args.clipNear || -0.01;
	t.clipFar = args.clipFar || -9001;
	t.frustumMultiplier = args.frustumMultiplier || 0.75;
};
NPos3d.Camera.prototype = {
	type: 'Camera',
	update: function(){
		var t = this;
		t.pos[2] = Math.max(t.scene.w, t.scene.h) * t.frustumMultiplier;
		// RECIPROCAL width / height of the frustum at ONE unit away from the camera
		// this arranges it so that it is exactly the right number of pixels where z=0, given where the camera is now
	},
	project3Dto2D: function (p3) {
		var t = this,
			canvasDim = Math.max(t.scene.w, t.scene.h),
			scale = 1 / -p3[2],
			p2 = {
				x: (p3[0] * canvasDim * t.frustumMultiplier * scale),
				y: (p3[1] * canvasDim * t.frustumMultiplier * scale),
				scale: canvasDim * t.frustumMultiplier * scale,
				color: p3[3] || false
			};
		return p2;
	}
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
	o.scene = args.scene;

	o.expired = false;
	o.add = NPos3d.addFunc;
	o.remove = NPos3d.removeFunc;
	o.destroy = NPos3d.destroyFunc;
	o.render = NPos3d.renderFunc;
	o.getTransformedPoints = NPos3d.getTransformedPointsFunc;
	o.getWorldPosition = NPos3d.getWorldPositionFunc;
	o.updateMatrices = NPos3d.updateMatricesFunc;
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
	update: function () {}
};
