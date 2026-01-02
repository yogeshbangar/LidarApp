<script setup lang="ts">
import { ref } from 'vue'
// @ts-ignore - Vue SFC types handled by Volar
import ThreeCube from './components/ThreeCube.vue'
// @ts-ignore - Vue SFC types handled by Volar
import ToastContainer from './components/ToastContainer.vue'
import { useToast } from './composables/useToast'

const message = ref('Light wave cube!')
const showCube = ref(false)

const toast = useToast()

const showSuccess = () => toast.success('Operation completed successfully!')
const showError = () => toast.error('Something went wrong. Please try again.')
const showWarning = () => toast.warning('Please save your work before continuing.')
const showInfo = () => toast.info('New features are available. Check them out!')
</script>

<template>
  <div class="container">
    <h1>{{ message }}</h1>
    <p class="subtitle">Welcome to Vue 3 + Vite + TypeScript</p>
    
    <div class="card">
      <button class="cube-btn" @click="showCube = true">
        🎲 Open 3D Cube
      </button>
    </div>

    <div class="toast-demo">
      <p class="demo-label">Toast Notifications:</p>
      <div class="toast-buttons">
        <button class="toast-btn success" @click="showSuccess">✓ Success</button>
        <button class="toast-btn error" @click="showError">✕ Error</button>
        <button class="toast-btn warning" @click="showWarning">⚠ Warning</button>
        <button class="toast-btn info" @click="showInfo">ℹ Info</button>
      </div>
    </div>

    <ThreeCube v-if="showCube" @close="showCube = false" />
    <ToastContainer />
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 20px rgba(0, 217, 255, 0.5));
  }
  to {
    filter: drop-shadow(0 0 30px rgba(0, 255, 136, 0.7));
  }
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.card {
  padding: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #00d9ff, #00ff88);
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);
}

.cube-btn {
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.cube-btn:hover {
  box-shadow: 0 8px 25px rgba(254, 202, 87, 0.4);
}

button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
}

button:active {
  transform: translateY(0);
}

.toast-demo {
  margin-top: 2rem;
  text-align: center;
}

.demo-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.toast-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.toast-btn {
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
  border-radius: 8px;
}

.toast-btn.success {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.toast-btn.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.toast-btn.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.toast-btn.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.toast-btn.success:hover { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); }
.toast-btn.error:hover { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4); }
.toast-btn.warning:hover { box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4); }
.toast-btn.info:hover { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4); }
</style>

