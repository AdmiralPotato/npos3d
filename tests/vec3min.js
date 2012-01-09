var Vec3 = function(p){
	var v = p || [0,0,0];
	if(this===window){throw 'This is a constructor method. You must create "new" instances of it.';}
	this.x = v[0];
	this.y = v[1];
	this.z = v[2];
	//console.log('creating a new Vec2');
	return this;
};

Vec3.prototype = {
	sep:'x',
	clone:function(){
		return new Vec3(this);
	},
	add:function(v){
		this.x += v[0];
		this.y += v[1];
		this.z += v[2];
		return this;
	},
	sub:function(v){
		this.x -= v[0];
		this.y -= v[1];
		this.z -= v[2];
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
		this.x *= v[0];
		this.y *= v[1];
		this.z *= v[2];
		return this;
	},
	length:function(){
		return Math.sqrt((this.x*this.x) + (this.y*this.y) + (this.z*this.z));
	},
	sqlen:function(){
		return ((this.x*this.x) + (this.y*this.y) + (this.z*this.z));
	},
	angle2d:function(x,y){
		return Math.atan2(x,y);
	},
	length2d:function(x,y){
		return Math.sqrt((x*x) + (y*y));
	},
	rotate2d:function(x,y,r){
		x = parseFloat(x);
		y = parseFloat(y);
		//the r stands for radians
		r = parseFloat(r);
		//current Radians, current Length
		var cR = this.angle2d(x,y);
		var cL = this.length2d(x,y);
		var newX = Math.sin(cR + r) * cL;
		var newY = Math.cos(cR + r) * cL;
		return [newX,newY];
	},
	rotate:function(rot,order){
		var order = order || [0,1,2];
		var xr = rot[0], yr = rot[1], zr = rot[2];
		//Alright, here's something interesting.
		//The order you rotate the dimentions is IMPORTANT to rotation animation!
		//Here's my quick, no math approach to applying that.
		for(var r = 0; r < order.length; r += 1){
			if(order[r] === 0){
				//x...
				if(xr !== 0){
					var zy = this.rotate2d(this.z,this.y,xr);
					this.z = zy[0];
					this.y = zy[1];
				}
			}else if(order[r] === 1){
				//y...
				if(yr !== 0){
					var xz = this.rotate2d(this.x,this.z,yr);
					this.x = xz[0];
					this.z = xz[1];
				}
			}else if(order[r] === 2){
				//z...
				if(zr !== 0){
					var xy = this.rotate2d(this.x,this.y,zr);
					this.x = xy[0];
					this.y = xy[1];
				}
			}else{
				throw 'up';
			}
		}
		return this;
	},
	set:function(v){
		this.x = v[0];
		this.y = v[1];
		this.z = v[2];
		return this;
	},
	toString:function(){
		return 'Vec3 { x:'+this.x+', y:'+this.y+', z:'+this.z+'}';
	},
	toUrlString:function(){
		return this.x+this.sep+this.y+this.sep+this.z;
	},
	clone:function(){
		return new Vec3(this);
	},
	normalize:function(){
		this.div(this.length());
		return t;
	}
};