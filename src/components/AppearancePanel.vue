<template>
  <div class="appearance-panel-wrapper">
    <button
      class="btn btn-sm btn-outline-secondary bg-white shadow-sm d-flex align-items-center"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="me-2">Node Style</span>
      <span>{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>

    <div v-show="!isCollapsed" class="appearance-panel-content bg-white border rounded shadow-sm p-3 mt-2">
      <div class="mb-2">
        <label class="form-label text-muted small fw-bold mb-1 d-block">Background</label>
        <input type="color" :value="taskStore.appearance.nodeBg" @input="onColorChange('nodeBg', $event)">
      </div>
      <div class="mb-2">
        <label class="form-label text-muted small fw-bold mb-1 d-block">Border</label>
        <input type="color" :value="taskStore.appearance.nodeBorder" @input="onColorChange('nodeBorder', $event)">
      </div>
      <div class="mb-2">
        <label class="form-label text-muted small fw-bold mb-1 d-block">Text Color</label>
        <input type="color" :value="taskStore.appearance.nodeText" @input="onColorChange('nodeText', $event)">
      </div>
      <div class="mb-2">
        <label class="form-label text-muted small fw-bold mb-1 d-block">Font Size (px)</label>
        <input
          type="number"
          min="10"
          max="24"
          :value="taskStore.appearance.fontSize"
          @input="taskStore.updateAppearance({ fontSize: Number($event.target.value) })"
        >
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="richTextToggle"
          :checked="taskStore.appearance.richText"
          @change="taskStore.updateAppearance({ richText: $event.target.checked })"
        >
        <label class="form-check-label" for="richTextToggle">Rich text</label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="priorityStylingToggle"
          :checked="taskStore.appearance.priorityStyling"
          @change="taskStore.updateAppearance({ priorityStyling: $event.target.checked })"
        >
        <label class="form-check-label" for="priorityStylingToggle">Color/size by priority</label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          id="showTagsToggle"
          :checked="taskStore.appearance.showTags"
          @change="taskStore.updateAppearance({ showTags: $event.target.checked })"
        >
        <label class="form-check-label" for="showTagsToggle">Show tags</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTaskStore } from '../store';

const taskStore = useTaskStore();
const isCollapsed = ref(true);

const onColorChange = (key, event) => {
  taskStore.updateAppearance({ [key]: event.target.value });
};
</script>

<style scoped>
.appearance-panel-content {
  width: 220px;
}
</style>
