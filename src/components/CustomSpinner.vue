<script setup lang="ts">
import { computed } from "vue";

interface SpinnerProps {
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

const props = withDefaults(defineProps<SpinnerProps>(), {
  size: 44,
  thickness: 4,
  color: "#4f7cff",
  trackColor: "rgba(79, 124, 255, 0.2)",
  label: "Loading",
});

const strokeWidth = computed(() => Math.min(props.thickness, props.size / 2));
const radius = computed(() => (props.size - strokeWidth.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
</script>

<template>
  <div
    class="spinner"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    role="status"
    :aria-label="props.label"
  >
    <svg
      :width="props.size"
      :height="props.size"
      :viewBox="`0 0 ${props.size} ${props.size}`"
    >
      <circle
        class="spinner-track"
        :cx="props.size / 2"
        :cy="props.size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
      />
      <circle
        class="spinner-head"
        :cx="props.size / 2"
        :cy="props.size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference * 0.35"
        fill="none"
      />
    </svg>
  </div>
</template>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--spinner-color);
}

.spinner svg {
  animation: spinner-rotate 1s linear infinite;
}

.spinner-track {
  stroke: var(--spinner-track);
}

.spinner-head {
  stroke: var(--spinner-color);
  stroke-linecap: round;
}

.spinner {
  --spinner-color: v-bind(color);
  --spinner-track: v-bind(trackColor);
}

@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}
</style>
