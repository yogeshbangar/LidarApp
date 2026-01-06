<script setup lang="ts">
import { ref } from 'vue'
import { ToastType } from '../util/constant'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<ToastMessage[]>([])
let toastId = 0

const addToast = (type: ToastMessage['type'], message: string, duration = 4000) => {
  const id = ++toastId
  toasts.value.push({ id, type, message, duration })
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const success = (message: string, duration?: number) => addToast(ToastType.SUCCESS, message, duration)
const error = (message: string, duration?: number) => addToast(ToastType.ERROR, message, duration)
const warning = (message: string, duration?: number) => addToast(ToastType.WARNING, message, duration)
const info = (message: string, duration?: number) => addToast(ToastType.INFO, message, duration)

const getIcon = (type: ToastMessage['type']) => {
  switch (type) {
    case ToastType.SUCCESS: return '✓'
    case ToastType.ERROR: return '✕'
    case ToastType.WARNING: return '⚠'
    case ToastType.INFO: return 'ℹ'
  }
}

// Expose methods for parent components
defineExpose({
  success,
  error,
  warning,
  info,
  addToast,
  removeToast
})
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click.stop="removeToast(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  pointer-events: auto;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 0.95rem;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.toast:hover {
  transform: translateX(-4px);
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Success Toast */
.toast-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  border: 1px solid rgba(16, 185, 129, 0.5);
  color: #fff;
}

.toast-success .toast-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Error Toast */
.toast-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fff;
}

.toast-error .toast-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Warning Toast */
.toast-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fff;
}

.toast-warning .toast-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Info Toast */
.toast-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #fff;
}

.toast-info .toast-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Animations */
.toast-enter-active {
  animation: toast-in 0.4s ease;
}

.toast-leave-active {
  animation: toast-out 0.3s ease;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateX(100px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(100px) scale(0.9);
  }
}
</style>

