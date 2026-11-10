import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { JOURNEY, range } from "./journey";
import { scrollState as s } from "./scrollState";
import {
  Bubble,
  HeroCharacter,
  HeroField,
  useHeroLayout,
  usePointerTracking,
} from "./Hero3D";
import { asset } from "./asset";
const lerp = THREE.MathUtils.lerp;

class ModelBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { bad: false };
  }
  static getDerivedStateFromError() {
    return { bad: true };
  }
  render() {
    return this.state.bad ? <FallbackModel /> : this.props.children;
  }
}
function FallbackModel() {
  const { scene } = useGLTF(asset("/props/placeholder.glb"));
  return <primitive object={scene.clone()} />;
}
// A project as a floating medallion: its logo baked onto a round face
// (scripts/medallions.mjs), a bronze rim around the edge and a dark back, sized
// to sit in the same 1.6-unit box the models and cards used.
const MEDAL = { r: 0.72, d: 0.09, rim: 0.055 };
const medallionSrc = (item) => item.medallion ?? asset(`/logos/medallion/${item.id}.png`);
function ProjectMedallion({ item }) {
  const texture = useTexture(medallionSrc(item));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const face = MEDAL.r - MEDAL.rim;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[MEDAL.r, MEDAL.r, MEDAL.d, 72, 1, true]} />
        <meshStandardMaterial color="#c8923f" emissive="#3a2208" roughness={0.38} metalness={0.6} envMapIntensity={1.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, MEDAL.d / 2]}>
        <ringGeometry args={[face, MEDAL.r, 72]} />
        <meshStandardMaterial color="#e3b25a" emissive="#4a2c0a" roughness={0.3} metalness={0.55} envMapIntensity={1.5} />
      </mesh>
      <mesh position={[0, 0, MEDAL.d / 2 + 0.002]}>
        <circleGeometry args={[face, 72]} />
        {/* The logo is brand artwork; keep it out of tone mapping and the
            scene lights so its colours read true. */}
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -MEDAL.d / 2]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[MEDAL.r, 72]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.4} metalness={0.7} envMapIntensity={1.2} />
      </mesh>
    </group>
  );
}
// Which prop is showcased above the hand at the end of the zoom, and where it
// sits relative to the palm (in bubble-radius units, tuned against the render).
// Project cards are wider than the old objects, so on a phone they sit a little
// higher and smaller to clear the copy below.
const SHOWCASE = { up: 1.1, side: -0.56, z: 0.5, scale: 0.47, upMobile: 1.8, scaleMobile: 0.25, sideMobile: 0.16 };

// Signed distance of a card from the selected one, around the ring, so going
// from the last project to the first still slides the short way.
function ringOffset(index, selected, count) {
  let rel = index - selected;
  if (rel > count / 2) rel -= count;
  if (rel < -count / 2) rel += count;
  return rel;
}

// During the hero hold the cards orbit inside the film. On scroll they rise
// over the open palm into a carousel: the selected card faces the viewer, the
// others wait just off to either side and slide in as the selection moves.
function Prop({ item, index, count, progress }) {
  const ref = useRef();
  const offset = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const showcase = useMemo(() => new THREE.Vector3(), []);
  const bound = 1.39; // conservative bound for a model normalized to a 1.6-unit box
  const slide = useRef(ringOffset(index, s.selectedIndex ?? 0, count));
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const p = progress.current;
    const time = s.reduced ? 0 : clock.elapsedTime;
    const mobile = innerWidth < 700;
    const angle = Math.PI / 2 + index * Math.PI * 2 / count;
    // More cards need a wider ring and a smaller size to stay inside the film.
    const ring = count > 5 ? .36 : .31;
    const a = [Math.cos(angle) * ring, Math.sin(angle) * ring, index % 2 ? -.06 : .04];
    const base = s.bubbleBase;
    const heroScale = base * (count > 5 ? .21 : count > 4 ? .24 : .29);

    // Orbit pose inside the film (the resting hero state).
    offset
      .set(
        a[0] + Math.sin(time * 0.57 + index) * 0.10,
        a[1] + Math.sin(time * 0.68 + index * 1.7) * 0.11,
        a[2] + Math.cos(time * 0.43 + index) * 0.09,
      )
      .multiplyScalar(base);
    const maxOffset = Math.max(0, s.bubbleRadius * 0.84 - bound * heroScale);
    if (offset.length() > maxOffset) offset.setLength(maxOffset);
    target.copy(s.bubbleCenter).add(offset);

    const rel = ringOffset(index, s.selectedIndex ?? 0, count);
    // Ease toward the new slot; a jump of more than one slot happens off
    // screen (the far side of the ring), so take it instantly.
    if (s.reduced || Math.abs(rel - slide.current) > 1.5) slide.current = rel;
    else slide.current = lerp(slide.current, rel, 1 - Math.exp(-5.5 * dt));
    const sl = slide.current;
    const near = Math.max(0, 1 - Math.abs(sl)); // 1 = in front, 0 = fully aside
    const selected = Math.abs(rel) < 0.5;
    if (p > JOURNEY.dollStart || selected) {
      // Rise from the orbit up over the open palm and grow into a frontal
      // showcase as the camera moves in.
      const rise = range(p, JOURNEY.dollStart, JOURNEY.dollEnd);
      const r = s.bubbleRadius;
      showcase.set(
        s.palmX + r * (mobile ? SHOWCASE.sideMobile : SHOWCASE.side),
        s.palmY + r * (mobile ? SHOWCASE.upMobile : SHOWCASE.up),
        SHOWCASE.z,
      );
      // Carousel: neighbours wait one card-width to the side and a little back.
      showcase.x += sl * r * (mobile ? 1.5 : 1.9);
      showcase.z -= Math.abs(sl) * 0.35;
      // One gentle vertical float, the same for every card, so the strip moves
      // as one piece instead of each card wobbling on its own.
      if (!s.reduced) showcase.y += Math.sin(time * .8) * r * .045;
      target.lerp(showcase, rise);
      const showScale = mobile ? SHOWCASE.scaleMobile : SHOWCASE.scale;
      const scale = lerp(heroScale, showScale * (.86 + near * .14), rise);
      ref.current.position.copy(target);
      ref.current.scale.setScalar(scale);
      // A fixed three-quarter lean toward the copy, turning as it slides.
      ref.current.rotation.set(
        lerp(Math.sin(time * .48) * .23, .04, rise),
        lerp(Math.sin(time * 0.37) * 0.48, -.16 - sl * .45, rise),
        lerp(Math.sin(time * .43) * .20, 0, rise),
      );
      // Steep falloff: a card only reads once it is nearly in front, so the one
      // sliding in never sits solid over the copy column.
      const opacity = lerp(1, Math.pow(near, 2.5), rise);
      ref.current.visible = s.outro < 0.999 && opacity > .005;
      ref.current.traverse((n) => {
        if (n.isMesh && n.material) {
          n.material.transparent = true;
          n.material.opacity = opacity;
          n.material.envMapIntensity = 1.25;
        }
      });
      return;
    }

    // Loose props: keep orbiting so they return on reverse scroll, but dissolve
    // as the zoom begins.
    const fade = range(p, JOURNEY.propsFade[0], JOURNEY.propsFade[1]);
    ref.current.position.copy(target);
    ref.current.scale.setScalar(heroScale);
    ref.current.rotation.set(
      Math.sin(time * 0.48 + index) * 0.23,
      Math.sin(time * 0.37 + index) * 0.48,
      Math.sin(time * 0.43 + index) * 0.20,
    );
    ref.current.visible = fade < 0.999 && s.outro < 0.999;
    ref.current.traverse((n) => {
      if (n.isMesh && n.material) {
        n.material.transparent = true;
        n.material.opacity = 1 - fade;
        n.material.envMapIntensity = 1.25;
      }
    });
  });
  return (
    <group ref={ref}>
      <ModelBoundary>
        <Suspense fallback={null}>
          <ProjectMedallion item={item} />
        </Suspense>
      </ModelBoundary>
    </group>
  );
}
function Atmosphere({ progress }) {
  const ref = useRef();
  const texture = useTexture(
    innerWidth < 700 ? asset("/textures/scene-mobile.jpg") : asset("/textures/scene.jpg"),
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  const suffix = innerWidth < 700 ? "-mobile" : "";
  const [depthMap, normalMap, noiseMap] = useTexture([
    asset("/textures/scene-depth" + suffix + ".jpg"),
    asset("/textures/scene-normal" + suffix + ".jpg"),
    asset("/textures/noise.jpg"),
  ]);
  [depthMap, normalMap, noiseMap].forEach((t) => {
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  });
  noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;
  const uniforms = useMemo(
    () => ({
      uScene: { value: texture },
      uDepth: { value: depthMap },
      uNormal: { value: normalMap },
      uNoise: { value: noiseMap },
      uFogStrength: { value: 0.1 },
      uParticleDensity: { value: 0.18 },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uFogWarm: { value: new THREE.Color("#E05A4E") },
      uFogCool: { value: new THREE.Color("#3B4A52") },
    }),
    [],
  );
  useFrame(({ clock }, dt) => {
    const live = ref.current.material.uniforms;
    live.uTime.value = s.reduced ? 0 : clock.elapsedTime;
    live.uIntensity.value = range(progress.current, 0.58, 0.81) * (1 - s.outro);
    live.uPointer.value.lerp(
      innerWidth < 700
        ? new THREE.Vector2(0, progress.current * 0.4)
        : s.pointer,
      1 - Math.pow(0.001, dt),
    );
  });
  return (
    <mesh ref={ref} frustumCulled={false} renderOrder={-100}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        depthTest={false}
        depthWrite={false}
        transparent={false}
        uniforms={uniforms}
        vertexShader={
          "varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.999,1.); }"
        }
        fragmentShader={`varying vec2 vUv;uniform sampler2D uScene;uniform sampler2D uDepth;uniform sampler2D uNormal;uniform sampler2D uNoise;uniform float uFogStrength;uniform float uParticleDensity;uniform float uIntensity;uniform float uTime;uniform vec2 uPointer;uniform vec3 uFogWarm;uniform vec3 uFogCool;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){if(uIntensity<.001)discard;vec2 uv=vUv+uPointer*.025;float n=noise(uv*5.+vec2(uTime*.015,0.));n+=noise(uv*12.-uTime*.012)*.35;float fog=pow(1.-vUv.y,2.)*n*uFogStrength;float depth=texture2D(uDepth,vUv).r;vec3 normal=texture2D(uNormal,vUv).rgb*2.-1.;vec2 sceneUv=vUv+uPointer*.015*depth+normal.xy*.001;vec3 room=texture2D(uScene,sceneUv).rgb;vec3 c=room*.40+vec3(.015,.007,.005)+uFogWarm*fog+uFogCool*n*.035*vUv.y;float vignette=smoothstep(.2,.8,length(vUv-.5));c*=1.-vignette*.5;float dust=step(.998,texture2D(uNoise,vUv*2.+vec2(uTime*.002,0.)).r)*uParticleDensity;c+=dust*.08;gl_FragColor=vec4(c,uIntensity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
gl_FragColor.rgb*=uIntensity;
}`}
      />
    </mesh>
  );
}
function World({ items, onEnterBubble, reduced }) {
  const { camera, gl, scene, size } = useThree();
  const layout = useHeroLayout();
  const mobile = size.width < 700;
  usePointerTracking();
  const cluster = useRef(),
    progress = useRef(0);
  const target = useMemo(() => new THREE.Vector3(), []),
    look = useMemo(() => new THREE.Vector3(), []),
    cameraLook = useMemo(() => new THREE.Vector3(), []);
  const heroEnv = useMemo(() => new THREE.Scene(), []);
  const lastPhase = useRef("");
  useEffect(() => {
    items.forEach((item) => useTexture.preload(medallionSrc(item)));
  }, [items]);
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.001, Math.min(dt, 0.1));
    progress.current = s.progress;
    const p = progress.current;
    // One act now: hold, then dolly into the open hand. No interior room.
    const phase = p > JOURNEY.zoomStart ? "ZOOM" : "HERO";
    s.phase = phase;
    if (lastPhase.current !== phase) {
      // The hero always takes pointer events: the bubble is reachable at the
      // top, and the cards over the zoomed hand are reachable at the bottom.
      gl.domElement.closest(".canvas-container").style.pointerEvents = "auto";
      lastPhase.current = phase;
    }
    if (heroEnv.environment) scene.environment = heroEnv.environment;

    // Camera dolly. The palm sits to the figure's right; aiming there brings the
    // batik across the left of frame and leaves the right open for type — the
    // reference crop. The aim is scaled by K so the fully-zoomed frame lands on
    // the doll-over-palm composition rather than overshooting past it.
    const zoom = range(p, JOURNEY.zoomStart, JOURNEY.zoomEnd);
    const K = mobile ? 0.74 : 0.72;
    const aimX = s.palmX * (mobile ? 0.82 : 0.9) * K;
    const aimY = (layout.palmY + layout.radius * (mobile ? 0.5 : 0.42)) * K;
    const endZ = mobile ? 3.7 : 3.3;
    target.set(lerp(0, aimX, zoom), lerp(0, aimY, zoom), lerp(6, endZ, zoom));
    look.set(lerp(0, aimX, zoom), lerp(0, aimY, zoom), 0);
    camera.position.lerp(target, k);
    cameraLook.lerp(look, k);
    camera.lookAt(cameraLook);
    gl.domElement.style.opacity = 1 - s.outro;
  }, -2);
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={2.4} />
      <Atmosphere progress={progress} />
      <Suspense fallback={null}>
        <HeroField mobile={mobile} />
        <HeroCharacter layout={layout} mobile={mobile} />
      </Suspense>
      <Environment
        scene={heroEnv}
        resolution={256}
        frames={1}
        background={false}
      >
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#E05A4E"
          scale={[14, 14, 1]}
          position={[0, 0, -6]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          color="#FFF6EE"
          scale={[3, 8, 1]}
          position={[-4, 2, 3]}
          rotation={[0, Math.PI / 3, 0]}
        />
        <Lightformer
          form="ring"
          intensity={6}
          color="#FFFFFF"
          scale={1.2}
          position={[3.5, 3, 2]}
        />
        <Lightformer
          form="rect"
          intensity={0.15}
          color="#140A08"
          scale={[10, 10, 1]}
          position={[0, -5, 2]}
        />
      </Environment>
      <group ref={cluster}>
        {items.map((item, i) => (
          <Prop
            key={item.id}
            item={item}
            index={i}
            count={items.length}
            progress={progress}
          />
        ))}
      </group>
      <Bubble layout={layout} mobile={mobile} onEnter={onEnterBubble} />
    </>
  );
}
export default function Scene(props) {
  const [dpr, setDpr] = useState(innerWidth < 700 ? 1.5 : 1.75),
    [active, setActive] = useState(true);
  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45, near: 0.05, far: 100 }}
        dpr={dpr}
        frameloop={active && !props.paused ? "always" : "never"}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.domElement.addEventListener("webglcontextlost", props.onFail);
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Suspense fallback={null}>
          <World {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
