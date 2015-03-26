precision mediump float;

uniform sampler2D galaxy_core;
uniform sampler2D galaxy_disc;
uniform float turn;

varying vec2 UVCoord;

float swirl = 20.0; //Higher means more twisting in center and less on edges

//Forward declaring functions:
mat2 rotate(float t);
float twist(float t, float s);
float blending(float t);

void main(void){
	float turn2 = 0.0;
	if(0.0 <= turn && turn < 0.5)
		turn2 = turn + 0.5;
	else if(0.5 <= turn && turn <= 1.0)
		turn2 = turn - 0.5;
	
	vec2 uv_1 = rotate(twist(turn, swirl)) * (UVCoord - 0.5) + 0.5;
	vec2 uv_2 = rotate(twist(turn2, swirl)) * (0.5-UVCoord) + 0.5;
	
	float a = blending(turn);
	float b = blending(turn2);
	
	vec4 x = texture2D(galaxy_core, UVCoord);
	
	gl_FragColor =
		mix(vec4(0,0,0,1), texture2D(galaxy_disc, uv_1), a) +
		mix(vec4(0,0,0,1), texture2D(galaxy_disc, uv_2), b) +
		texture2D(galaxy_core, UVCoord);
}

mat2 rotate(float t){
	return(mat2(
		cos(t), -sin(t),
		sin(t),  cos(t)));
}

float twist(float t, float s){
	return(
		mix( t*s, 0.0, min(1.0, pow(2.0*length( UVCoord - vec2(0.5) ), 1.0/s)) )
	);
}

float blending(float t){
	float blend = 0.0;
	if(t < 1.0 && 0.5 <= t)
		blend = 2.0*(1.0-t);
	else if(t < 0.5)
		blend = 2.0*t;
	return(blend);
}