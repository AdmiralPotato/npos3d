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
//Also, let's try and guard against the built in object prototype properties and methods with
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
	options = options || {};
	if(! window.XMLHttpRequest){throw 'STOP USING EXPLORER';}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		//console.log(xhr);
		if(xhr.readyState === 4){
			callbackFunction(xhr.responseText,options);
		}
	}
	xhr.open('GET', url+'?cacheKill='+Math.round(Math.random() * 999999).toString(), true);
	xhr.send();
};

//Why? Let me tell you why. Because javascript's built-in array.sort() thinks 1,10,100,2,3
var whyDoINeedToWriteANumericSortingFunction = function(a,b){return a - b;}
var whyDoINeedToWriteANumericSortingFunctionForA2dArray = function(a,b){return a[0] - b[0];}

var objToShapeParser = function(objString, options) {
	//console.log(string);
	options = options || {};
	var mode = options.mode || 'shape', //shape OR font
		meshNameExtraSeparator = options.meshNameExtraSeparator || (mode === 'font' ? '_Plane.' : false),
		meshNameColorSeparator = options.meshNameColorSeparator || false,
		meshNameColorSingleReg = new RegExp('/' + meshNameColorSeparator + '/'),
		exportScale = options.exportScale || 1,
		output = [],
		meshList = {},
		currentMeshName,
		pointNumOffset = 1, //starts at 1 so when subtracted from an array.length, the key is still zero
		instructionStringList = objString.split("\n"),
		instructonIndex,
		instructonString,
		instructionArgs,
		instructionName,
		pointIndex,
		line,
		meshIndex,
		meshNameList = [],
		meshName;

	var createMeshObject = function(unparsedMeshName) { //this function needs to be context aware, so it is defined in this closure
		//Creating the new object to put lines and points into!
		var meshName = unparsedMeshName,
			meshNameColorSplit,
			mesh = {
				points:[],
				lines:[]
			};

		//WTF1: THE NEXT LINE IS REALLY, REALLY IMPORTANT TO DO BEFORE CREATING THE NEXT OBJECT.
		//OBJ STANDARD PRACTICE IS TO COUNT THE TOTAL POINTS IN A FILE AND USE THE ABSOLUTE POINT NUM IN THE POLY REFERENCE
		//I NEED TO COUNT HOW MANY POINTS WERE IN THE LAST OBJECT TO USE THAT AS MY OFFSET BECAUSE I COUNT THE POINTS IN MY OBJECTS STARTING FROM 0!
		//Check that this isn't the first object.
		if(currentMeshName !== undefined){
			pointNumOffset += meshList[currentMeshName].points.length;
		};

		//In older versions of Blender and other apps, the OBJ object name may come in as 'objectName_meshName',
		//which may be undesirable, so you may set options.meshNameExtraSeparator to '_' to clean the name up.
		if(meshNameExtraSeparator !== false){
			meshName = meshName.split(meshNameExtraSeparator)[0];
		}

		//You may also assign the color property for a mesh via its object name, by assigning a value to
		//options.meshNameColorSeparator, such as '-', then in your modeling app, you would name your object with
		//and valid CSS color string after that separator character.

		//Below are some example object names with color
		//hex color example: 'greeCube-#0f0_cubeMesh'
		//    yields meshName = 'greeCube'; color = '#0f0';
		//rgba color example: 'fadedBlueSphere-rgba(0,0,255,0.5)_Sphere'
		//    yields meshName = 'fadedBlueSphere'; color = 'rgba(0,0,255,0.5)';
		if(meshNameColorSeparator !== false){
			meshNameColorSplit = meshName.split(meshNameColorSeparator);
			if(meshNameColorSplit.length > 2){ //oops, someone got sloppy in their mesh naming - correcting for that
				meshNameColorSplit = meshName.replace(meshNameColorSingleReg,'&&&').split(meshNameColorSeparator);
			}
			if(meshNameColorSplit.length > 1){
				meshName = meshNameColorSplit[0];
				mesh.color = meshNameColorSplit[1];
			}
		}

		currentMeshName = meshName;
		meshList[currentMeshName] = mesh;
	};
	for(instructonIndex = 0; instructonIndex < instructionStringList.length; instructonIndex += 1){
		//I have no why some OBJ exporters would use multiple spaces, but some do...?
		instructonString = instructionStringList[instructonIndex].split('  ').join(' ');
		instructionArgs = instructonString.split(' ');
		instructionName = instructionArgs[0];
		instructionArgs.splice(0,1); //removes instructionName
		if(instructionName === 'o'){ //Create Object
			createMeshObject(instructionArgs[0]);
		}
		if(instructionName === 'v'){ //Create Vertex
			if(currentMeshName === undefined){ //Just checking to see if the OBJ creator was smart enough to create an object first
				createMeshObject('unnamedObject');
			}
			//Blender's default OBJ export orientation is Y up, -Z forward at the moment, so I'm pushing
			//the vertex axies in the order of [0,2,1] because I want to compensate for that odd default.
			if(mode === 'shape'){
				//3D Data
				meshList[currentMeshName].points.push([
					(parseFloat(instructionArgs[0])*exportScale),
					(parseFloat(instructionArgs[2])*exportScale),
					(parseFloat(instructionArgs[1])*exportScale)
				]);
			}else if(mode === 'font'){
				//2D Data
				//By the way, it -is- in theory possible to have a 3D font. I'll wait for that though.
				meshList[currentMeshName].points.push([
					(parseFloat(instructionArgs[0])*exportScale),
					(parseFloat(instructionArgs[2])*exportScale)
				]);
			}
		}
		if(instructionName === 'f'){ //Create Face
			//See note WTF1 above to understand the pointNumOffset variable
			for(pointIndex = 1; pointIndex < instructionArgs.length; pointIndex += 1){
				line = [
					parseInt(instructionArgs[pointIndex -1]) - pointNumOffset,
					parseInt(instructionArgs[pointIndex]) - pointNumOffset
				];
				//Why do I sort the array literal before pushing it into the set? So I can compare easily by join() later.
				line.sort(whyDoINeedToWriteANumericSortingFunction);
				meshList[currentMeshName].lines.push(line);
			}
			//It took me a long time to figure this out; Filled polys autoclose; Line segments don't.
			//This is the last line segment in a closed poly.
			line = [
				parseInt(instructionArgs[0]) - pointNumOffset,
				parseInt(instructionArgs[instructionArgs.length -1]) - pointNumOffset
			];
			line.sort(whyDoINeedToWriteANumericSortingFunction);
			meshList[currentMeshName].lines.push(line);
		}
	}

	//Alphabetizing the output(for pretty) and killing duplicate lines(in case of overlap from exported faces)

	for(meshName in meshList){
		if(meshList.hasOwnProperty(meshName)){
			//console.log(meshList[property]);
			meshNameList.push(meshName);
			meshList[meshName].lines = array_unique(meshList[meshName].lines);
			meshList[meshName].lines.sort(whyDoINeedToWriteANumericSortingFunctionForA2dArray);
		}
	}
	meshNameList.sort();
	for(meshIndex = 0; meshIndex < meshNameList.length; meshIndex++){
		meshName = meshNameList[meshIndex];
		//console.log(property);
		output.push("\t" + JSON.stringify(meshName) + ':' + JSON.stringify(meshList[meshName]));
	}

	//quick and dirty output. Oh yeah.
	//var formattedOutput = "var shapes = {\n";
	var formattedOutput = "{\n";
	formattedOutput += output.join(",\n");
	formattedOutput += "\n}";
	//console.log(meshList);
	return formattedOutput;
};