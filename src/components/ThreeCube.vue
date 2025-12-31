<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three/webgpu'
// @ts-ignore - TSL node imports
import { uniform, mix, vec4, sin, time, uv } from 'three/tsl'
// @ts-ignore - OrbitControls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const dualBlendSupported = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGPURenderer
let controls: OrbitControls
let cube: THREE.Mesh
let sphere: THREE.Mesh
let stars: THREE.Points
let nebula: THREE.Mesh
let animationId: number

const emit = defineEmits<{
  close: []
}>()

onMounted(async () => {
  if (!containerRef.value) return

  // Check WebGPU support
  if (!navigator.gpu) {
    error.value = 'WebGPU is not supported in this browser'
    isLoading.value = false
    return
  }

  try {
    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020208)

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 3

    // WebGPU Renderer
    renderer = new THREE.WebGPURenderer({ antialias: true })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    
    // Initialize WebGPU renderer (async)
    await renderer.init()
    containerRef.value.appendChild(renderer.domElement)

    // OrbitControls for camera interaction
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = true
    controls.minDistance = 2
    controls.maxDistance = 50
    controls.autoRotate = false
    controls.autoRotateSpeed = 0.5

    // ============ 3D BACKGROUND ============
    
    // Create starfield
    const starCount = 2000
    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    const starSizes = new Float32Array(starCount)
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      // Distribute stars in a sphere around the scene
      const radius = 15 + Math.random() * 35
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starPositions[i3 + 2] = radius * Math.cos(phi)
      
      // Random star colors (white, blue-white, cyan tints)
      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        // White stars
        starColors[i3] = 0.9 + Math.random() * 0.1
        starColors[i3 + 1] = 0.9 + Math.random() * 0.1
        starColors[i3 + 2] = 1.0
      } else if (colorChoice < 0.85) {
        // Cyan stars
        starColors[i3] = 0.0
        starColors[i3 + 1] = 0.8 + Math.random() * 0.2
        starColors[i3 + 2] = 1.0
      } else {
        // Purple/pink stars
        starColors[i3] = 0.8 + Math.random() * 0.2
        starColors[i3 + 1] = 0.3
        starColors[i3 + 2] = 1.0
      }
      
      starSizes[i] = Math.random() * 2 + 0.5
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))
    
    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    })
    
    stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    
    // Create nebula clouds (large transparent spheres with gradient)
    const nebulaGeometry = new THREE.SphereGeometry(25, 32, 32)
    const nebulaMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    })
    
    // Animated nebula color using TSL
    const nebulaTime = time.mul(0.1)
    const nebulaUV = uv()
    const nebulaMix = sin(nebulaTime.add(nebulaUV.x.mul(3))).mul(0.5).add(0.5)
    const nebulaColor1 = vec4(0.1, 0.0, 0.3, 0.2)
    const nebulaColor2 = vec4(0.0, 0.2, 0.4, 0.2)
    nebulaMaterial.colorNode = mix(nebulaColor1, nebulaColor2, nebulaMix)
    
    nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial)
    scene.add(nebula)
    
    // Add a second nebula layer for depth
    const nebula2Geometry = new THREE.SphereGeometry(20, 32, 32)
    const nebula2Material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    })
    const nebula2Mix = sin(nebulaTime.mul(1.5).add(nebulaUV.y.mul(2))).mul(0.5).add(0.5)
    const nebula2Color1 = vec4(0.0, 0.1, 0.2, 0.15)
    const nebula2Color2 = vec4(0.2, 0.0, 0.3, 0.15)
    nebula2Material.colorNode = mix(nebula2Color1, nebula2Color2, nebula2Mix)
    
    const nebula2 = new THREE.Mesh(nebula2Geometry, nebula2Material)
    scene.add(nebula2)

    // ============ END 3D BACKGROUND ============

    // Cube geometry
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    
    // Material with gradient-like effect
    const material = new THREE.MeshPhongMaterial({
      color: 0x00d9ff,
      emissive: 0x00ff88,
      emissiveIntensity: 0.2,
      shininess: 100,
    })

    cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // Add edges for better visibility
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)
    cube.add(wireframe)

    // Sphere with dual-source blending (WebGPU feature)
    const sphereGeometry = new THREE.SphereGeometry(0.6, 32, 32)
    
    // Check if dual-source blending is supported
    const adapter = await navigator.gpu?.requestAdapter()
    const hasDualSourceBlending = adapter?.features.has('dual-source-blending') ?? false
    dualBlendSupported.value = hasDualSourceBlending

    // Create animated color uniforms
    const color1Uniform = uniform(new THREE.Color(0x000000))
    const color2Uniform = uniform(new THREE.Color(0x00d9ff))

    // Create a custom node material for the sphere
    const sphereMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.85,
    })

    // Animated color mixing using TSL
    const animatedMix = sin(time.mul(2)).mul(0.5).add(0.5)
    const uvCoord = uv()
    const gradientFactor = uvCoord.y.add(animatedMix.mul(0.3))
    
    // Blend between two colors based on UV and time
    const blendedColor = mix(
      vec4(color1Uniform, 1.0),
      vec4(color2Uniform, 1.0),
      gradientFactor
    )
    
    sphereMaterial.colorNode = blendedColor

    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(2, 0, 0)
    scene.add(sphere)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00d9ff, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0x00ff88, 0.8, 100)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    isLoading.value = false

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // Update controls (required for damping)
      controls.update()
      
      // Rotate cube
      cube.rotation.x += 0.01
      cube.rotation.y += 0.015
      
      // Animate sphere - orbit around cube
      const t = Date.now() * 0.001
      sphere.position.x = Math.cos(t) * 2
      sphere.position.z = Math.sin(t) * 2
      sphere.rotation.y += 0.02
      
      // Slowly rotate starfield for immersive effect
      stars.rotation.y += 0.0003
      stars.rotation.x += 0.0001
      
      // Rotate nebula slightly
      nebula.rotation.y -= 0.0002
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    window.addEventListener('resize', handleResize)
  } catch (err) {
    error.value = `Failed to initialize WebGPU: ${err}`
    isLoading.value = false
  }
})

const handleResize = () => {
  if (!containerRef.value) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  controls?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div class="cube-overlay">
    <div class="cube-modal">
      <div class="modal-header">
        <h2>
          3D Viewer 
          <span class="badge">WebGPU</span>
          <span v-if="dualBlendSupported" class="badge badge-blend">Dual-Source Blend</span>
        </h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      <div ref="containerRef" class="canvas-container">
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>Initializing WebGPU...</p>
        </div>
        <div v-if="error" class="error">
          <p>{{ error }}</p>
          <p class="hint">Try using Chrome 113+ or Edge 113+</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cube-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cube-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 217, 255, 0.3);
  box-shadow: 0 0 40px rgba(0, 217, 255, 0.2);
  overflow: hidden;
  width: 90%;
  height: 90%;
  max-width: 700px;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 217, 255, 0.2);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.3);
  border-color: rgba(255, 100, 100, 0.5);
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.badge {
  font-size: 0.7rem;
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
  color: #1a1a2e;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  vertical-align: middle;
  font-weight: 700;
}

.badge-blend {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #fff;
}

.loading,
.error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 217, 255, 0.3);
  border-top-color: #00d9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #ff6b6b;
}

.error .hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}
</style>

