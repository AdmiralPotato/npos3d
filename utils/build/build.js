var gear = require('gear');
new gear.Queue({registry: new gear.Registry({module: 'gear-lib'})})
	.read([
		'../../src/core.js',
		'../../src/font.js',
		'../../src/layout.js',
		'../../src/sprite.js',
		'../../src/utils.color.js',
		'../../src/fx.tween.js',
		'../../src/fx.explosion.js',
		'../../src/geom.circle.js',
		'../../src/geom.sphere.js',
		'../../src/geom.lathe.js',
		'../../src/geom.twist.js'
		//,'../../src/geom.pn3.js'
	])
	.log('read files')
	.concat()
	.write('../../build/npos3d.js')
	.jslint()
	.jsminify()
	.write('../../build/npos3d.min.js')
	.log('wrote output files')
	.run();