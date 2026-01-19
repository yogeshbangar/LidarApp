<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as THREE from "three/webgpu";
import { uniform, mix, vec4, sin, time, uv } from "three/tsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const dualBlendSupported = ref(false);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGPURenderer;
let controls: OrbitControls;
let sphere: THREE.Mesh;
let stars: THREE.Points;
let nebula: THREE.Mesh;
let animationId: number;
let cylinderGroup: THREE.Group;
let cylinderTexture: THREE.Texture | null = null;

const emit = defineEmits<{ close: [] }>();

onMounted(async () => {
  if (!containerRef.value) return;
  if (!navigator.gpu) {
    error.value = "WebGPU is not supported in this browser";
    isLoading.value = false;
    return;
  }

  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    camera = new THREE.PerspectiveCamera(
      75,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    await renderer.init();
    containerRef.value.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    window.addEventListener("keydown", handleKeyDown);
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 15 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        starColors[i3] = 0.9 + Math.random() * 0.1;
        starColors[i3 + 1] = 0.9 + Math.random() * 0.1;
        starColors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.85) {
        starColors[i3] = 0.0;
        starColors[i3 + 1] = 0.8 + Math.random() * 0.2;
        starColors[i3 + 2] = 1.0;
      } else {
        starColors[i3] = 0.8 + Math.random() * 0.2;
        starColors[i3 + 1] = 0.3;
        starColors[i3 + 2] = 1.0;
      }

      starSizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(starColors, 3)
    );
    starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const nebulaGeometry = new THREE.SphereGeometry(25, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });

    const nebulaTime = time.mul(0.1);
    const nebulaUV = uv();
    const nebulaMix = sin(nebulaTime.add(nebulaUV.x.mul(3)))
      .mul(0.5)
      .add(0.5);
    const nebulaColor1 = vec4(0.1, 0.0, 0.3, 0.2);
    const nebulaColor2 = vec4(0.0, 0.2, 0.4, 0.2);
    nebulaMaterial.colorNode = mix(nebulaColor1, nebulaColor2, nebulaMix);

    nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // Add a second nebula layer for depth
    const nebula2Geometry = new THREE.SphereGeometry(20, 32, 32);
    const nebula2Material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const nebula2Mix = sin(nebulaTime.mul(1.5).add(nebulaUV.y.mul(2)))
      .mul(0.5)
      .add(0.5);
    const nebula2Color1 = vec4(0.0, 0.1, 0.2, 0.15);
    const nebula2Color2 = vec4(0.2, 0.0, 0.3, 0.15);
    nebula2Material.colorNode = mix(nebula2Color1, nebula2Color2, nebula2Mix);

    const nebula2 = new THREE.Mesh(nebula2Geometry, nebula2Material);
    scene.add(nebula2);

    // ============ END 3D BACKGROUND ============

    
    // Sphere with dual-source blending (WebGPU feature)
    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);

    // Check if dual-source blending is supported
    const adapter = await navigator.gpu?.requestAdapter();
    const hasDualSourceBlending =
      adapter?.features.has("dual-source-blending") ?? false;
    dualBlendSupported.value = hasDualSourceBlending;

    // Create animated color uniforms
    const color1Uniform = uniform(new THREE.Color(0x000000));
    const color2Uniform = uniform(new THREE.Color(0x00d9ff));

    // Create a custom node material for the sphere
    const sphereMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0.85,
    });

    // Animated color mixing using TSL
    const animatedMix = sin(time.mul(2)).mul(0.5).add(0.5);
    const uvCoord = uv();
    const gradientFactor = uvCoord.y.add(animatedMix.mul(0.3));

    // Blend between two colors based on UV and time
    const blendedColor = mix(
      vec4(color1Uniform, 1.0),
      vec4(color2Uniform, 1.0),
      gradientFactor
    );

    sphereMaterial.colorNode = blendedColor;

    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    cylinderGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const cylinder = createCylinderGroup();
      cylinder.position.y = -20 + i * 10;
      cylinderGroup.add(cylinder);
      console.log(cylinder.position.y);
    }
    scene.add(cylinderGroup);
    cylinderGroup.position.set(0, 0, -10);
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00d9ff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x00ff88, 0.8, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    isLoading.value = false;

    let speed = 0.05;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      for (let i = 0; i < cylinderGroup.children.length; i++) {
        cylinderGroup.children[i].position.y += speed;
        cylinderGroup.children[i].rotation.x += .01;
        if (cylinderGroup.children[i].position.y > 20) {
          const cGroup = cylinderGroup.children[i];
          if(i < cylinderGroup.children.length - 1) {
            cGroup.position.y = cylinderGroup.children[i+1].position.y - 10;
          } else {
            cGroup.position.y = cylinderGroup.children[0].position.y - 10;
          }
          const randomX = Math.random() * 20 - 10;
          cGroup.children[0].position.x = randomX - 12;
          cGroup.children[1].position.x = randomX + 12;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    window.addEventListener("resize", handleResize);
  } catch (err) {
    error.value = `Failed to initialize WebGPU: ${err}`;
    isLoading.value = false;
  }
});
const createCylinderGroup = () => {
    const cylinderGroup = new THREE.Group();
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 20, 32);
    if (!cylinderTexture) {
      const textureLoader = new THREE.TextureLoader();
      cylinderTexture = textureLoader.load("/tex.jpg");
      cylinderTexture.wrapS = THREE.RepeatWrapping;
      cylinderTexture.wrapT = THREE.RepeatWrapping;
      cylinderTexture.repeat.set(1, 2);
    }
    const cylinderMaterial = new THREE.MeshBasicMaterial({
      map: cylinderTexture
    });
    const cylinder1 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    const cylinder2 = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder1.rotation.z = Math.PI / 2;
    cylinder2.rotation.z = Math.PI / 2;
    const randomX = Math.random() * 20 - 10;
    cylinder1.position.x = randomX - 12;
    cylinder2.position.x = randomX + 12;
    cylinderGroup.add(cylinder1);
    cylinderGroup.add(cylinder2);
  return cylinderGroup;
};
const handleResize = () => {
  if (!containerRef.value) return;
  camera.aspect =
    containerRef.value.clientWidth / containerRef.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    containerRef.value.clientWidth,
    containerRef.value.clientHeight
  );
};

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
  controls?.dispose();
  renderer?.dispose();
});
const handleKeyDown = (event: KeyboardEvent) => {
  if (!sphere) return;
  if (event.key === "ArrowLeft") {
    sphere.position.x -= .1;
  } else if (event.key === "ArrowRight") {
    sphere.position.x += .1;
  }
};
</script>
  
  <template>
  <div class="cube-overlay">
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
    <button class="close-btn" @click="emit('close')">✕</button>
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
  position: fixed;
  top: 0;
  right: 0;
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

</style>
  
  