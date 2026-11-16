// Fallback background for scene 1 when no sea footage is available:
// slow Mediterranean caustics, colours derived only from the charte blues + white.
// Fully driven by useCurrentFrame() (no useFrame) → deterministic renders.
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../config';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uNavy;
uniform vec3 uBlue;
uniform vec3 uWhite;

// Cheap caustic pattern (iterated domain warping), low complexity for CPU GL.
float caustic(vec2 p, float t) {
  vec2 i = p;
  float c = 1.0;
  float inten = 0.0045;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 6.0 + vec2(13.0, 7.0);
  float t = uTime * 0.18;
  float c = caustic(p, t);
  float glow = smoothstep(1.1, 0.0, length((uv - vec2(0.5, 0.62)) * vec2(1.2, 1.6)));
  vec3 base = mix(uNavy, uBlue, glow * 0.55 + uv.y * 0.15);
  vec3 col = base + uWhite * clamp(c, 0.0, 1.0) * 0.16 * (0.4 + glow);
  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = (h: string) => new THREE.Color(h);

const Plane: React.FC<{time: number; w: number; h: number}> = ({time, w, h}) => {
  const uniforms = useMemo(
    () => ({
      uTime: {value: 0},
      uRes: {value: new THREE.Vector2(w, h)},
      uNavy: {value: hex(COLORS.navy)},
      uBlue: {value: hex(COLORS.blue)},
      uWhite: {value: hex(COLORS.white)},
    }),
    [w, h],
  );
  uniforms.uTime.value = time;
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
  );
};

export const MedLightShader: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} linear flat>
      <Plane time={frame / fps} w={width} h={height} />
    </ThreeCanvas>
  );
};
