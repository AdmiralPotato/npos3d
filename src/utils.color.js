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