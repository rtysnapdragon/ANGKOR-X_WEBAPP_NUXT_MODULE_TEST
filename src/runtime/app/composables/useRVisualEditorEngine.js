import { shallowRef } from 'vue'
import { createEngine as createCanvasEngine } from '../components/Editor/Canvaas/RCanvasEngine'
import '../components/Editor/Canvaas/RCanvas.css'

export function useRVisualEditorEngine() {
  const engine = shallowRef(null)

  async function createEngine(options = {}) {
    const next = await createCanvasEngine(options)
    engine.value = next
    return next
  }

  function pointFromClient(clientX, clientY, width, height) {
    const rect = engine.value?.canvas?.upperCanvasEl?.getBoundingClientRect()
    const zoom = engine.value?.canvas?.getZoom?.() || 1
    if (!rect) return { x: 0, y: 0 }
    return {
      x: Math.max(0, Math.min(width, (clientX - rect.left) / zoom)),
      y: Math.max(0, Math.min(height, (clientY - rect.top) / zoom)),
    }
  }

  function dispose() {
    engine.value?.dispose?.()
    engine.value = null
  }

  return { engine, createEngine, pointFromClient, dispose }
}
