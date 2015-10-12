NPOS3D: Nuclear Pixel Old School 3D
================================

----

##### A 3D wireframe game engine written in Javascript and HTML5's 2D Canvas context

The primary objective of NPos3d is to provide a quick and easy way to create interactive, fullscreen 3D wireframe apps, demos, and toys in as few steps as possible. For mobile devices, it disables viewport scaling and scrolling to display the canvas at a 1 to 1 pixel scale ratio and keep touch interactions focused on the visuals on the canvas.

----

## Usage
There are only a few steps involved in the setup of an NPos3d powered toy.

1. Pull in the source
2. Create a Scene
3. Create Objects
4. Add those objects to the Scene, or parent them to other objects that are attached to the Scene
5. ...
6. Profit.

#### Pulling in the sources
 It is reccommended that you put these script tags at the bottom of your HTML file, just above the closing `</body>` tag. You may then follow these script tags with the script tag which contains the code that you will use to set up your scene and define its interactivity. There is no need to wrap any of your scene setup inside of a document.onload or jQuery onload function if you order your script tags in this manner.

```html
<!doctype html>
<html>
<head>
	<title>NPos3d demo</title>
</head>
<body>

	<!--
	Other page content, if any, would go here.
	If you have any, be sure that it is all wrapped inside of a single block element,
	and be sure that you use CSS to give it a position value of `absolute`, `relative` or `fixed`,
	and give it a `z-index` greater than 1, or the Scene's default canvas will overlap it.
	-->

	<script src="http://admiralpotato.github.io/js/npos3d/build/npos3d.js"></script>

	<script>
		//Your scene setup code would go here, or this script tag could be given
		//a `src` attribute which points to an external javascript file as well
		var n = NPos3d;
		var scene = new n.Scene();
		var myOb = new n.Ob3D();
		myOb.update = function() {
			var t = this;
			t.pos[0] = scene.mpos.x;
			t.pos[1] = scene.mpos.y;
			t.rot[0] -= deg;
			t.rot[1] += deg;
			t.color = 'hsl(' + Math.round(t.rot[1] / deg) + ', 100%, 50%)';
		};
		scene.add(myOb);
	</script>
</body>
</html>
```

The current build of NPos3D includes all of the stables modules. Documentation on each of these modules can be located lower on this page. You can load the engine for use in your pages from the following URL:

```html
<script src="http://admiralpotato.github.io/js/npos3d/build/npos3d.js"></script>
```

Or if you prefer, the minified version:

```html
<script src="http://admiralpotato.github.io/js/npos3d/build/npos3d.min.js"></script>
```

If you would like to load only the bare minimum of the engine's components, you must first load the `core.js` file, then add each of the non-core features one at a time using their own script tag right after the `core.js` script tag. Here is a list of all of the currently available modules in the `src` folder, in the order that they are merged into the build version above:

```html
<script src="http://admiralpotato.github.io/js/npos3d/src/core.js"></script>

<script src="http://admiralpotato.github.io/js/npos3d/src/font.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/layout.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/sprite.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/utils.color.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/fx.tween.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/fx.explosion.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/geom.circle.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/geom.lathe.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/geom.sphere.js"></script>
<script src="http://admiralpotato.github.io/js/npos3d/src/geom.twist.js"></script>
```

----

#### Scene setup

Next, you'll need a Scene. To save yourself time and typos, you might want abbreviate the engine name to 'n', because every useful constructor, method and module in the library is grouped into the `NPos3d` object.

```javascript
var n = NPos3d;
var scene = new n.Scene();
```

When you create a new Scene, a new `<canvas>` element is created and added to the page, and its `height` and `width` attributes are automatically sized to display as fullscreen by default. As the page resizes, this `<canvas>` will continue to resize to fit the full size of the window. The Scene's render loop is also automatically started when the Scene is created, so objects that are added to the Scene will start rendering immediately.

The NPos3d Scene uses the center of the canvas as the center of its coordinate system, meaning that an object with a position of `[0, 0, 0]` is rendered in the center of the canvas. The Scene respects "screen space" for its coordinate system, and the unit of measurement is pixels. This means that positive X values mean right of center, __positive Y values are down from center__, and a positive Z value will move an object closer to the camera. Assuming that the Scene's default camera has not been moved, an object that has position of `[100, 200, 0]` will be displayed at 100 pixels to the right of center, and 200 pixels down from the center of the canvas.

When you create a new Scene object, a few variables and functions will become global, which can and should be used everywhere inside of your script for convenience.

* `cos` is an abbreviation of the Math.cos function
* `sin` is an abbreviation of the Math.sin function
* `pi` is an abbreviation of the Math.PI constant, `3.14159265...`, which represents 180 degrees, but in radians.
* `tau` has a value of `pi * 2`. Tau is a more mathemagically elegant way of thinking in radians. Tau represents a whole circle's circumference in radians, not a half a circle like PI does. Thinking in fractions of a whole circle makes things certain tasks *a lot easier*.
* `deg` has a value of `tau / 360`, and represents one degree, but in radians. Saves a lot of time over using `deg2rad` and `rad2deg` functions sometimes used in other engines. If you want to represent a rotation value of 45 degrees, but in radians, use: `45 * deg`. If you have a rotation value in radians, but want to display it as a human friendly value in degrees, use: `num / deg`.

----

#### Object creation

Now that we have a Scene, we'll create some objects and add them to the Scene. All constructors in NPos3d accept either zero arguments - and will use only default values for the resulting object, or one argument - a configuration object literal which may have any number of optional property / value pairs. Properties specified in the configuration object that are not utilized in the constructor function have no effect, and are discarded.

##### Without a configuration object
```javascript
//create the object
var defaultOb = new n.Ob3D();
//add it to the scene
scene.add(defaultOb);
```

##### With a configuration object
All renderable objects have a common set of properties that you may assign through arguments to their constructor when you create them. For the `pos`, `rot` and `scale` properties, the values represent the 3D axes in this order: `[x, y, z]`. The complete list of common properties are:
* `pos` - 3 key array specifying relative position in pixels, adjusting for depth. Default: `[0, 0, 0]`
* `rot` - 3 key array specifying relative rotation __in radians__. Default: `[0, 0, 0]`
* `rotOrder` - 3 key array specifying the order in which an object will be rotated along its axes. An object's rotation order may specify each axis only once, in any order.(0=X, 1=Y, 2=Z) Default: `[0, 1, 2]`
* `scale` - 3 key array specifying relative scale of the object's children objects and any local geometry. Default: `[1, 1, 1]`
* `color` - String representing any valid CSS color. Accepts: hsl, hsla, rgb, rgba, 6 digit hex, 3 digit hex. Default: undefined, but will use the value `#fff` from the parent Scene if not otherwise configured
* `shape` - More on this in the '[Custom Geometry](#custom-geometry)' section
* `renderStyle` - String specifying 1 of 3 styles that object's geometry may be rendered: Default: `lines`
	* `lines` - Only the Geometry object's `lines` will be rendered. The additional `lineWidth` will be respected if `renderStyle` is set to `lines` or `both`.
	* `points` - Only the Geometry object's `points` will be rendered. The additional properties `pointScale` and `pointStyle` will be respected if `renderStyle` is set to `points` or `both`.
	* `both` - Renders both the Geometry object's `points` and `lines`. All optional render properties are respected.
* `lineWidth` - Number specifying the width in pixels of the lines to be rendered for this object. Default: undefined, but will use the value `1` from the parent Scene if not otherwise configured
* `pointScale` - Number specifying the diameter of the circle in pixels, used to control the scale of all points. Default: `2`
* `pointStyle` - String used to specify either a value of `fill` or `stroke`. Default: `fill`

```javascript
//create the object
var configuredOb = new n.Ob3D({
	pos: [100, 100, 0],
	rot: [45 * deg, 60 * deg, 0],
	scale: [1, 2, 1],
	color: '#f00'
});
//add it to the scene
scene.add(configuredOb);
```

It should be noted that objects start rendering the frame after they are added to the Scene, or any other object.

----

#### Custom Geometry
You can add custom Geometry to a renderable object by adding a `shape` property to its configuration object when it is constructed, by adding a `shape` property to its prototype if you define your own constructor, or by changing its `shape` property at runtime and the Scene will display the object's new shape on the next frame.

Geometry objects specified as the `shape` property of renderable objects must have at least one property, named `points`. The `points` property on a Geometry object must be an array, containing a list of 3 key arrays to represent each `vertex`. The first 3 keys of these `vertex` arrays are used to indicate their X, Y, and Z positions. An optional 4th key may be specified on each `vertex` array to define its color, but this color is only visible when the associated renderable object has its `renderStyle` property is set to either 'points' or 'both'.

Geometry objects may optionally have a `lines` property as well, which must be an array. The `lines` array must contain arrays of 2 keys to represent each `line` to be drawn between two vertices, where the first two keys in that `line` represen the indexes of a pair of the vertices listed in the `points` array on the same Geometry object. An optional 3rd key may be specified on each `line` array to define its color, which is visible when its associated renderable object has its `renderStyle` property set to either 'points' or 'both'. In the case that you are rendering only the vertices on an object, the `lines` property is not required.

Below, you will find the definition of one shape that will render as a triangle composed of three vertices, and another shape that will render as a rudimentary wireframe space ship. __Please note that if you intend for your shapes to rotate "naturally" when you change their Z rotation value, you should design them so that they are facing to the right, as all of JavaScript's trigonometry functions treat zero degrees as pointing to the right as well.__

```javascript
var triangleShape = {
	points: [
		[ 10, 0,  0, '#fff'],
		[-10,-10, 0],
		[-10, 10, 0],
	]
};

var myTriangle = new n.Ob3D({
	renderStyle: 'points',
	shape: triangleShape, //The shape is designed to be pointing to the right
	rot: [0, 0, -90 * deg], //but I rotate it along the Z axis so that it is pointing upward.
	pos: [-100, 0, 0],
	color: '#90f'
});

scene.add(myTriangle);

//----

var shipShape = {
	points: [
		[-10,  0, 0],
		[-20,-20, 0],
		[ 20,  0, 0],
		[-20, 20, 0],
		[ -5,  0, 5],
		[-10, -9, 5],
		[  5,  0, 5],
		[-10,  9, 5]
	],
	lines: [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 0],
		[4, 5, '#ff0'],
		[5, 6, '#ff0'],
		[6, 7, '#ff0'],
		[7, 4, '#ff0'],
		[4, 0],
		[5, 1],
		[6, 2],
		[7, 3]
	]
};

var myShip = new n.Ob3D({
	shape: shipShape,
	pos: [100, 0, 0],
	color: '#9f0'
});

scene.add(myShip);
```
----

#### Adding some animation and interactivity
Now that we have some static, non-moving objects in our scene, let's add some animation and interactivity. All animatable properties on an object are public and can be changed either by its local `update` method, or by external forces.

##### Animating a renderable object via its own update method
I'll use the existing `myTriangle` object defined in the '[Custom Geometry](#custom-geometry)' section to illustrate this concept. To follow the convention I've been using throughout the NPos3d engine thus far, I define the local variable `t` to represent the renderable object itself for use inside of each of its member functions.

```javascript
myTriangle.update = function() { //update methods are invoked with zero arguments
	var t = this;
	t.rot[1] += 2 * deg;
};
```

##### Animating one renderable object from another object's update method
I'll use the existing `myShip` object defined in the '[Custom Geometry](#custom-geometry)' section to illustrate this concept. Sometimes it makes more sense to have one 'animation controller' object manage the state of one or more external renderable objects. In this case, I will use and object literal with an update method. This `animationController` object has no renderable properties, so it will not be displayed, but adding it to the Scene ensures that its update method is invoked once per frame.

For external reference, the <a href="http://codepen.io/AdmiralPotato/pen/LtEnC" target="_blank">3D ROFLCopter</a> demo over at CodePen is a great example of this concept put to good use.

```javascript
var animationController = {
	update: function() {
		myShip.rot[0] -= 2 * deg;
	}
};
scene.add(animationController);
```
----

#### Defining your own 3D object constructors
More content for this section is totally on the todo list.

For external reference, you can use the <a href="http://codepen.io/AdmiralPotato/pen/pFfIv" target="_blank">"Who's loading now?"</a> demo over at CodePen as an example on how to accomplish this. __Please note the use of `n.blessWith3DBase(t,args);` on line 10, as it grants all objects the core set of properties and methods needed to render any object in 3D!__

----
TODO: Describe each of the modules
