<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const emit = defineEmits<{
  close: []
}>()

const containerRef = ref<HTMLDivElement>()
let renderer: THREE.WebGLRenderer | null = null
let animationId: number = 0

// Smoke vertex shader
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Smoke fragment shader with FBM noise
const smokeFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform sampler2D uTrailTexture;
  
  varying vec2 vUv;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractional Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;
    
    // Mouse influence
    vec2 mouse = uMouse * 2.0 - 1.0;
    mouse.x *= uResolution.x / uResolution.y;
    float mouseInfluence = 1.0 - smoothstep(0.0, 1.5, length(p - mouse));
    
    // Time-based animation
    float time = uTime * 0.15;
    
    // Create multiple smoke layers
    float smoke = 0.0;
    
    // Layer 1 - Main smoke
    vec3 pos1 = vec3(p * 1.5, time);
    smoke += fbm(pos1) * 0.6;
    
    // Layer 2 - Detail smoke (faster movement)
    vec3 pos2 = vec3(p * 3.0, time * 1.5);
    smoke += fbm(pos2) * 0.3;
    
    // Layer 3 - Fine detail
    vec3 pos3 = vec3(p * 6.0 + vec2(sin(time), cos(time)), time * 0.8);
    smoke += fbm(pos3) * 0.15;
    
    // Add rising motion
    vec3 risingPos = vec3(p.x, p.y + time * 0.5, time * 0.3);
    smoke += fbm(risingPos) * 0.4;
    
    // Mouse disturbance
    smoke += mouseInfluence * fbm(vec3(p * 4.0, time * 2.0)) * 0.3;
    
    // Normalize and adjust
    smoke = smoke * 0.5 + 0.5;
    smoke = smoothstep(0.2, 0.8, smoke);
    
    // Color palette - ethereal smoke colors
    vec3 color1 = vec3(0.02, 0.02, 0.08); // Deep dark blue
    vec3 color2 = vec3(0.15, 0.1, 0.25);  // Purple tint
    vec3 color3 = vec3(0.4, 0.35, 0.5);   // Light purple
    vec3 color4 = vec3(0.7, 0.65, 0.8);   // Pale lavender
    
    // Create color gradient based on smoke density
    vec3 finalColor;
    if (smoke < 0.33) {
      finalColor = mix(color1, color2, smoke * 3.0);
    } else if (smoke < 0.66) {
      finalColor = mix(color2, color3, (smoke - 0.33) * 3.0);
    } else {
      finalColor = mix(color3, color4, (smoke - 0.66) * 3.0);
    }
    
    // Add subtle glow
    float glow = fbm(vec3(p * 2.0, time * 0.5)) * 0.5 + 0.5;
    vec3 glowColor = vec3(0.3, 0.2, 0.5) * glow * 0.2;
    finalColor += glowColor;
    
    // Vignette effect
    float vignette = 1.0 - length(p) * 0.4;
    vignette = smoothstep(0.0, 1.0, vignette);
    finalColor *= vignette;
    
    // Add subtle color variation based on time
    finalColor += vec3(
      sin(time * 0.5) * 0.03,
      cos(time * 0.7) * 0.02,
      sin(time * 0.3) * 0.04
    );
    
    // Sample the trail texture and blend it
    vec4 trail = texture2D(uTrailTexture, vUv);
    
    // Add trail glow to the smoke
    finalColor += trail.rgb * trail.a * 1.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Trail update shader - draws new point and fades old ones
const trailUpdateFragmentShader = `
  uniform sampler2D uPrevTrail;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uMouseSpeed;
  
  varying vec2 vUv;
  
  // Hash function for randomness
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  void main() {
    // Get previous frame
    vec4 prev = texture2D(uPrevTrail, vUv);
    
    // Fade out previous trails
    prev.rgb *= 0.97;
    prev.a *= 0.96;
    
    // Calculate aspect-corrected coordinates
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    
    // Current and previous mouse positions
    vec2 mouse = uMouse;
    vec2 prevMouse = uPrevMouse;
    
    // Calculate distance from current pixel to the mouse trail line
    vec2 pa = uv - prevMouse;
    vec2 ba = mouse - prevMouse;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    vec2 closest = prevMouse + ba * h;
    
    // Distance to trail line (aspect corrected)
    float dist = length((uv - closest) * aspect);
    
    // Trail properties based on speed
    float speed = uMouseSpeed;
    float trailWidth = 0.015 + speed * 0.02;
    float intensity = smoothstep(trailWidth, 0.0, dist);
    
    // Add some variation to the trail
    float noise = hash(uv * 100.0 + uTime);
    intensity *= 0.8 + noise * 0.4;
    
    // Color based on position and time - rainbow effect
    float colorPhase = uTime * 2.0 + length(uv - 0.5) * 3.0;
    vec3 trailColor = vec3(
      sin(colorPhase) * 0.5 + 0.5,
      sin(colorPhase + 2.094) * 0.5 + 0.5,
      sin(colorPhase + 4.188) * 0.5 + 0.5
    );
    
    // Make it more cyan/magenta themed to match smoke
    trailColor = mix(
      vec3(0.4, 0.8, 1.0),  // Cyan
      vec3(1.0, 0.4, 0.8),  // Magenta
      sin(colorPhase) * 0.5 + 0.5
    );
    
    // Add glow particles along the trail
    float particleNoise = hash(uv * 50.0 + floor(uTime * 10.0));
    if (particleNoise > 0.97 && intensity > 0.1) {
      intensity += 0.5;
      trailColor = vec3(1.0, 1.0, 1.0); // White sparkles
    }
    
    // Combine with previous
    vec3 finalColor = prev.rgb + trailColor * intensity * speed * 2.0;
    float finalAlpha = max(prev.a, intensity * speed);
    
    // Clamp to prevent over-saturation
    finalColor = min(finalColor, vec3(2.0));
    finalAlpha = min(finalAlpha, 1.0);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`

const initScene = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  let width = window.innerWidth
  let height = window.innerHeight

  // Scene setup
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 1

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Create render targets for trail ping-pong
  const createRenderTarget = () => new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  })
  
  let trailTargetA = createRenderTarget()
  let trailTargetB = createRenderTarget()

  // Trail update material
  const trailUniforms = {
    uPrevTrail: { value: trailTargetA.texture },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(width, height) },
    uTime: { value: 0 },
    uMouseSpeed: { value: 0 }
  }

  const trailMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: trailUpdateFragmentShader,
    uniforms: trailUniforms
  })

  // Main smoke shader uniforms
  const smokeUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uTrailTexture: { value: trailTargetB.texture }
  }

  const smokeMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: smokeUniforms
  })

  // Full screen quad
  const geometry = new THREE.PlaneGeometry(2, 2)
  const trailMesh = new THREE.Mesh(geometry, trailMaterial)
  const smokeMesh = new THREE.Mesh(geometry, smokeMaterial)

  // Mouse tracking
  let mouseX = 0.5
  let mouseY = 0.5
  let prevMouseX = 0.5
  let prevMouseY = 0.5
  let mouseSpeed = 0

  const onMouseMove = (event: MouseEvent) => {
    const newX = event.clientX / width
    const newY = 1.0 - event.clientY / height
    
    // Calculate speed
    const dx = newX - mouseX
    const dy = newY - mouseY
    mouseSpeed = Math.min(Math.sqrt(dx * dx + dy * dy) * 50, 1.0)
    
    prevMouseX = mouseX
    prevMouseY = mouseY
    mouseX = newX
    mouseY = newY
  }
  window.addEventListener('mousemove', onMouseMove)

  // Handle resize
  const onResize = () => {
    width = window.innerWidth
    height = window.innerHeight
    
    renderer?.setSize(width, height)
    smokeUniforms.uResolution.value.set(width, height)
    trailUniforms.uResolution.value.set(width, height)
    
    // Recreate render targets
    trailTargetA.dispose()
    trailTargetB.dispose()
    trailTargetA = createRenderTarget()
    trailTargetB = createRenderTarget()
  }
  window.addEventListener('resize', onResize)

  // Animation loop
  const clock = new THREE.Clock()
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    const time = clock.getElapsedTime()
    
    // Update uniforms
    trailUniforms.uTime.value = time
    trailUniforms.uMouse.value.set(mouseX, mouseY)
    trailUniforms.uPrevMouse.value.set(prevMouseX, prevMouseY)
    trailUniforms.uMouseSpeed.value = mouseSpeed
    trailUniforms.uPrevTrail.value = trailTargetA.texture
    
    smokeUniforms.uTime.value = time
    smokeUniforms.uMouse.value.set(mouseX, mouseY)
    
    // Decay mouse speed
    mouseSpeed *= 0.95
    
    // Render trail update to target B
    scene.add(trailMesh)
    scene.remove(smokeMesh)
    renderer?.setRenderTarget(trailTargetB)
    renderer?.render(scene, camera)
    
    // Update smoke material with new trail
    smokeUniforms.uTrailTexture.value = trailTargetB.texture
    
    // Render final scene to screen
    scene.remove(trailMesh)
    scene.add(smokeMesh)
    renderer?.setRenderTarget(null)
    renderer?.render(scene, camera)
    
    // Swap buffers
    const temp = trailTargetA
    trailTargetA = trailTargetB
    trailTargetB = temp
  }
  animate()

  // Cleanup function stored for later
  return () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(animationId)
    renderer?.dispose()
    geometry.dispose()
    trailMaterial.dispose()
    smokeMaterial.dispose()
    trailTargetA.dispose()
    trailTargetB.dispose()
  }
}

let cleanup: (() => void) | undefined

onMounted(() => {
  cleanup = initScene()
})

onUnmounted(() => {
  cleanup?.()
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
  }
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="smoke-page">
    <div ref="containerRef" class="smoke-canvas"></div>
    
    <div class="content-overlay">
      <h1 class="title">ETHEREAL</h1>
      <p class="subtitle">Move your cursor to create glowing trails</p>
      
      <button class="back-btn" @click="handleClose">
        <span class="btn-icon">←</span>
        <span class="btn-text">Return Home</span>
      </button>
    </div>
    
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>
  </div>
</template>

<style scoped>
.smoke-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  overflow: hidden;
}

.smoke-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.content-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.title {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: clamp(4rem, 15vw, 12rem);
  font-weight: 100;
  letter-spacing: 0.5em;
  margin: 0;
  color: rgba(255, 255, 255, 0.08);
  text-transform: uppercase;
  animation: titleFade 3s ease-out forwards;
  text-shadow: 
    0 0 80px rgba(180, 160, 220, 0.3),
    0 0 160px rgba(120, 100, 180, 0.2);
}

@keyframes titleFade {
  from {
    opacity: 0;
    transform: translateY(30px);
    letter-spacing: 1em;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    letter-spacing: 0.5em;
  }
}

.subtitle {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: rgba(200, 180, 240, 0.4);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-top: 2rem;
  animation: subtitleFade 2s ease-out 0.5s both;
}

@keyframes subtitleFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  pointer-events: auto;
  margin-top: 4rem;
  padding: 1rem 2.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(200, 180, 240, 0.6);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(200, 180, 240, 0.15);
  border-radius: 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: btnFade 2s ease-out 1s both;
  backdrop-filter: blur(10px);
}

@keyframes btnFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn:hover {
  color: rgba(240, 220, 255, 0.9);
  background: rgba(200, 180, 240, 0.1);
  border-color: rgba(200, 180, 240, 0.4);
  transform: translateY(-2px);
  box-shadow: 
    0 10px 40px rgba(150, 120, 200, 0.2),
    inset 0 0 20px rgba(200, 180, 240, 0.05);
}

.btn-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.back-btn:hover .btn-icon {
  transform: translateX(-5px);
}

.corner-decoration {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 1px solid rgba(200, 180, 240, 0.1);
  pointer-events: none;
}

.top-left {
  top: 40px;
  left: 40px;
  border-right: none;
  border-bottom: none;
}

.top-right {
  top: 40px;
  right: 40px;
  border-left: none;
  border-bottom: none;
}

.bottom-left {
  bottom: 40px;
  left: 40px;
  border-right: none;
  border-top: none;
}

.bottom-right {
  bottom: 40px;
  right: 40px;
  border-left: none;
  border-top: none;
}
</style>
