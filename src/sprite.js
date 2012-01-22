
NPos3d.Scene.prototype.drawSprite = function(o){
	var t = this,c = t.c;
	if(o.loaded){
		//offset the points by the object's position
		var p3 = o.pos;
		var p3 = t.getP3Offset(p3, t.camera.pos);
		if( p3[2] < t.camera.clipNear && p3[2] > t.camera.clipFar ){
			var p2 = t.project3Dto2D(p3);
			//Just some basic positional culling... if it's not on screen, don't render it...
			if((p2.x + (o.offset.x * p2.scale) < t.cx && p2.x - (o.offset.x * p2.scale) > -t.cx) && (p2.y + (o.offset.y * p2.scale) < t.cy && p2.y - (o.offset.y * p2.scale) > -t.cy)){
				c.save();
				c.translate(p2.x,p2.y);
				var scale = o.scale * p2.scale
				c.scale(scale,scale);
				c.rotate(o.rot);
				if(o.numFrames > 1){
					o.frameState += 0.3;
					//console.log(o);
					if(o.frameState >= o.numFrames){
						o.frameState = 0;
					}
					c.drawImage(o.image, (o.width * Math.floor(o.frameState)), 0, o.width, o.height, o.offset.x, o.offset.y, o.width, o.height);
				}else{
					c.drawImage(o.image, o.offset.x, o.offset.y);
				}
				c.restore();
			}
		}
	}
}

NPos3d.blessWithSpriteBase = function(o,config){
	if(!config.path){throw 'You MUST provide an image `path` value on sprite type objects!'};
	o.pos = config.pos || [0,0,0];
	o.rot = config.rot || 0;
	o.scale = config.scale || 1;
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
	o.image.src = config.path;
	return o;
}

NPos3d.Sprite3D = function(config){
	if(this === window){throw 'JIM TYPE ERROR'};
	var t = this;
	NPos3d.blessWithSpriteBase(t,config);
	return t;
}

NPos3d.Sprite3D.prototype = {
	update:function(s){
		s.drawSprite(this);
	},
	destroy:NPos3d.destroyFunc
};