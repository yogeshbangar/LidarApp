<script setup lang="ts">
import { ref } from 'vue'
import ThreeCube from './components/ThreeCube.vue'

const message = ref('Hello World!')
const count = ref(0)
const showCube = ref(false)

const increment = () => {
  count.value++
}
</script>

<template>
  <div class="container">
    <h1>{{ message }}</h1>
    <p class="subtitle">Welcome to Vue 3 + Vite + TypeScript</p>
    
    <div class="card">
      <button @click="increment">
        Count is: {{ count }}
      </button>
      <button class="cube-btn" @click="showCube = true">
        🎲 Open 3D Cube
      </button>
    </div>

    <ThreeCube v-if="showCube" @close="showCube = false" />
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
</style>

