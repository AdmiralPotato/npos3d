NPos3d.Geom.PN3 = function(args){
	var t = this, type = 'PN3', centerData, scaleData;
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};
	if(!args.path){throw 'You MUST provide an image `path` value!';}
	if(!args.callback){throw 'You MUST provide a `callback` method!';}
	t.callback = args.callback;

	t.centerData = args.centerData || true;
	t.scaleData = args.scaleData || true;

	t.id = args.id || 'PN3_default_canvas';
	t.showCanvas = args.showCanvas || true;

	if(t.centerData){
		centerData = function(p3){return [p3[0] -128,p3[1] -128,p3[2] -128];}
	}else{
		centerData = function(p3){return p3;}
	}

	if(t.scaleData){
		scaleData = function(p3){return [p3[0]/256,p3[1]/256,p3[2]/256];}
	}else{
		scaleData = function(p3){return p3;}
	}
	t.canvas = document.getElementById(t.id);
	if(!t.canvas){
		t.canvas = document.createElement('canvas');
		t.canvas.id = t.id;
	}
	if(t.showCanvas){
		t.canvas.style.display='block';
		t.canvas.style.position='fixed';
		t.canvas.style.right='0px';
		t.canvas.style.bottom='0px';
		t.canvas.style.zIndex = 9001;
		t.canvas.style.imageRendering = '-moz-crisp-edges';
		t.canvas.style.imageRendering = '-webkit-optimize-contrast';
		document.body.appendChild(t.canvas);
	}
	t.c = t.canvas.getContext('2d');
	t.width = 0;
	t.height = 0;
	t.loaded = false;
	t.data = false;
	t.points = [];
	t.lines = [];
	t.image = new Image();
	t.image.onload = function(){
		t.width = t.image.width;
		t.height = t.image.height;
		t.loaded = true;
		t.canvas.width = t.width;
		t.canvas.height = t.height;
		t.c.clearRect(0,0,t.width,t.height); //clearing the canvas, in case anything is left from an image with the same size loading in.
		t.canvas.style.width = t.width * 4 + 'px';
		t.canvas.style.height = t.height * 4 + 'px';
		t.c.drawImage(t.image,0,0);
		t.data = t.c.getImageData(0,0,t.width,t.height).data;
		for(var y = 0; y < t.height; y += 1){
			for(var x = 0; x < t.width; x += 1){
				var p4 = t.getPixel(x,y);
				//console.log(p4);
				if(p4[0] == 0 && p4[1] == 0 && p4[2] == 0 && p4[3] == 0){
					//console.log('I did nothing because it was transparent black!');
				}else if(p4[3] == 0){
					//console.log('I did nothing because it was completely transparent!');
				}else if(p4[3] == 128){
					//t.lines.push(t.convertP4ToLine(p4)); //Broken until Color Gamma Shift on Transparent Pixels is addressed
				}else{
					var pointColor = 'rgb(' + p4[0] + ',' + p4[1] + ',' + p4[2] + ')';
					var point = scaleData(centerData(p4));
					point[3] = pointColor;
					t.points.push(point);
					if(t.points.length > 1){
						//t.lines.push([t.points.length -2, t.points.length -1, pointColor]);
					}
				}
			}
		}

		//var p4 = t.getPixel(0,0);
		//console.log('First point color:',p4);
		//t.lines.push([0, t.points.length -1, 'rgb(' + p4[0] + ',' + p4[1] + ',' + p4[2] + ')']);
		t.callback(t);
		//console.log(t);
	};
	t.image.src = args.path;
	return t;
}
NPos3d.Geom.PN3.prototype ={
	type: 'PN3',
	getOffset:function(x,y){return (x + (y * this.canvas.width)) * 4;},
	setPixel:function(x,y,rgba){
		var offset = this.getOffset(x,y);
		this.data[offset] = rgba[0];
		this.data[offset + 1] = rgba[1];
		this.data[offset + 2] = rgba[2];
		this.data[offset + 3] = rgba[3];
	},
	getPixel:function(x,y){
		var offset = this.getOffset(x,y);
		return [this.data[offset],this.data[offset + 1],this.data[offset + 2],this.data[offset + 3]];
	},
	stringPad:function(string, numChars, padChar){
		string = string.toString();
		while(string.length < numChars){
			string = padChar + string;
		}
		return string;
	},
	convertP4ToLine:function(p4){
		var t = this;
		console.log('---- p4:',p4);
		//var hex0 = parseInt(p4[0]).toString();
		//var hex1 = parseInt(p4[1]).toString();
		//var hex2 = parseInt(p4[2]).toString();
		//console.log('hex0:',hex0,'hex1:',hex1,'hex2:',hex2);
		var hex0 = t.stringPad(p4[0].toString(16),2,'0');
		var hex1 = t.stringPad(p4[1].toString(16),2,'0');
		var hex2 = t.stringPad(p4[2].toString(16),2,'0');
		//console.log('hex0:',hex0,'hex1:',hex1,'hex2:',hex2);
		var wholeString = hex0 + hex1 + hex2;
		//console.log('wholeString:',wholeString);
		var point0 = parseInt('0x' + wholeString.slice(0,3));
		var point1 = parseInt('0x' + wholeString.slice(3));
		var line = [point0,point1];
		//console.log('line:',line);
		return line;
	}
};

NPos3d.Geom.MeshToPng = function(args){
	var t = this, type = 'MeshToPng', key;
	if(t.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	args = args || {};

	t.centerData = initVal(args.centerData, false);
	t.scaleData = initVal(args.scaleData, true);



	t.canvas = document.createElement('canvas');
	//t.canvas.style.display='block';
	//t.canvas.style.position='absolute';
	//t.canvas.style.top='50%';
	//t.canvas.style.left='50%';
	//document.body.appendChild(t.canvas);
	//t.canvas.style.zIndex=9001;
	t.c = t.canvas.getContext('2d');
	t.points = args.points || [];
	t.lines = args.lines || [];
	t.size = t.getSquarePower(t.points.length);
	//t.size = t.getSquarePower(t.points.length + t.lines.length); //Broken until Color Gamma Shift on Transparent Pixels is addressed
	t.canvas.width = t.size;
	t.canvas.height = t.size;
	t.imageData = t.c.getImageData(0,0,t.canvas.width,t.canvas.height);
	t.data = t.imageData.data;

	t.boundingBox = NPos3d.Maths.nGetBounds(t.points);
	t.boundingLengths = {
		x: t.boundingBox[1][0] - t.boundingBox[0][0],
		y: t.boundingBox[1][1] - t.boundingBox[0][1],
		z: t.boundingBox[1][2] - t.boundingBox[0][2]
	};
	t.centerScale = Math.max(
		Math.abs(t.boundingBox[0][0]),
		Math.abs(t.boundingBox[0][1]),
		Math.abs(t.boundingBox[0][2]),
		t.boundingBox[1][0],
		t.boundingBox[1][1],
		t.boundingBox[1][2]
	);
	t.boundingScale = Math.max(t.boundingLengths.x, t.boundingLengths.y, t.boundingLengths.z);
	for(key in t.boundingLengths){
		if(t.boundingLengths.hasOwnProperty(key) && t.boundingLengths[key] === t.boundingScale){
			t.largestAxis = key;
		}
	}
	t.halves = {
		x: t.boundingLengths.x / 2,
		y: t.boundingLengths.y / 2,
		z: t.boundingLengths.z / 2
	};
	t.scaledHalves = {
		x: t.boundingLengths.x / 2 / t.boundingScale,
		y: t.boundingLengths.y / 2 / t.boundingScale,
		z: t.boundingLengths.z / 2 / t.boundingScale
	};
	console.log('boundingBox:',t.boundingBox,'boundingScale:',t.boundingScale,'boundingLengths:',t.boundingLengths,'centerScale:',t.centerScale);

	if(t.scaleData && t.centerData){
		var processVertex = function(p3){
			return t.scaleNormalizedVertexToColor(t.centerNormalizedData(t.normalizeVertexToBoundingScale(t.resetVertexOrigin(p3))));
		}
	}else if(t.scaleData && !t.centerData){
		var processVertex = function(p3){
			return t.scaleNormalizedVertexToColor(t.offsetNormalizedVertexOrigin(t.normalizeVertexToCenterScale(p3)));
		}
	}else if(!t.scaleData && t.centerData){
		var processVertex = function(p3){
			return t.roundVertexToColor(t.centerData(p3));
		}
	}else{ // No scaling, no centering - Assumes user passed in content based on a 255 unit cube starting at 0,0,0
		var processVertex = function(p3){
			return t.roundVertexToColor(p3);
		}
	}


	//Because I want beautiful images, damnit.
	//t.points.sort(t.sortPointsByHueAndLum);
	//t.points.sort(t.sortPointsByLum);
	//t.points.sort();

	var y, x; //Positions of Pixels to store data in

	//#### START STORING VERTEX DATA! ####
	//I realize that this loop could be a little more performant, but you're not saving mesh to a PNG every frame.
	var pointNum = 0;
	for(y = 0; y < t.size && pointNum < t.points.length; y += 1){
		for(x = 0; x < t.size && pointNum < t.points.length; x += 1){
			if(pointNum < t.points.length){
				var p3 = processVertex(t.points[pointNum]);
				var p4 = [p3[0],p3[1],p3[2],255];
				//var p4 = [255,255,0,255];
				t.setPixel(x,y,p4);
				//console.log(p4);
				/*
				if(t.points.length > 1){
					t.lines.push([t.points.length -2, t.points.length -1, 'rgb(' + p4[0] + ',' + p4[1] + ',' + p4[2] + ')']);
				}
				*/
			}else{
				break;
			}
			pointNum += 1;
		}
		if(pointNum > t.points.length){
			break;
		}
	}
	//#### END STORING VERTEX DATA! ####

	//#### START STORING LINE DATA! ####
	//Broken until Color Gamma Shift on Transparent Pixels is addressed
	/*
	console.log('Starting Line storage!',t.size, y, x);
	var lineNum = 0;
	y -= 1;
	while(y < t.size && lineNum < t.lines.length){
		while(x < t.size && lineNum < t.lines.length){
			if(lineNum < t.lines.length){
				var p4 = t.convertLineToP4(t.lines[lineNum]);
				t.setPixel(x,y,p4);
			}else{
				break;
			}
			lineNum += 1;
			x += 1;
		}
		y += 1;
	}
	*/
	//#### END STORING LINE DATA! ####

	t.c.putImageData(t.imageData,0,0);
	t.displayImage = initVal(args.displayImage,true);
	if(t.displayImage){
		t.image = new Image();
		t.image.src=t.canvas.toDataURL();
		t.image.style.display='block';
		t.image.style.position='absolute';
		t.image.style.bottom=0;
		t.image.style.left=0;
		t.image.style.zIndex=9001;
		//document.body.appendChild(t.canvas);
		document.body.appendChild(t.image);
	}
	//console.log(t);

	//var justAColor = t.getHslFromRgb([0,0,0]);
	//console.log('justAColor',justAColor);
	console.log(t);
	return t;
};

NPos3d.Geom.MeshToPng.prototype={
	type: 'MeshToPng',
	stringPad:NPos3d.Geom.PN3.prototype.stringPad,
	convertLineToP4:function(line){
		var t = this;
		//4096 is the 12 bit barrier. Anything past there would only error.
		console.log('---- line: ',line);
		if(line[0] > 4095|| line[1] > 4095){throw 'Sorry, but the PN3 spec currently only has support for up to 4096 lines.';}
		var point0 = line[0].toString(16);
		var point1 = line[1].toString(16);
		//console.log('point0:',point0,'point1:',point1);
		point0 = t.stringPad(point0,3,'0');
		point1 = t.stringPad(point1,3,'0');
		//console.log('point0:',point0,'point1:',point1);
		var wholeString = point0 + point1;
		//console.log('wholeString:',wholeString);
		var bin0 = wholeString.slice(0,2);
		var bin1 = wholeString.slice(2,4);
		var bin2 = wholeString.slice(4);
		//console.log('bin0:',bin0,'bin1:',bin1,'bin2:',bin2);
		bin0 = parseInt(bin0,16);
		bin1 = parseInt(bin1,16);
		bin2 = parseInt(bin2,16);
		//console.log('bin0:',bin0,'bin1:',bin1,'bin2:',bin2);
		var p4 = [bin0,bin1,bin2, 128];
		console.log('p4:',p4);
		return p4;
	},
	normalizeVertexToCenterScale:function(p3){
		var t = this, output = [
			(p3[0] / t.centerScale) /2,
			(p3[1] / t.centerScale) /2,
			(p3[2] / t.centerScale) /2
		];
		return output;
	},
	normalizeVertexToBoundingScale:function(p3){
		var t = this;
		return [
			p3[0] / t.boundingScale,
			p3[1] / t.boundingScale,
			p3[2] / t.boundingScale
		];
	},
	resetVertexOrigin:function(p3){
		var t = this;
		return [ //Put data origin at 0, all data becomes positive
			p3[0] - t.boundingBox[0][0],
			p3[1] - t.boundingBox[0][1],
			p3[2] - t.boundingBox[0][2]
		];
	},
	offsetNormalizedVertexOrigin:function(p3){
		var t = this;
		return [ //Put data origin at 0.5, all data becomes positive
			p3[0] + 0.5,
			p3[1] + 0.5,
			p3[2] + 0.5
		];
	},
	centerNormalizedData:function(p3){
		var t = this;
		//Vertex should be normalized before passing through here.
		if(Math.max(Math.abs(p3[0]),Math.abs(p3[1]),Math.abs(p3[2])) > 1){throw 'Invalid Vertex. The centerNormalizedData function expects normalized input. (0 through 1)';}
		//console.log('p3',p3);
		var centered = [
			p3[0] - t.scaledHalves.x,
			p3[1] - t.scaledHalves.y,
			p3[2] - t.scaledHalves.z
		];
		//console.log('centered',centered);
		var offset = t.offsetNormalizedVertexOrigin(centered);
		//console.log('offset',offset);
		return offset;
	},
	centerData:function(p3){
		var t = this;
		//Vertex should be no more than 127 before passing through here.
		if(Math.max(Math.abs(p3[0]),Math.abs(p3[1]),Math.abs(p3[2])) > 255){throw 'Invalid Vertex. The centerData function expects normalized input. (0 through 1)';}
		//console.log('p3',p3);
		var centered = [
			p3[0] - t.halves.x + 127,
			p3[1] - t.halves.y + 127,
			p3[2] - t.halves.z + 127
		];
		return centered;
	},
	scaleNormalizedVertexToColor:function(p3){
		var t = this;
		//console.log(p3);
		if( p3[0] > 1 || p3[0] < 0 || p3[1] > 1 || p3[1] < 0 || p3[2] > 1 || p3[2] < 0 ){throw 'Invalid Vertex. The scaleNormalizedVertexToColor function expects normalized input. (0 through 1)';}
		return [ //Scale from (0 through 1) to (0 through 255) as an int
			Math.round(p3[0]*255),
			Math.round(p3[1]*255),
			Math.round(p3[2]*255)
		];
	},
	roundVertexToColor:function(p3){
		var t = this;
		return [ //Quantize (0 through 255) to an int
			Math.round(p3[0]),
			Math.round(p3[1]),
			Math.round(p3[2])
		];
	},

	getOffset:NPos3d.Geom.PN3.prototype.getOffset,
	setPixel:NPos3d.Geom.PN3.prototype.setPixel,
	getPixel:NPos3d.Geom.PN3.prototype.getPixel,
	sortPointsByLum:function(a,b){return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]);},
	sortPointsByHueAndLum:function(a,b){
		var LumDifference = (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]);
		//var aHsl = NPos3d.Geom.MeshToPng.prototype.getHslFromRgb(a);
		//var bHsl = NPos3d.Geom.MeshToPng.prototype.getHslFromRgb(a);
		//console.log(aHsl);
		//console.log(bHsl);
		return LumDifference;
	},
	getHslFromRgb:function(rgb){
		//console.log('getHslFromRgb running!');
		//This math thanks to: http://en.literateprograms.org/RGB_to_HSV_color_space_conversion_(C)
		var hsv = [];
		var rgb_max = 255;
		/* Compute hue */
		if(rgb[0] === rgb_max){
			hsv[0] = 0.0 + (60.0 * (rgb[1] - rgb[2]));
			if(hsv[0] < 0.0){
					hsv[0] += 360.0;
			}
		}else if (rgb[1] === rgb_max){
			hsv[0] = 120.0 + (60.0 * (rgb[2] - rgb[0]));
		}else{
			hsv[0] = 240.0 + (60.0 * (rgb[0] - rgb[1]));
		}
		return hsv;
	},
	sortPointsByWhat:function(a,b){return (a[0] + (a[1] * 2) + (a[2] * 4)) - (b[0] + (b[1] * 2) + (b[2] * 4));},
	getSquarePower:function(num){
		var doubled = 1;
		for(var i = 0; i < 12; i += 1){
			doubled*=2;
			doubled*=2;
			if(num < doubled){
				output = Math.sqrt(doubled);
				//console.log('Returning:',output,' from:',doubled);
				return output;
			}else{
				//console.log(num,'>',doubled);
			}
		}
		return false;
	}

};