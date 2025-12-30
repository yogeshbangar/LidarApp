<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three/webgpu'

const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGPURenderer
let cube: THREE.Mesh
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
    scene.background = new THREE.Color(0x0a0a1a)

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

    // Cube geometry
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    
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
      cube.rotation.x += 0.01
      cube.rotation.y += 0.015
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
  renderer?.dispose()
})
</script>

<template>
  <div class="cube-overlay">
    <div class="cube-modal">
      <div class="modal-header">
        <h2>3D Cube Viewer <span class="badge">WebGPU</span></h2>
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
  height: 450px;
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

