<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="generator" content="Admiral's Hands">
<title></title>
<style>
*{
	margin: 0px;
	padding: 0px;
	border: 0px;
	outline: 0px;
}
html,body,#canvas{
height: 100%;
width: 100%;
}
body{
	background-color: #000;
}
#canvas{
	position: fixed;
}
#controls{
	position: absolute;
	top: 0px;
	left: 0px;
	padding: 16px;
	background-color: rgba(255,255,255,0.1);
	color: #9f0;
	font-size: 12px;
	line-height: 16px;
	font-family: monospace;
	white-space: pre-wrap;
}
#your_data{
	display: none;
}
</style>
</head>
<body><canvas id="canvas"></canvas>
<div id="controls">
Upload an OBJ file. Or else.
Moving the your mouse rotates your shape.
Scrolling controlls camera Z

<form action="" method="post" enctype="multipart/form-data"><input type="file" name="file" size="90000000000000001"><input type="submit"></form>
</div><div id="your_data"><?php

if(!empty($_FILES['file']['tmp_name'])){
	//Stripping tags just in case anybody gets the idea to upload anything malicious.
	echo strip_tags(file_get_contents($_FILES['file']['tmp_name']));
}

?></div><script>
//--------------------------------
//Basic scene setup
//--------------------------------

var canvas = document.getElementById('canvas');
var c = canvas.getContext('2d');
var w=0,h=0,cx=0,cy=0,wph=0;
var pi = Math.PI;
var tau = pi * 2;

//Field Of View; Important!
var fov = 550;
var clipNear = fov; //This line is also VERY important! Never have the clipNear less than the FOV!
var clipFar = -1000;

//Kind of a hack, but it works in a pinch.
var camera = [0,0,0];

//which is short for renderQueue - push ob3Ds into this to get them to show up in the scene
//invoke [ob].destroy(); to remove an ob3D from the scene.
var rQ = [];


//--------------------------------
//Basic input setup
//--------------------------------

var mpos = [0,0];
window.onmousemove = function(e){mpos=[e.clientX - cx, e.clientY - cy];}

var scroll=0;
window.onmousewheel = function(e){scroll=e.wheelDelta;}; //Chrome
window.addEventListener('DOMMouseScroll',function(e){scroll=e.detail;},false); //FireFox. Wut. You. Smokin.

var keyList = [];
keyList[32] = 'space';
keyList[38] = 'up';
keyList[40] = 'down';
keyList[37] = 'left';
keyList[39] = 'right';
keyList[49] = 'one';
keyList[50] = 'two';
keyList[51] = 'three';
keyList[52] = 'four';
var kb = {};
function setKey(e){
	if(e.type == 'keyup'){val = false;}
	else{val = true;}
	if(keyList[e.keyCode]){
		kb[keyList[e.keyCode]] = val;
	}
}
window.onkeydown = setKey;
window.onkeyup = setKey;


//--------------------------------
//This is where all of the 3D and math happens
//--------------------------------


var project3Dto2D = function(p3){
	var scale = fov/(fov + -p3[2]), p2 = {};
	p2.x = (p3[0] * scale);
	p2.y = (p3[1] * scale);
	p2.scale = scale;
	return p2;
};

var getP3Offset = function(p3,offset){
	//a quick hack to quickly add the offset of the object
	var p3 = [p3[0]+offset[0], p3[1]+offset[1], p3[2]+offset[2]];
	return p3;
}

var rotatePoint = function(x,y,rad){
	var length = Math.sqrt((x * x) + (y * y));
	var currentRad = Math.atan2(x,y);
	x = Math.sin(currentRad - rad) * length;
	y = Math.cos(currentRad - rad) * length;
	var output = [x,y];
	return output;
}
var totalRotationCalculations = 0;
var getP3Rotated = function(p3,rot){
	var x = p3[0], y = p3[1], z = p3[2];
	var xr = rot[0], yr = rot[1], zr = rot[2];
	//x...
	if(xr !== 0){
		var zy = rotatePoint(z,y,xr);
		z = zy[0];
		y = zy[1];
		totalRotationCalculations += 1;
	}
	//y...
	if(yr !== 0){
		var xz = rotatePoint(x,z,yr);
		x = xz[0];
		z = xz[1];
		totalRotationCalculations += 1;
	}
	//z...
	if(zr !== 0){
		var xy = rotatePoint(x,y,zr);
		x = xy[0];
		y = xy[1];
		totalRotationCalculations += 1;
	}
	return [x,y,z];
}

var getP3String = function(p3){
	return 'x:'+p3[0]+' y:'+p3[1]+' z:'+p3[2];
}

var drawLines = function(o){
	//I see no reason to check whether the rotation is different between processing each point,
	//so I'll just do that once per frame and have a loop just for rotating the points.
	if(o.lastRotString !== getP3String(o.rot)){
		for(var i = 0; i < o.shape.points.length; i += 1){
			//to make sure I'm not messing with the original array...
			var point = [o.shape.points[i][0],o.shape.points[i][1],o.shape.points[i][2]];
			point = getP3Rotated(point, o.rot);
			o.rotatedPointCache[i] = point;
		}
		o.lastRotString = getP3String(o.rot);
	}
	var computedPointList = [];
	for(var i = 0; i < o.shape.points.length; i += 1){
		//to make sure I'm not messing with the original array...
		var point = [o.rotatedPointCache[i][0],o.rotatedPointCache[i][1],o.rotatedPointCache[i][2]];
		point = getP3Offset(point, o.pos);
		point = getP3Offset(point, camera);
		computedPointList[i] = point;
	}
	for(var i = 0; i < o.shape.lines.length; i += 1){
		//offset the points by the object's position
		var p3a = computedPointList[o.shape.lines[i][0]];
		var p3b = computedPointList[o.shape.lines[i][1]];
		//if the depths of the first and second point in the line are less than the far plane...
		if( p3a[2] < clipNear && p3b[2] < clipNear && p3a[2] > clipFar && p3b[2] > clipFar){
			var p0 = project3Dto2D(p3a);
			var p1 = project3Dto2D(p3b);
			//If the line is completely off screen, do not bother rendering it.
			if(((p0.x < cx && p0.x > -cx) || (p1.x < cx && p1.x > -cx)) && ((p0.y < cy && p0.y > -cy) || (p1.y < cy && p1.y > -cy))){
				c.beginPath();
				c.moveTo(p0.x,p0.y);
				c.lineTo(p1.x,p1.y);
				
				c.strokeStyle= o.shape.lines[i][2] || o.shape.color || '#fff';
				//c.lineWidth=2;
				c.lineCap='round';
				c.stroke();
			}
		}
	}
}

//The only reason this isn't with the rest of the shapes is because I need to use it inside the prototype of ob3D
var cubeShape = {
	color:'#999',
	points:[
		[ 10, 10, 10],
		[ 10, 10,-10],
		[ 10,-10, 10],
		[ 10,-10,-10],
		[-10, 10, 10],
		[-10, 10,-10],
		[-10,-10, 10],
		[-10,-10,-10]
	],
	lines:[
		[0,1],
		[2,3],
		[4,5],
		[6,7],
		[3,1],
		[2,0],
		[7,5],
		[6,4],
		[5,1],
		[7,3],
		[4,0],
		[6,2]
	],
};

var ob3D = function(pos,shape){
	if(this === window){throw 'JIM TYPE ERROR'};
	this.pos = pos || [0,0,0];
	this.rot = [0,0,0];
	this.lastRotString = false;
	this.rotatedPointCache = [];
	if(shape){this.shape = shape;}
	return this;
}

ob3D.prototype = {
	shape: cubeShape,
	pos:[0,0,0],
	update:function(){
		drawLines(this);
	},
	destroy:function(){
		for(var i = 0; i < rQ.length; i += 1){
			if(rQ[i] === this){
				rQ.splice(i,1);
			}
		}
	}
};

var rint = function(num){
	return Math.round(((Math.random()*2)-1)*num);
}

//--------------------------------
//The basic render loop
//--------------------------------

var resize = function(){
	cx=Math.floor(w/2);
	cy=Math.floor(h/2);
	mpos.x = 0;
	mpos.y = 0;
	canvas.width=w;
	canvas.height=h;
	wph=w+h;
}

var update = function(){
	w=window.innerWidth;
	h=window.innerHeight;
	if(wph != w+h){resize();}
	c.fillStyle='#rgba(0,255,0,0.4)';
	c.fillRect(0,0,w,h);
	c.save();
	//c.strokeStyle = '#fff';
	c.translate(cx,cy);

	//camera[0] = mpos[0];
	//camera[1] = mpos[1];
	model.rot[0] = mpos[1] / 100;
	model.rot[1] = -mpos[0] / 100;
	if(scroll !== 0){camera[2] += (scroll / Math.abs(scroll)) * 50; scroll = 0;}

	//depth sorting!
	rQ.sort(function(a,b) {return a.pos[2] - b.pos[2]})

	for(var i = 0; i < rQ.length; i += 1){
		rQ[i].update();
	}

	
	//console.log(rQ[0].pos[0]);
	c.restore();
	//console.log(totalRotationCalculations);
	setTimeout(update,1000/60);
}





//Thanks, Heilmann. http://www.wait-till-i.com/2007/08/08/simulating-array_unique-in-javascript/
function heilmanns_array_unique(ar){
	if(ar.length && typeof ar!=='string'){
		var sorter = {};
		var out = [];
		for(var i=0,j=ar.length;i<j;i++){
			if(!sorter[ar[i]+typeof ar[i]]){
				out.push(ar[i]);
				sorter[ar[i]+typeof ar[i]]=true;
			}
		}
	}
	return out || ar;
}

//Hmm. Turns out that I quite like the idea above,
//but it won't work for my needs comparing the content of an array.
//Let's try and JSON it up for some quick and (SERIOUSLY)dirty serialization.
function array_unique(ar){
	if(ar.length && typeof ar!=='string'){
		var sorter = {};
		var out = [];
		for(var i=0,j=ar.length;i<j;i++){
			if(!sorter[JSON.stringify(ar[i])]){
				out.push(ar[i]);
				sorter[ar[i]+typeof ar[i]]=true;
			}
		}
	}
	return out || ar;
}

//Why? Let me tell you why. Because javascript's built-in array.sort() thinks 1,10,100,2,3
var whyDoINeedToWriteANumericSortingFunction = function(a,b){return a - b;}
var whyDoINeedToWriteANumericSortingFunctionForA2dArray = function(a,b){return a[0] - b[0];}

var convertObjStringToJs = function(string){
	//document.body.innerHTML = string;
	var output = [];
	var linesOfText = string.split("\n");
	var objectList = {};
	var obRef;
	var pointNumOffset = 1; //starts at 1 so when subtracted from an array.length, the key is still zero
	var lastObRef;
	for(var i = 0; i < linesOfText.length; i += 1){
		var lineOfText = linesOfText[i];
		var action = lineOfText.charAt(0);
		var params = lineOfText.substr(2,lineOfText.length).split(' ');
		if(action === 'o'){

			//WTF1: THE NEXT LINE IS REALLY, REALLY IMPORTANT TO DO BEFORE CREATING THE NEXT OBJECT.
			//OBJ STANDARD PRACTICE IS TO COUNT THE TOTAL POINTS IN A FILE AND USE THE ABSOLUTE POINT NUM IN THE POLY REFERENCE
			//I NEED TO COUNT HOW MANY POINTS WERE IN THE LAST OBJECT TO USE THAT AS MY OFFSET BECAUSE I COUNT THE POINTS IN MY OBJECTS STARTING FROM 0!
			//Check that this isn't the first object.
			if(obRef !== undefined){
				pointNumOffset += objectList[obRef].points.length;
			}


/*
			//Creating the new object to put lines and points into!
			//In Blender, you can have multiple `objects` in your scene that reference the same mesh.
			//The object name as it comes to here is objectName_meshName, so I split by _
			//And just because I feel like it, I'm storing the intended color for the object in its name
			//so example: greeCube-0f0_cubeMesh : turns into obRef = 'greeCube'; objectColor = '0f0';
			var objectNameFromBlender = params[0].split('_')[0].split('-');
			var objectColor = objectNameFromBlender[1] || 'f00';
			obRef = objectNameFromBlender[0];
*/

//I'ma simply the parsing process so that I get only one shape out of this. Merge all geom into a single mesh!

			obRef = 'shape';
			var objectColor = 'fff';
			objectList[obRef] = {
				color:'#'+objectColor,
				points:[],
				lines:[]
			};
		}
		if(action === 'v'){
			//objectList[obRef].points.push([(parseFloat(params[0])*10),(parseFloat(params[1])*10),(parseFloat(params[2])*10)]);
			//because I want to flip from Blender's default export orientation...
			objectList[obRef].points.push([(parseFloat(params[0])*100),(parseFloat(params[2])*100),(parseFloat(params[1])*100)]);
		}
		if(action === 'f'){
			//See note WTF1 above to understand the pointNumOffset variable
			for(var pointNum = 0; pointNum < (params.length -1); pointNum += 1){
				var line = [parseInt(params[pointNum]) - pointNumOffset, parseInt(params[pointNum +1]) - pointNumOffset];
				//Why do I sort the array literal before pushing it into the set? So I can compare easily by join() later.
				line.sort(whyDoINeedToWriteANumericSortingFunction);
				objectList[obRef].lines.push(line);
			}
			//It took me a long time to figure this out; Filled polys autoclose; Line segments don't.
			var closingLine = [parseInt(params[0]) - pointNumOffset, parseInt(params[params.length -1]) - pointNumOffset];
			closingLine.sort(whyDoINeedToWriteANumericSortingFunction);
			objectList[obRef].lines.push(closingLine);
		}
	}
	for(var property in objectList){
		if(objectList.hasOwnProperty(property)){
			//console.log(objectList[property]);
			objectList[property].lines = array_unique(objectList[property].lines);
			objectList[property].lines.sort(whyDoINeedToWriteANumericSortingFunctionForA2dArray);
			//quick and dirty output. Oh yeah.
			//output.push( '	' + property + ':' + JSON.stringify(objectList[property]) );
			output.push(objectList[property]);
		}
	}
	//document.body.innerHTML = "var shapes = {\n";
	//document.body.innerHTML += output.join(",\n");
	//document.body.innerHTML += "\n};\n";
	//console.log(objectList);
	return(output);
};

var dataString = document.getElementById('your_data').innerHTML;
//console.log(dataString);
if(dataString !== ''){
	var userParsedData = convertObjStringToJs(dataString)[0];
	console.log(userParsedData);

//--------------------------------
//Adding the user's uploaded model to the scene
//--------------------------------

	var model = new ob3D(false,userParsedData);
	rQ.push(model);
	update();
}else{
	alert('Upload a file to get some output!');
}

</script></body>
</html>