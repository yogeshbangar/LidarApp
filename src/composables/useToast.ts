import { ref } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const toasts = ref<ToastMessage[]>([])
let toastId = 0

export function useToast() {
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

  const success = (message: string, duration?: number) => addToast('success', message, duration)
  const error = (message: string, duration?: number) => addToast('error', message, duration)
  const warning = (message: string, duration?: number) => addToast('warning', message, duration)
  const info = (message: string, duration?: number) => addToast('info', message, duration)

  const clearAll = () => {
    toasts.value = []
  }

  return {
    toasts,
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    clearAll
  }
}

