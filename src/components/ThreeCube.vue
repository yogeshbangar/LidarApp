<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let cube: THREE.Mesh
let animationId: number

const emit = defineEmits<{
  close: []
}>()

onMounted(() => {
  if (!containerRef.value) return

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

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
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
        <h2>3D Cube Viewer</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      <div ref="containerRef" class="canvas-container"></div>
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
}
</style>

