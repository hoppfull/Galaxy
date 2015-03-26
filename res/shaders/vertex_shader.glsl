attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec2 vUVMap;

uniform mat4 ModelMatrix;
uniform mat4 ViewMatrix;
uniform mat4 ProjectionMatrix;

varying vec2 UVCoord;

void main(void){
	UVCoord = vUVMap;
	
	gl_Position = ProjectionMatrix * ViewMatrix * ModelMatrix * vec4(1.4 * vPosition, 1.0);
}