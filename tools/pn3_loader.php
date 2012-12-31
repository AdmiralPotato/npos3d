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
	top: 0;
	right: 0;
	padding: 16px;
	background-color: rgba(255,255,255,0.1);
	color: #9f0;
	font-size: 12px;
	line-height: 16px;
	font-family: monospace;
	white-space: pre-wrap;
	z-index: 1;
}
#user_data{
	display: none;
}
</style>
</head>
<body><canvas id="canvas"></canvas>
<div id="controls">
Upload a PN3 file. Or else.
Moving the your mouse rotates your shape.
Scrolling controlls camera Z

<form action="" method="post" enctype="multipart/form-data"><input type="file" name="file" size="90000000000000001"><input type="submit"></form>
</div><div id="user_data"><?php
if(!empty($_FILES['file']['tmp_name'])){
	echo '<img src="data:image/png;base64,'.base64_encode(file_get_contents($_FILES['file']['tmp_name'])).'" id="user_image">';
}
?></div>

<script src="../src/core.js"></script>
<script src="../src/font.js"></script>
<script src="../src/geom.pn3.js"></script>
<script>

var n = NPos3d;
var scene = new n.Scene();
var s = scene;
var c = s.c;

var scroll = 1;
window.onmousewheel = function(e){scroll=e.wheelDelta;}; //Chrome
window.addEventListener('DOMMouseScroll',function(e){scroll=e.detail;},false); //FireFox. Wut. You. Smokin.
var viewControl = {
	pos:[0,0,0],
	rot:[0,0,0],
	update:function(){
	//this.rot[0] += deg*1;
	this.rot[1] = deg*s.mpos.x /2;
	this.rot[0] = -deg*s.mpos.y /2;
	scene.camera.pos[2] += (scroll/8);
	scroll = 0;
	//this.pos[0] = s.mpos.x;
	//this.pos[1] = s.mpos.y;
	}
}
s.add(viewControl);

var myCube = new n.Ob3D({pos:viewControl.pos, rot:viewControl.rot, scale:[15,15,15],renderAlways:true});
myCube.shape.color='#f00';
s.add(myCube);
var myShape = new n.Ob3D({pos:viewControl.pos, rot:viewControl.rot, scale:[300,300,300],renderAlways:true,renderStyle:'points',pointStyle:'stroke'});
s.add(myShape);
//var myPn3 = new n.Ob3D({pos:viewControl.pos, rot:viewControl.rot, scale:[30,30,30],renderAlways:true});
//s.add(myPn3);

var dataImage = document.getElementById('user_image');
if(dataImage !== null){
	var parsedPn3 = new n.Geom.PN3({
		path:dataImage.src,
		callback:function(){
			myShape.shape = parsedPn3;
			console.log(parsedPn3);
		}
	});
}

</script>
</body>
</html>