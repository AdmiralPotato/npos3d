NPos3d.Geom.PN3 = function(args){
	var t = this;
	if(t===window){throw 'You must use the `new` keyword when calling a Constructor Method!';}
	var args = args || {};
	if(!args.path){throw 'You MUST provide an image `path` value!';}
	if(!args.callback){throw 'You MUST provide a `callback` method!';}

	t.centerData = args.centerData || true;
	t.scaleData = args.scaleData || true;

	t.id = args.id || 'PN3_default_canvas';

	if(t.centerData){
		var centerData = function(p3){return [p3[0] -128,p3[1] -128,p3[2] -128];}
	}else{
		var centerData = function(p3){return p3;}
	}

	if(t.scaleData){
		var scaleData = function(p3){return [p3[0]/256,p3[1]/256,p3[2]/256];}
	}else{
		var scaleData = function(p3){return p3;}
	}
	t.canvas = document.getElementById(t.id);
	if(!t.canvas){
		t.canvas = document.createElement('canvas');
		t.canvas.id = t.id;
	}
	t.canvas.style.display='block';
	t.canvas.style.position='fixed';
	t.canvas.style.right='0px';
	t.canvas.style.bottom='0px';
	t.canvas.style.zIndex = 9001;
	t.canvas.style.imageRendering = '-moz-crisp-edges';
	t.canvas.style.imageRendering = '-webkit-optimize-contrast';
	document.body.appendChild(t.canvas);
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
				}else{
					var pointColor = 'rgb(' + p4[0] + ',' + p4[1] + ',' + p4[2] + ')';
					var point = scaleData(centerData(p4));
					point[3] = pointColor;
					t.points.push(point);
					if(t.points.length > 1){
						t.lines.push([t.points.length -2, t.points.length -1, pointColor]);
					}
				}
			}
		}
		
		var p4 = t.getPixel(0,0);
		//console.log('First point color:',p4);
		t.lines.push([0, t.points.length -1, 'rgb(' + p4[0] + ',' + p4[1] + ',' + p4[2] + ')']);
		args.callback(t);
		//console.log(t);
	};
	t.image.src = args.path;
	return t;
}
NPos3d.Geom.PN3.prototype ={
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
	}
};

NPos3d.Geom.MeshToPng = function(args){
	var t = this;
	if(t===window){throw 'You must use the `new` keyword when calling a Constructor Method!';}
	var args = args || {};

	t.centerData = args.centerData || false;
	t.scaleData = args.scaleData || false;

	if(t.centerData){
		var centerData = function(p3){return [ p3[0] + 128, p3[1] + 128, p3[2] + 128 ];}
	}else{
		var centerData = function(p3){return p3;}
	}

	if(t.scaleData){
		var scaleData = function(p3){return [ Math.round(p3[0]*255), Math.round(p3[1]*255), Math.round(p3[2]*255) ];}
	}else{
		var scaleData = function(p3){return p3;}
	}

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
	t.canvas.width = t.size;
	t.canvas.height = t.size;
	t.imageData = t.c.getImageData(0,0,t.canvas.width,t.canvas.height);
	t.data = t.imageData.data


	//Because I want beautiful images, damnit.
	//t.points.sort(t.sortPointsByHueAndLum);
	//t.points.sort(t.sortPointsByLum);
	//t.points.sort();

	//I realize that this loop could be a little more performant, but you're not saving mesh to a PNG every frame.
	var pointNum = 0;
	for(var y = 0; y < t.size; y += 1){
		for(var x = 0; x < t.size; x += 1){
			if(pointNum < t.points.length){
				var p3 = centerData(scaleData(t.points[pointNum]));
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
	}
	t.c.putImageData(t.imageData,0,0);
	t.image = new Image();
	t.image.src=t.canvas.toDataURL();
	t.image.style.display='block';
	t.image.style.position='absolute';
	t.image.style.top=0;
	t.image.style.right='0px';
	t.image.style.zIndex=9001;
	//document.body.appendChild(t.canvas);
	document.body.appendChild(t.image);
	//console.log(t);

	var justAColor = t.getHslFromRgb([0,0,0]);
	console.log('justAColor',justAColor);

	return t;
};

NPos3d.Geom.MeshToPng.prototype={
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