/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

// Three.js WebGPU module declaration
declare module 'three/webgpu' {
  export * from 'three'
  export class WebGPURenderer {
    constructor(parameters?: {
      canvas?: HTMLCanvasElement
      antialias?: boolean
      alpha?: boolean
      depth?: boolean
      stencil?: boolean
      powerPreference?: string
    })
    domElement: HTMLCanvasElement
    init(): Promise<void>
    render(scene: import('three').Scene, camera: import('three').Camera): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    setPixelRatio(value: number): void
    dispose(): void
  }
  export class MeshBasicNodeMaterial extends import('three').MeshBasicMaterial {
    constructor(parameters?: import('three').MeshBasicMaterialParameters)
    colorNode?: unknown
  }
}

