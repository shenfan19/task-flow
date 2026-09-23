<template>
  <div class="filter-panel-wrapper">
    <button class="btn btn-sm btn-outline-secondary bg-white shadow-sm d-flex align-items-center mb-2" @click="isCollapsed = !isCollapsed">
      <span class="me-2">File Filters</span>
      <span>{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>

    <div v-show="!isCollapsed" class="filter-panel-content bg-white border rounded shadow-sm p-3" style="width: 300px; max-height: calc(100vh - 100px); overflow-y: auto;">
      <h6>File Filters (AND)</h6>
      <hr class="my-2">

      <!-- Only tasks with a dependsOn relation -->
      <div class="form-check mb-3">
        <input
          class="form-check-input"
          type="checkbox"
          id="onlyRelatedToggle"
          v-model="taskStore.filters.onlyRelated"
        >
        <label class="form-check-label" for="onlyRelatedToggle">Only show tasks with a relation</label>
      </div>

      <!-- Saved Presets -->
      <div class="mb-3">
        <label class="form-label text-muted small fw-bold mb-1">Presets</label>
        <div class="d-flex gap-1 mb-1">
          <select class="form-select form-select-sm" v-model="selectedPresetId" @change="onPresetSelect">
            <option value="">-- none --</option>
            <option v-for="preset in taskStore.filterPresets" :key="preset.id" :value="preset.id">
              {{ preset.name }}
            </option>
          </select>
          <button
            class="btn btn-sm btn-outline-danger"
            :disabled="!selectedPresetId"
            @click="onDeletePreset"
          >
            Delete
          </button>
        </div>
        <div class="d-flex gap-1">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder="New preset name"
            v-model="newPresetName"
          >
          <button
            class="btn btn-sm btn-outline-primary"
            :disabled="!newPresetName.trim()"
            @click="onSavePreset"
          >
            Save
          </button>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="mb-3">
        <label class="form-label text-muted small fw-bold mb-1">Status</label>
        <div class="d-flex gap-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="taskStore.filters.status.todo" id="filterTodo">
            <label class="form-check-label" for="filterTodo">To-do</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="taskStore.filters.status.done" id="filterDone">
            <label class="form-check-label" for="filterDone">Done</label>
          </div>
        </div>
      </div>

      <!-- Directory Tree Filter -->
      <div>
        <label class="form-label text-muted small fw-bold mb-1">Directory Path</label>
        <div class="d-flex gap-3 mb-1">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              value="include"
              v-model="taskStore.filters.directoryMode"
              id="dirModeInclude"
            >
            <label class="form-check-label" for="dirModeInclude">Include checked</label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              value="exclude"
              v-model="taskStore.filters.directoryMode"
              id="dirModeExclude"
            >
            <label class="form-check-label" for="dirModeExclude">Exclude checked</label>
          </div>
        </div>
        <div class="directory-tree border rounded bg-light p-2 mt-1">
          <template v-for="node in treeData" :key="node.path">
            <TreeNode :node="node" />
          </template>
          <div v-if="treeData.length === 0" class="text-muted small text-center p-2">
            No directories found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTaskStore } from '../store';
import TreeNode from './TreeNode.vue';

const taskStore = useTaskStore();
const isCollapsed = ref(true); // Default collapsed like graph view
const treeData = ref([]);
const selectedPresetId = ref('');
const newPresetName = ref('');

const onPresetSelect = () => {
  if (selectedPresetId.value) taskStore.applyFilterPreset(selectedPresetId.value);
};

const onSavePreset = () => {
  const name = newPresetName.value.trim();
  if (!name) return;
  taskStore.saveFilterPreset(name);
  newPresetName.value = '';
};

const onDeletePreset = () => {
  if (!selectedPresetId.value) return;
  taskStore.deleteFilterPreset(selectedPresetId.value);
  selectedPresetId.value = '';
};

// Helper to build tree from flat paths
const buildTree = (paths) => {
  const root = [];
  const map = {};

  paths.forEach(dir => {
    const parts = dir.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      let existingNode = currentLevel.find(n => n.name === part);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          children: []
        };
        currentLevel.push(existingNode);
      }
      currentLevel = existingNode.children;
    });
  });

  return root;
};

onMounted(() => {
  if (window.app && window.app.vault) {
    const files = window.app.vault.getAllLoadedFiles();
    const dirs = files
      .filter(f => f.children) // Is directory
      .filter(f => f.path !== '/') // Skip root usually
      .map(f => ({ name: f.name, path: f.path }));
    
    treeData.value = buildTree(dirs);
  } else {
    // Fallback Mock
    treeData.value = buildTree([
      { path: 'projects/frontend' },
      { path: 'projects/backend/api' },
      { path: 'projects/backend/db' },
      { path: 'archives/2025' }
    ]);
  }
});
</script>

<style scoped>
.directory-tree {
  font-size: 0.85rem;
  max-height: 250px;
  overflow-y: auto;
}
</style>
