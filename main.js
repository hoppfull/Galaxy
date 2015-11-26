$(document).ready(function(){
	var myContext = MyEngine.getContext(document.getElementById('webgl_canvas'));
	var myShader = {
		context : myContext,
		program : null,
		attributes : ['vPosition', 'vNormal', 'vUVMap'], // Declare all attributes on shader here
		uniforms : [ // Declare all uniforms on shader here:
			{type : 'mat4', location : 'ModelMatrix'},
			{type : 'mat4', location : 'ViewMatrix'},
			{type : 'mat4', location : 'ProjectionMatrix'},
			{type : 'sampler2D', location : 'galaxy_core'},
			{type : 'sampler2D', location : 'galaxy_disc'},
			{type : 'float', location : 'turn'}
		]
	};
	
	var myModel = {
		context : myContext,
		buffer : null,
		ModelMatrix : mat4.create()
	};
	
	var tex_galaxy_core = {
		context : myContext,
		texture : null
	};
	
	var tex_galaxy_disc = {
		context : myContext,
		texture : null
	};
	
	var myView = {
		ViewMatrix : mat4.lookAt(mat4.create(), [0.0, -2.0, 0.0], [0.0, 0.0, -0.3], [0.0, 0.0, 1.0]),
		ProjectionMatrix : mat4.perspective(mat4.create(), 1.3, myContext.viewportWidth/myContext.viewportHeight, 0.1, 10)
	};
	
	MyEngine.loadShader(myShader,
		'./res/shaders/vertex_shader.glsl',
		'./res/shaders/fragment_shader.glsl');
	
	MyEngine.loadModel(myModel,
		'./res/models/galaxy.json');
	
	MyEngine.loadTexture(tex_galaxy_core,
		'./res/textures/galaxy_core.jpg', new Image());
		
	MyEngine.loadTexture(tex_galaxy_disc,
		'./res/textures/galaxy_disc.jpg', new Image());
	
	myRenderer = MyEngine.getRenderer(myContext);
	
	mat4.rotateX(myModel.ModelMatrix, myModel.ModelMatrix, 1.0);
	mat4.rotateY(myModel.ModelMatrix, myModel.ModelMatrix, 0.5);
	
	myContext.clearColor(0.0, 0.0, 0.0, 1.0);
	// Mechanism for testing if asyncronous content is loaded properly:
	var turn = 0.0;
	
	window.setInterval(function(){
		turn += 5/600;
		
		myRenderer.clear();
		myRenderer.draw(myModel.buffer, myShader, [
			{target : myShader.uniforms[0], data : myModel.ModelMatrix},
			{target : myShader.uniforms[1], data : myView.ViewMatrix},
			{target : myShader.uniforms[2], data : myView.ProjectionMatrix},
			{target : myShader.uniforms[3], data : tex_galaxy_core.texture},
			{target : myShader.uniforms[4], data : tex_galaxy_disc.texture},
			{target : myShader.uniforms[5], data : turn}
		]);
		
		if(turn > 1.0)
			turn = 0.0;
	}, 40);
});