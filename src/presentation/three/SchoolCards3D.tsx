// Scene 4: photo cards in a 3D space, the camera trucks from one to the next.
// Everything is a pure function of the current frame (no useFrame) → deterministic.
import React, {useEffect, useMemo, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASSETS, COLORS} from '../config';

export type CardCam = {pos: number; focus: number}; // camera position along the travel axis, in card units

const W = 5.4; // card width (world units)
const H = 3.6; // card height (3:2)
const GAP = 7.0; // distance between card centres (landscape)
const GAP_VERTICAL = 10.5; // 9:16: the next card stays off-screen during a stop
const BORDER = 0.036; // ≈ 6 px on screen
const RADIUS = 0.048; // ≈ 8 px on screen

const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 8);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - y) / h;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
};

/** Soft navy drop shadow (charte: 0 30px 60px -25px navy .35) as a radial texture. */
const makeShadowTexture = () => {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  const navy = new THREE.Color(COLORS.navy);
  const rgb = `${Math.round(navy.r * 255)},${Math.round(navy.g * 255)},${Math.round(navy.b * 255)}`;
  g.addColorStop(0, `rgba(${rgb},0.35)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const useTextures = (srcs: (string | null)[]) => {
  const [textures, setTextures] = useState<(THREE.Texture | null)[] | null>(null);
  const [handle] = useState(() => delayRender('Loading card textures'));
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(
      srcs.map((s) =>
        s
          ? new Promise<THREE.Texture>((resolve, reject) =>
              loader.load(
                staticFile(s),
                (t) => {
                  t.colorSpace = THREE.SRGBColorSpace;
                  t.anisotropy = 8;
                  t.generateMipmaps = true;
                  t.minFilter = THREE.LinearMipmapLinearFilter;
                  resolve(t);
                },
                undefined,
                reject,
              ),
            )
          : Promise.resolve(null),
      ),
    )
      .then((t) => {
        setTextures(t);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return textures;
};

/** Fit a photo into the 3:2 card ("cover"), zoomed by `zoom` around its focus point. */
const coverUv = (tex: THREE.Texture, zoom: number, focus: [number, number]) => {
  const img = tex.image as {width: number; height: number};
  const imgAspect = img.width / img.height;
  const cardAspect = W / H;
  let rx = 1;
  let ry = 1;
  if (imgAspect > cardAspect) rx = cardAspect / imgAspect;
  else ry = imgAspect / cardAspect;
  rx /= zoom;
  ry /= zoom;
  const ox = Math.min(Math.max(focus[0] - rx / 2, 0), 1 - rx);
  const oy = Math.min(Math.max(1 - focus[1] - ry / 2, 0), 1 - ry);
  return {rx, ry, ox, oy};
};

const Card: React.FC<{
  index: number;
  tex: THREE.Texture | null;
  focus: [number, number];
  cam: number;
  zoom: number;
  vertical: boolean;
  geo: {photo: THREE.ShapeGeometry; border: THREE.ShapeGeometry};
  shadowTex: THREE.Texture;
}> = ({index, tex, focus, cam, zoom, vertical, geo, shadowTex}) => {
  const d = index - cam; // distance from camera focus, in cards
  const along = index * (vertical ? GAP_VERTICAL : GAP);
  const dist = Math.min(Math.abs(d), 1.4);
  const z = -dist * 0.9; // the card in focus comes forward
  const rot = Math.max(-1, Math.min(1, d)) * -0.16; // neighbours turn slightly toward the travel
  const veil = Math.min(Math.abs(d), 1) * 0.5; // atmospheric depth on the cards out of focus

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({color: tex ? 0xffffff : new THREE.Color(COLORS.blue), toneMapped: false});
    if (tex) {
      const t = tex.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      m.map = t;
    }
    return m;
  }, [tex]);
  if (material.map) {
    const u = coverUv(material.map, zoom, focus);
    material.map.repeat.set(u.rx, u.ry);
    material.map.offset.set(u.ox, u.oy);
  }

  const position: [number, number, number] = vertical ? [0, -along, z] : [along, 0, z];
  const rotation: [number, number, number] = vertical ? [rot, 0, 0] : [0, rot, 0];
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -0.32, -0.06]} scale={[W * 1.22, H * 1.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.border} position={[0, 0, -0.01]}>
        <meshBasicMaterial color={COLORS.white} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.photo} material={material} />
      <mesh geometry={geo.photo} position={[0, 0, 0.005]}>
        <meshBasicMaterial color={COLORS.white} transparent opacity={veil} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const SchoolCards3D: React.FC<{cam: number; zooms: number[]; offset: [number, number]}> = ({cam, zooms, offset}) => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const textures = useTextures(ASSETS.schools.map((s) => s.photo));
  const geo = useMemo(
    () => ({photo: roundedRect(W, H, RADIUS), border: roundedRect(W + BORDER * 2, H + BORDER * 2, RADIUS + BORDER)}),
    [],
  );
  const shadowTex = useMemo(() => makeShadowTexture(), []);
  useCurrentFrame();
  if (!textures) return null;
  const along = cam * (vertical ? GAP_VERTICAL : GAP);
  const camPos: [number, number, number] = vertical ? [offset[0], -along + offset[1], 12] : [along + offset[0], offset[1], 12];
  return (
    <ThreeCanvas width={width} height={height} flat linear={false} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} camera={{fov: vertical ? 50 : 30, position: camPos, near: 0.1, far: 100}}>
      <CameraRig pos={camPos} />
      {ASSETS.schools.map((s, i) => (
        <Card key={i} index={i} tex={textures[i]} focus={s.focus} cam={cam} zoom={zooms[i]} vertical={vertical} geo={geo} shadowTex={shadowTex} />
      ))}
    </ThreeCanvas>
  );
};

const CameraRig: React.FC<{pos: [number, number, number]}> = ({pos}) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(pos[0], pos[1], 0);
  camera.updateProjectionMatrix();
  return null;
};
