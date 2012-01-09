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
//Also, let's try and guard against the built in object prototype peoperties and methods with
//a little bit of hard typed bool checking on the sorter property value and not re-compute that value multiple times.
function array_unique(ar){
	if(ar.length && typeof ar!=='string'){
		var sorter = {};
		var out = [];
		for(var i=0,j=ar.length;i<j;i++){
			var valString = JSON.stringify(ar[i]) + typeof ar[i];
			if(sorter[valString] !== true){
				out.push(ar[i]);
				sorter[valString]=true;
			}
		}
	}
	return out || ar;
}

var justGiveMeData = function(url,callbackFunction,options){
	var params = options || {};
	if(! window.XMLHttpRequest){throw 'STOP USING EXPLORER';}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		//console.log(xhr);
		if(xhr.readyState === 4){
			callbackFunction(xhr.responseText,params);
		}
	}
	xhr.open('GET', url+'?cacheKill='+Math.round(Math.random() * 999999), true);
	xhr.send();
}

//Why? Let me tell you why. Because javascript's built-in array.sort() thinks 1,10,100,2,3
var whyDoINeedToWriteANumericSortingFunction = function(a,b){return a - b;}
var whyDoINeedToWriteANumericSortingFunctionForA2dArray = function(a,b){return a[0] - b[0];}

var objToShapeParser = function(string,options){
	//console.log(string);
	var params = options || {};
	var mode = params.mode || 'shape'; //shape OR font
	var exportScale = params.exportScale || 1;
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

			//Creating the new object to put lines and points into!
			//In Blender, you can have multiple `objects` in your scene that reference the same mesh.
			//The object name as it comes to here is objectName_meshName, so I split by _
			//And just because I feel like it, I'm storing the intended color for the object in its name
			//so example: greeCube-0f0_cubeMesh : turns into obRef = 'greeCube'; objectColor = '0f0';
			if(mode === 'shape'){
				var objectNameFromBlender = params[0].split('_')[0].split('-');
				var objectColor = objectNameFromBlender[1] || 'f00';
			}else if(mode === 'font'){
				//But fonts aren't usually multi-color, and '-' is a character, so no more color
				var objectNameFromBlender = params[0].split('_Plane.')[0];
			}
			obRef = objectNameFromBlender[0];
			objectList[obRef] = {
				//color:'#'+objectColor,
				points:[],
				lines:[]
			};
		}
		if(action === 'v'){
			//objectList[obRef].points.push([(parseFloat(params[0])*10),(parseFloat(params[1])*10),(parseFloat(params[2])*10)]);
			//because I want to flip from Blender's default export orientation...
			//By the way, it -is- in thoeory possible to have a 3D font. I'll wait for that though.
			if(mode === 'shape'){
				//3D Data
				objectList[obRef].points.push([(parseFloat(params[0])*exportScale),(parseFloat(params[2])*exportScale),(parseFloat(params[1])*exportScale)]);
			}else if(mode === 'font'){
				//2D Data
				objectList[obRef].points.push([(parseFloat(params[0])*exportScale),(parseFloat(params[2])*exportScale)]);
			}
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

	//Alphabetizing the output(for pretty) and killing duplicate lines(in case of overlap from exported faces)
	var objectNameList = [];
	for(var property in objectList){
		if(objectList.hasOwnProperty(property)){
			//console.log(objectList[property]);
			objectNameList.push(property);
			objectList[property].lines = array_unique(objectList[property].lines);
			objectList[property].lines.sort(whyDoINeedToWriteANumericSortingFunctionForA2dArray);
		}
	}
	objectNameList.sort();
	for(var i = 0; i < objectNameList.length; i++){
		var property = objectNameList[i];
		//console.log(property);
		output.push("\t" + JSON.stringify(property) + ':' + JSON.stringify(objectList[property]));
	}

	//quick and dirty output. Oh yeah.
	var formattedOutput = "var shapes = {\n";
	formattedOutput += output.join(",\n");
	formattedOutput += "\n};\n";
	//console.log(objectList);
	return formattedOutput;
}
