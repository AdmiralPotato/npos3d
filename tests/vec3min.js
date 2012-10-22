var Vec3 = function(args){
	var type = 'Vec3', v;
	if(this.type !== type){throw 'You must use the `new` keyword when invoking the ' + type + ' constructor.';}
	v = this.parseArgs(arguments);
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
	return this;
};

Vec3.prototype = {
	type: 'Vec3',
	parseArgs: function(){
		var output;
		if(arguments.length === 3) { //vanilla
			output = {x: arguments[0],y: arguments[1],z: arguments[2]};
		} else if(arguments[0].length !== undefined && arguments[0].length > 2) { //is array
			output = {x: arguments[0][0],y: arguments[0][1],z: arguments[0][2]};
		}else if(arguments[0].x !== undefined && arguments[0].y !== undefined && arguments[0].z !== undefined) { //is object
			output = arguments[0];
		} else {
			output = {x: 0, y: 0, z: 0};
		}
		return output;
	},
	clone:function(){
		return new Vec3(this);
	},
	add:function(){
		var v = this.parseArgs(arguments);
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	},
	sub:function(){
		var v = this.parseArgs(arguments);
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	},
	mul:function(num){
		num = parseFloat(num);
		this.x *= num;
		this.y *= num;
		this.z *= num;
		return this;
	},
	div:function(num){
		num = parseFloat(num);
		this.x /= num;
		this.y /= num;
		this.z /= num;
		return this;
	},
	scale:function(v){
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
		return this;
	},
	length:function(){
		return Math.sqrt((this.x*this.x) + (this.y*this.y) + (this.z*this.z));
	},
	sqlen:function(){
		return ((this.x*this.x) + (this.y*this.y) + (this.z*this.z));
	},
	length2d:function(x,y){
		return Math.sqrt((x*x) + (y*y));
	},
	rotate2d:function(x,y,r){
		//current Radians, current Length
		var cR = Math.atan2(y,x),
			cL = this.length2d(x,y);
		var newX = Math.sin(cR + r) * cL;
		var newY = Math.cos(cR + r) * cL;
		return [newX,newY];
	},
	rotate:function(rot,order){
		order = order || [0,1,2];
		//Alright, here's something interesting.
		//The order you rotate the dimensions is IMPORTANT to rotation animation!
		//Here's my quick, no math approach to applying that.
		for(var r = 0; r < order.length; r += 1){
			if(order[r] === 0){
				//x...
				if(rot[0] !== 0){
					var zy = this.rotate2d(this.z,this.y,rot[0]);
					this.z = zy[0];
					this.y = zy[1];
				}
			}else if(order[r] === 1){
				//y...
				if(rot[1] !== 0){
					var xz = this.rotate2d(this.x,this.z,rot[1]);
					this.x = xz[0];
					this.z = xz[1];
				}
			}else if(order[r] === 2){
				//z...
				if(rot[2] !== 0){
					var xy = this.rotate2d(this.x,this.y,rot[2]);
					this.x = xy[0];
					this.y = xy[1];
				}
			}else{
				throw 'up';
			}
		}
		return this;
	},
	set:function(){
		var v = this.parseArgs(arguments);
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		return this;
	},
	toString:function(){
		return 'Vec3 { x:'+this.x+', y:'+this.y+', z:'+this.z+'}';
	},
	toUrlString:function(){
		return this.x+this.sep+this.y+this.sep+this.z;
	},
	normalize:function(){
		this.div(this.length());
		return this;
	}
};