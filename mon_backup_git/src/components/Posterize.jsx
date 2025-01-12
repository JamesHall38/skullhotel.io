import { forwardRef } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

// // POSTERIZATION
// const fragmentShader = `
//   uniform float levels;

//   void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
//     vec3 color = inputColor.rgb;
//     color = floor(color * levels) / levels;
//     outputColor = vec4(color, inputColor.a);
//   }
// `;

// // DITHERING
// const fragmentShader = `
//   uniform float scale;

//   const mat4 bayerMatrix = mat4(
//     0.0/16.0, 8.0/16.0, 2.0/16.0, 10.0/16.0,
//     12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
//     3.0/16.0, 11.0/16.0, 1.0/16.0, 9.0/16.0,
//     15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
//   );

//   void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
//     ivec2 pixel = ivec2(mod(gl_FragCoord.xy, 4.0));
//     float threshold = bayerMatrix[pixel.x][pixel.y];

//     vec3 color = inputColor.rgb;
//     vec3 dithered = step(threshold, color);
//     color = mix(color, dithered, 0.1);

//     outputColor = vec4(color, inputColor.a);
//   }
// `;

// // DITHERING + POSTERIZATION
const fragmentShader = `
  uniform float levels;
  uniform float scale;
  
  const mat4 bayerMatrix = mat4(
    0.0/16.0, 8.0/16.0, 2.0/16.0, 10.0/16.0,
    12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
    3.0/16.0, 11.0/16.0, 1.0/16.0, 9.0/16.0,
    15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
  );

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Posterization
    vec3 color = inputColor.rgb;
    color = floor(color * levels) / levels;
    
    // Dithering
    ivec2 pixel = ivec2(mod(gl_FragCoord.xy, 6.0));
    float threshold = bayerMatrix[pixel.x][pixel.y];
    vec3 dithered = step(threshold, color);
    color = mix(color, dithered, 0.1);

    outputColor = vec4(color, inputColor.a);
  }
`;

class PosterizeEffect extends Effect {
	constructor({ levels = 16.0 } = {}) {
		super('PosterizeEffect', fragmentShader, {
			uniforms: new Map([['levels', new Uniform(levels)]]),
		});
	}
}

export const Posterize = forwardRef(({ levels = 16.0 }, ref) => {
	return <primitive object={new PosterizeEffect({ levels })} ref={ref} />;
});

export default Posterize;
