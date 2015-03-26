var MyEngine = {
	getContext : function(element){
		/*
			This is the first point of a WebGL application. This has analogies in other
			types of OpenGL applications. A context is basically a way of keeping track
			of where graphics are rendered onto. It would seem that WebGL can only
			render onto the 'canvas' DOM element on a webpage.
		*/
		try{ //Assign a context to a variable 'gl':
			gl = element.getContext('experimental-webgl');
			gl.viewportWidth = element.width; //Save canvas width in pixels
			gl.viewportHeight = element.height; //Save canvas height in pixels
		}catch(e){ //Alert any error:
			alert(e.toString());
		}
		
		if(!gl){ //Alert if initialization was not successfull:
			alert("Could not initialize WebGL!");
			return null;
		}
		
		return gl; //Return context
	},
	
	getRenderer : function(context){
		var gl = context;
		/*
			This function sets som initial render properties then returns an object
			containing functions for clearing canvas and drawing models with shaders.
			I've purposely set a single background color becouse in a proper scene,
			background is not set with clearColor. However this could be changed if
			need be.
		*/
		// Set render output offset (offset start in lower left corner) and size:
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		//Lower alpha value and webpage background will blend additively with render background:
		gl.clearColor(0.5, 0.5, 0.5, 1.0);
		// enable render to test if an object lies behind or not of other objects:
		gl.enable(gl.DEPTH_TEST);
		
		/*
			These next three functions need a little bit of explaining. This tells OpenGL
			to not bother with triangles facing away from the viewer. The reason this is
			useful is becouse a properly modeled mesh will obscure any triangle facing
			away from the viewer. But the renderer will render them anyway
			and later cover them up. But this is inefficient so we tell the render not to
			render them at all.
		*/
		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW); // Front face is determined by right hand rule (counter clock-wise)
		gl.cullFace(gl.BACK); // The back of triangles will be culled
		
		return {
			clear : function(){
				/*
					This function is expected to be called every frame before rendering new content
					onto canvas. It basically clears everything and prepares it for another drawing.
				*/
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			},
			
			draw : function(model, shader, uniforms){
			
				function updateUniforms(){
					var texOffset = 0;
					for(var i = 0; i < uniforms.length; i++){
					
						if(uniforms[i].target.location && uniforms[i].data){
							if(uniforms[i].target.type == 'mat4'){
								gl.uniformMatrix4fv(uniforms[i].target.location, false, uniforms[i].data);
								
							}else if(uniforms[i].target.type == 'sampler2D'){
								gl.activeTexture(gl.TEXTURE0 + texOffset);
								gl.bindTexture(gl.TEXTURE_2D, uniforms[i].data);
								gl.uniform1i(uniforms[i].target.location, texOffset);
								texOffset++;
								
							}else if(uniforms[i].target.type == 'float'){
								gl.uniform1f(uniforms[i].target.location, uniforms[i].data);
							}
						}
					}
				}
				
				try{
					gl.useProgram(shader.program); //Select shader to use
					gl.bindBuffer(gl.ARRAY_BUFFER, model.VBO); //Select buffer to use
					
					updateUniforms();
					
					var offset = 0; //Where in row (in bits) is read
					for(var i = 0; i < shader.attributes.length; i++){
						/*
							For loop will go through all possible attributes in a shader and assign
							data from a buffer to them. This will only work if shader object is
							formated properly and model object has required information for this
							function to know what to do.
						*/
						if(shader.attributes[i] >= 0){
							gl.enableVertexAttribArray(shader.attributes[i]); //Enable an attribute on shader to be used with buffer
							gl.vertexAttribPointer(
								shader.attributes[i],	//Attribute on shader
								model.rowDist[i],		//Number of elements for this attribute
								gl.FLOAT,				//Type of data in buffer
								false,					//Normalize data?
								model.rowSize * 4,		//Bits per row (floats: 4bits)
								offset					//Position in row to start
								);
						}
						/*
							Make sure the offset increment is outside the if(shader.attributes[i] >= 0)-statement!
							Otherwise if a property is not used, the offset wont increment properly for next attributes!
						*/
						offset += model.rowDist[i] * 4; //Increment position in row for next loop
					}
					
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.IBO); //Select buffer
					
					
					
					gl.drawElements(gl.TRIANGLES, model.indexSize, gl.UNSIGNED_SHORT, 0); //Draw vertices in order based on indices
				}finally{
					for(var i = 0; i < shader.attributes.length; i++){ //Disable all attributes on shader after drawing
						if(shader.attributes[i] >= 0)
							gl.disableVertexAttribArray(shader.attributes[i]);
					}
					
					gl.bindBuffer(gl.ARRAY_BUFFER, null); //Deselect all buffers
					gl.useProgram(null); //Deselect all shaders
				}
			}
		};
	},
	
	loadTexture : function(target, filename, image){
		var gl = target.context;
		
		target.texture = gl.createTexture();
		image.onload = function(){
			console.log("Loaded image: " + filename);
			try{
				gl.bindTexture(gl.TEXTURE_2D, target.texture);
				
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			}finally{
				console.log("Successfully buffered texture data:\n\t" + filename);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
		};
		image.src = filename;
	},
	
	loadModel : function(target, filename){
		/*
			This function sends mesh data to GPU and returns an object with relevant
			information needed to render mesh. Data should be formated thus:
			model = {
				vdata : [ //Vertex data:
					0.0, 0.0, 0.0,		0.0, 0.0, 0.0,		0.0, 0.0,		0.0, 0.0,
					0.0, 0.0, 0.0,		0.0, 0.0, 0.0,		0.0, 0.0,		0.0, 0.0,
					0.0, 0.0, 0.0,		0.0, 0.0, 0.0,		0.0, 0.0,		0.0, 0.0,
					0.0, 0.0, 0.0,		0.0, 0.0, 0.0,		0.0, 0.0,		0.0, 0.0,
					0.0, 0.0, 0.0,		0.0, 0.0, 0.0,		0.0, 0.0,		0.0, 0.0,
					],
				idata : [ //Index data:
					1, 2, 3,
					2, 3, 4,
					3, 4, 5
					],
				rowSize : 10, //Elements per vertex
				rowDist : [3, 3, 2, 2] //Distribution of data
				};
		*/
		var gl = target.context; // Convenience variable to keep code clean
		
		loadSource();
		
		function loadSource(){
			$.ajax({
				url : filename,
				dataType : 'json',
				success : bufferData
			});
		}
		
		function bufferData(model){
			console.log("Loaded model: " + filename);
			target.buffer = {
				VBO : gl.createBuffer(), //Vertex data (eg. position, normals, uv coords)
				IBO : gl.createBuffer(), //Index data (ie. which vertices makes up a triangle)
				rowSize : model.rowSize, //Elements per vertex
				rowDist : model.rowDist, //Distribution of elements per vertex property (eg. 3 elements for position)
				colSize : model.vdata.length / model.rowSize, //Number of vertices for model
				indexSize : model.idata.length, //Number of indices for model
			};
			
			try{
				gl.bindBuffer(gl.ARRAY_BUFFER, target.buffer.VBO); //Select buffer on GPU at adress in buffer.VBO
				gl.bufferData(gl.ARRAY_BUFFER, //Type of information
					new Float32Array(model.vdata), //Data to be sent
					gl.STATIC_DRAW); //This is always static unless we want to reuppload data to GPU
				
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, target.buffer.IBO); //Select buffer on GPU at adress in buffer.IBO
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, //Type of information
					new Uint16Array(model.idata), //Data to be sent
					gl.STATIC_DRAW); //This is always static unless we want to reuppload data to GPU
			}finally{
				gl.bindBuffer(gl.ARRAY_BUFFER, null); // Deselect all buffers
				console.log("Successfully buffered vertex data:\n\t" + filename);
			}
		}
	},
	
	loadShader : function(target, vFilename, fFilename){
		var gl = target.context; // Convenience variable to keep code clean
		var nLoadedShaders = 0; // Counter variable for synchronization of shader linking
		
		shaderProgram = gl.createProgram();
		
		loadSource(gl.VERTEX_SHADER, vFilename);
		loadSource(gl.FRAGMENT_SHADER, fFilename);
		
		function loadSource(type, filename){
			/*
				Asynchronous call to load shader, compile and attach it to
				shaderProgram. Then it writes in the console log if everything
				ran successfully. Lastly it executes the shader linking function
				which will only link if both shaders are compiled. This is
				synchronized with a counter variable.
			*/
			$.ajax({
				url : filename,
				dataType : 'text',
				success : function(data){
					gl.attachShader(shaderProgram, compileShader(type, data));
					console.log("Loaded, compiled and attached: " + filename);
					nLoadedShaders++;
					linkShaderProgram();
				}
			});
		}
		
		function compileShader(type, source){
			/*
				This compiles a single shader component (eg. a vertex shader) and
				returns it to be used in creating the shader program.
			*/
			// Create an empty shader of given type:
			shader = gl.createShader(type);
			gl.shaderSource(shader, source); //Assign source to empty shader
			gl.compileShader(shader); //Compile shader source
			
			// Check if compile was successfull:
			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				// Alert errors if compile was unsuccessfull and return null:
				alert(gl.getShaderInfoLog(shader));
				return null;
			}
			
			return shader; //Return shader
		}
		
		function linkShaderProgram(){
			/*
				This function will test if both shaders has been compiled with a counter variable.
				That way it can be called by each ajax call and won't execute until everything is
				loaded and ready to link shader program to GPU. If everything worked out it will
				write in the console log which shaders has been successfully loaded. And finally it
				assigns the shader program reference to target.program.
			*/
			if(nLoadedShaders == 2){
				gl.linkProgram(shaderProgram);
				if(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
					console.log("Successfully linked shaderprogram:\n\t" + vFilename +" + "+ fFilename);
					target.program = shaderProgram;
					setupAttributes();
					setupUniforms();
				}else{ // Alert if link was unsuccessfull and return null:
					alert("Could not initialize shaders!");
					target.program = null;
				}
			}
		}
		
		function setupAttributes(){
			for(var i = 0; i < target.attributes.length; i++){
				target.attributes[i] = gl.getAttribLocation(target.program, target.attributes[i]);
			}
		}
		
		function setupUniforms(){
			for(var i = 0; i < target.uniforms.length; i++){
				target.uniforms[i].location = gl.getUniformLocation(target.program, target.uniforms[i].location);
			}
		}
	}
};