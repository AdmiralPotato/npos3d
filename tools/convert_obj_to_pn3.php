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
	z-index: 1;
}
#user_data{
	display: none;
}
</style>
</head>
<body><canvas id="canvas"></canvas>
<div id="controls">
Upload an OBJ file. Or else.<br>
Moving the your mouse rotates your shape.<br>
Scrolling controlls camera Z<br>
<form action="" method="post" enctype="multipart/form-data"><input type="file" name="file" size="90000000000000001">
<textarea id="user_data" name="user_data"><?php

if(!empty($_FILES['file']) && !empty($_FILES['file']['tmp_name'])){
	//Stripping tags just in case anybody gets the idea to upload anything malicious.
	echo strip_tags(file_get_contents($_FILES['file']['tmp_name']));
}elseif(!empty($_POST['user_data'])){
	echo strip_tags($_POST['user_data']);
}
if(!isset($_POST['scaled'])){$_POST['scaled'] = 1;}
?></textarea>
<br>Scaled:
<label for="scaled_false">no<input type="radio" name="scaled" value="0" id="scaled_false"<?=empty($_POST['scaled'])?'checked':''?>></label>
<label for="scaled_true">yes<input type="radio" name="scaled" value="1" id="scaled_true"<?=!empty($_POST['scaled'])?'checked':''?>></label>
<br>Centered:
<label for="centered_false">no<input type="radio" name="centered" value="0" id="centered_false"<?=empty($_POST['centered'])?'checked':''?>></label>
<label for="centered_true">yes<input type="radio" name="centered" value="1" id="centered_true"<?=!empty($_POST['centered'])?'checked':''?>></label>
<br><input type="submit">
</div>

<script src="../src/core.js"></script>
<script src="../src/font.js"></script>
<script src="../src/geom.pn3.js"></script>
<script src="convert_obj_to_shape.js"></script>
<script>

var n = NPos3d;
var scene = new n.Scene();
var s = scene;
var c = s.c;
var q = s.rQ;

var scroll = 1;
window.onmousewheel = function(e){scroll=e.wheelDelta;}; //Chrome
window.addEventListener('DOMMouseScroll',function(e){scroll=e.detail * -100;},false); //FireFox. Wut. You. Smokin.
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
var myText = new n.VText({pos:viewControl.pos, rot:viewControl.rot, scale:[2,2,2],renderAlways:true,string:'Upload an\nOBJ file',textAlign:'center'});
s.add(myText);
//var myPn3 = new n.Ob3D({pos:viewControl.pos, rot:viewControl.rot, scale:[30,30,30],renderAlways:true});
//s.add(myPn3);

var dataHolder = document.getElementById('user_data');
if(dataHolder.value.length > 10){ //Why ten? Meh. Dunno. No way is an OBJ that short, no way is whitespace that long.
	myText.string = 'LOADING';
	var bigString = objToShapeParser(dataHolder.value);
	//console.log(bigString);
	var shapes = JSON.parse(bigString);
	for(var key in shapes){
		if(shapes.hasOwnProperty(key)){
			var shapeToUse = shapes[key];
			shapeToUse.scaleData = <?=empty($_POST['scaled'])?'false':'true'?>;
			shapeToUse.centerData = <?=empty($_POST['centered'])?'false':'true'?>;
			console.log(shapeToUse);
			try{
				var myPng = new n.Geom.MeshToPng(shapeToUse);
				var controlDiv = document.getElementById('controls');
				var downloadButton = document.createElement('input');
				downloadButton.value='Download PN3 file';
				downloadButton.type='button';
				controlDiv.appendChild(downloadButton);
				downloadButton.addEventListener('mousedown',function(){
					window.open(myPn3.canvas.toDataURL());
				}, false);
				var myPn3 = new n.Geom.PN3({
					path: myPng.image.src,
					callback:function(){
						myShape.shape = myPn3;
						myText.string = myPn3.points.length + ' Points';
					}
				});
			}catch(e){
				myText.string = 'ERROR PARSING\nSEE CONSOLE';
				console.log(e);
			}
			break;
		}
	}
}

</script>
</body>
</html>