<script setup>
// Contextual toolbar: page options when nothing is selected, otherwise the
// controls that apply to the current selection (text / shape / image / …).
import { computed } from 'vue'
import RCanvasPop from './RCanvasPop.vue'
import RCanvasColor from './RCanvasColor.vue'
import { GRADIENTS, TEXT_ALIGNS } from './RCanvasData'

const props = defineProps({
  state: { type: Object, required: true },
  api: { type: Object, required: true },
  fonts: { type: Array, default: () => [] },
})
const emit = defineEmits(['replace-image'])

const sel = computed(() => props.state.sel)
const fillColor = computed(() => (sel.value?.kind === 'line' ? sel.value.stroke : sel.value?.fill))
const showFill = computed(() => sel.value && sel.value.kind !== 'image')
const showBorder = computed(() => sel.value && sel.value.kind !== 'line')
const radiusMax = computed(() => {
  const s = sel.value
  if (!s) return 0
  if (s.hasImage && !s.isRect) return 100
  return Math.max(1, Math.round(Math.min(s.rect?.w ?? 100, s.rect?.h ?? 100) / 2))
})
const showRadius = computed(() => sel.value && (sel.value.isRect || (sel.value.kind === 'image')))

const val = e => Number(e.target.value)
const alignIcon = computed(() => `i-lucide-align-${sel.value?.textAlign === 'justify' ? 'justify' : (sel.value?.textAlign || 'left')}`)
const FX = [
  { key: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.05 },
  { key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05 },
  { key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.05 },
  { key: 'blur', label: 'Blur', min: 0, max: 1, step: 0.05 },
]
const ALIGN = [
  ['left', 'align-start-vertical', 'Left'], ['center', 'align-center-vertical', 'Center'], ['right', 'align-end-vertical', 'Right'],
  ['top', 'align-start-horizontal', 'Top'], ['middle', 'align-center-horizontal', 'Middle'], ['bottom', 'align-end-horizontal', 'Bottom'],
]
const ORDER = [
  ['front', 'chevrons-up', 'Bring to front'], ['forward', 'arrow-up', 'Bring forward'],
  ['backward', 'arrow-down', 'Send backward'], ['back', 'chevrons-down', 'Send to back'],
]
</script>

<template>
  <div class="rc-toolbar" role="toolbar" aria-label="Canvas toolbar">
    <!-- ── Nothing selected → page options ─────────────────────────────── -->
    <template v-if="!sel">
      <span class="rc-toolbar__label">Page</span>
      <RCanvasColor
        :model-value="state.bg"
        title="Background color"
        icon="paint-bucket"
        @update:model-value="api.setBackground($event)"
      />
      <RCanvasPop title="Background gradient">
        <template #trigger><UIcon name="i-lucide-blend" class="rc-ico" /></template>
        <div class="rc-grad">
          <button
            v-for="g in GRADIENTS"
            :key="g.id"
            type="button"
            class="rc-grad__chip"
            :style="{ background: `linear-gradient(135deg, ${g.stops.join(', ')})` }"
            :title="g.id"
            @click="api.setBackground({ gradient: g.stops })"
          />
        </div>
      </RCanvasPop>
      <span class="rc-toolbar__hint">{{ state.width }} × {{ state.height }} px · click an element to edit it</span>
    </template>

    <!-- ── Selection ───────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Text -->
      <template v-if="sel.hasText">
        <select
          class="rc-select"
          :value="sel.fontFamily"
          aria-label="Font"
          :style="{ fontFamily: sel.fontFamily }"
          @change="api.setFont($event.target.value)"
        >
          <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
        </select>
        <div class="rc-stepper">
          <button type="button" class="rc-btn" aria-label="Smaller" @click="api.setFontSize((sel.fontSize || 24) - 2)">
            <UIcon name="i-lucide-minus" class="rc-ico" />
          </button>
          <input
            type="number" min="6" max="800" class="rc-num" aria-label="Font size"
            :value="sel.fontSize" @change="api.setFontSize(val($event))"
          >
          <button type="button" class="rc-btn" aria-label="Larger" @click="api.setFontSize((sel.fontSize || 24) + 2)">
            <UIcon name="i-lucide-plus" class="rc-ico" />
          </button>
        </div>
        <button type="button" class="rc-btn" :class="{ 'is-on': sel.bold }" title="Bold" @click="api.toggleBold()"><UIcon name="i-lucide-bold" class="rc-ico" /></button>
        <button type="button" class="rc-btn" :class="{ 'is-on': sel.italic }" title="Italic" @click="api.toggleItalic()"><UIcon name="i-lucide-italic" class="rc-ico" /></button>
        <button type="button" class="rc-btn" :class="{ 'is-on': sel.underline }" title="Underline" @click="api.toggleUnderline()"><UIcon name="i-lucide-underline" class="rc-ico" /></button>
        <button type="button" class="rc-btn" :class="{ 'is-on': sel.linethrough }" title="Strikethrough" @click="api.toggleStrike()"><UIcon name="i-lucide-strikethrough" class="rc-ico" /></button>
        <RCanvasPop title="Text align">
          <template #trigger><UIcon :name="alignIcon" class="rc-ico" /></template>
          <template #default="{ close }">
            <div class="rc-row">
              <button
                v-for="a in TEXT_ALIGNS" :key="a" type="button" class="rc-btn" :class="{ 'is-on': sel.textAlign === a }" :title="a"
                @click="api.setAlign(a); close()"
              >
                <UIcon :name="`i-lucide-align-${a}`" class="rc-ico" />
              </button>
            </div>
          </template>
        </RCanvasPop>
        <RCanvasPop title="Spacing">
          <template #trigger><UIcon name="i-lucide-between-horizontal-start" class="rc-ico" /></template>
          <div class="rc-sliders">
            <label>Letter spacing <b>{{ sel.charSpacing }}</b>
              <input type="range" min="-100" max="600" step="10" :value="sel.charSpacing" @input="api.setCharSpacing(val($event))">
            </label>
            <label>Line height <b>{{ Number(sel.lineHeight).toFixed(2) }}</b>
              <input type="range" min="0.8" max="2.5" step="0.05" :value="sel.lineHeight" @input="api.setLineHeight(val($event))">
            </label>
          </div>
        </RCanvasPop>
        <span class="rc-sep" />
      </template>

      <!-- Colours / border -->
      <RCanvasColor
        v-if="showFill"
        :model-value="fillColor"
        :title="sel.kind === 'line' ? 'Line color' : 'Fill color'"
        :icon="sel.hasText ? 'baseline' : 'paint-bucket'"
        @update:model-value="api.setFill($event)"
      />
      <RCanvasPop v-if="showBorder" title="Border">
        <template #trigger><UIcon name="i-lucide-square" class="rc-ico" /></template>
        <div class="rc-sliders">
          <label>Border width <b>{{ sel.strokeWidth }}</b>
            <input type="range" min="0" max="40" step="1" :value="sel.strokeWidth" @input="api.setStrokeWidth(val($event))">
          </label>
          <div class="rc-row">
            <RCanvasColor :model-value="sel.stroke" title="Border color" icon="pen-line" @update:model-value="api.setStroke($event)" />
          </div>
        </div>
      </RCanvasPop>
      <RCanvasPop v-else title="Line weight">
        <template #trigger><UIcon name="i-lucide-minus" class="rc-ico" /></template>
        <div class="rc-sliders">
          <label>Weight <b>{{ sel.strokeWidth }}</b>
            <input type="range" min="1" max="40" step="1" :value="sel.strokeWidth" @input="api.setStrokeWidth(val($event))">
          </label>
        </div>
      </RCanvasPop>

      <RCanvasPop v-if="showRadius" title="Corner radius">
        <template #trigger><UIcon name="i-lucide-square-round-corner" class="rc-ico" /></template>
        <div class="rc-sliders">
          <label>Corner radius <b>{{ Math.round(sel.radius) }}{{ sel.isRect ? '' : '%' }}</b>
            <input type="range" min="0" :max="radiusMax" step="1" :value="sel.radius" @input="api.setRadius(val($event))">
          </label>
        </div>
      </RCanvasPop>

      <!-- Image -->
      <template v-if="sel.kind === 'image'">
        <RCanvasPop title="Adjust image">
          <template #trigger><UIcon name="i-lucide-sliders-horizontal" class="rc-ico" /><span class="rc-btn__text">Adjust</span></template>
          <div class="rc-sliders">
            <label v-for="f in FX" :key="f.key">{{ f.label }} <b>{{ Number(sel.fx[f.key]).toFixed(2) }}</b>
              <input type="range" :min="f.min" :max="f.max" :step="f.step" :value="sel.fx[f.key]" @input="api.setImageFx(f.key, val($event))">
            </label>
          </div>
        </RCanvasPop>
        <button type="button" class="rc-btn" title="Replace image" @click="emit('replace-image')">
          <UIcon name="i-lucide-refresh-cw" class="rc-ico" /><span class="rc-btn__text">Replace</span>
        </button>
      </template>

      <span class="rc-sep" />

      <!-- Common -->
      <RCanvasPop title="Opacity">
        <template #trigger><UIcon name="i-lucide-droplet" class="rc-ico" /></template>
        <div class="rc-sliders">
          <label>Opacity <b>{{ Math.round(sel.opacity * 100) }}</b>
            <input type="range" min="0" max="100" step="1" :value="Math.round(sel.opacity * 100)" @input="api.setOpacity(val($event) / 100)">
          </label>
        </div>
      </RCanvasPop>
      <button type="button" class="rc-btn" :class="{ 'is-on': sel.shadow }" title="Shadow" @click="api.setShadow(!sel.shadow)">
        <UIcon name="i-lucide-sun-dim" class="rc-ico" />
      </button>
      <button type="button" class="rc-btn" title="Flip horizontal" @click="api.flip('x')"><UIcon name="i-lucide-flip-horizontal" class="rc-ico" /></button>
      <button type="button" class="rc-btn" title="Flip vertical" @click="api.flip('y')"><UIcon name="i-lucide-flip-vertical" class="rc-ico" /></button>

      <RCanvasPop title="Align to page / selection">
        <template #trigger><UIcon name="i-lucide-align-horizontal-distribute-center" class="rc-ico" /></template>
        <template #default="{ close }">
          <div class="rc-row rc-row--wrap">
            <button v-for="[k, icon, label] in ALIGN" :key="k" type="button" class="rc-btn" :title="label" @click="api.align(k); close()">
              <UIcon :name="`i-lucide-${icon}`" class="rc-ico" />
            </button>
          </div>
        </template>
      </RCanvasPop>
      <RCanvasPop title="Layer order">
        <template #trigger><UIcon name="i-lucide-layers" class="rc-ico" /></template>
        <template #default="{ close }">
          <div class="rc-list">
            <button v-for="[k, icon, label] in ORDER" :key="k" type="button" class="rc-list__item" @click="api.order(k); close()">
              <UIcon :name="`i-lucide-${icon}`" class="rc-ico" /> {{ label }}
            </button>
          </div>
        </template>
      </RCanvasPop>

      <button v-if="sel.kind === 'multi'" type="button" class="rc-btn" title="Group (Ctrl+G)" @click="api.group()">
        <UIcon name="i-lucide-group" class="rc-ico" /><span class="rc-btn__text">Group</span>
      </button>
      <button v-if="sel.kind === 'group'" type="button" class="rc-btn" title="Ungroup (Ctrl+Shift+G)" @click="api.ungroup()">
        <UIcon name="i-lucide-ungroup" class="rc-ico" /><span class="rc-btn__text">Ungroup</span>
      </button>

      <button type="button" class="rc-btn" :class="{ 'is-on': sel.locked }" :title="sel.locked ? 'Unlock' : 'Lock'" @click="api.setLocked(!sel.locked)">
        <UIcon :name="sel.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'" class="rc-ico" />
      </button>
      <button type="button" class="rc-btn" title="Duplicate (Ctrl+D)" @click="api.duplicate()"><UIcon name="i-lucide-copy" class="rc-ico" /></button>
      <button type="button" class="rc-btn rc-btn--danger" title="Delete" @click="api.remove()"><UIcon name="i-lucide-trash-2" class="rc-ico" /></button>

      <span v-if="sel.rect" class="rc-toolbar__hint">{{ sel.rect.w }} × {{ sel.rect.h }}</span>
    </template>
  </div>
</template>
