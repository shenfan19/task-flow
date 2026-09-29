<template>
  <RailCard title="File Filters">
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

    <hr class="ft-sep">

    <!-- Keyword exclusion, matched anywhere in the task line -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1" for="excludeTextInput">Exclude tasks containing</label>
      <input
        id="excludeTextInput"
        type="text"
        class="form-control form-control-sm ft-exclude-input"
        placeholder="e.g. archived on, #someday"
        title="Comma-separated keywords. A task whose line contains any of them, in any case, is hidden."
        v-model.trim="taskStore.filters.excludeText"
      >
    </div>

    <hr class="ft-sep">

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

    <hr class="ft-sep">

    <!-- Tag Filter: click a chip to check/uncheck it -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1">Tags</label>
      <div class="d-flex gap-3 mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="include"
            v-model="taskStore.filters.tagMode"
            id="tagModeInclude"
          >
          <label class="form-check-label" for="tagModeInclude">Include checked</label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="exclude"
            v-model="taskStore.filters.tagMode"
            id="tagModeExclude"
          >
          <label class="form-check-label" for="tagModeExclude">Exclude checked</label>
        </div>
      </div>
      <div class="ft-tag-list">
        <!-- A span rather than a button: Obsidian's global button styles
             outrank a single class and would paint over the tag colors. -->
        <span
          v-for="{ tag, count } in taskStore.availableTags"
          :key="tag"
          role="button"
          tabindex="0"
          class="ft-tag ft-tag-toggle"
          :class="{ 'ft-tag-toggle--on': checkedTags.has(tag) }"
          :style="{ '--ft-tag-hue': taskStore.tagHues.get(tag) ?? 0 }"
          :title="`${count} task${count === 1 ? '' : 's'}`"
          @click="taskStore.toggleTagFilter(tag)"
          @keydown.enter.prevent="taskStore.toggleTagFilter(tag)"
        >{{ tag.replace(/^#/, '') }}</span>
        <span v-if="taskStore.availableTags.length === 0" class="text-muted small">No tags found</span>
      </div>
      <button
        v-if="taskStore.filters.tags.length"
        type="button"
        class="ft-tag-clear"
        @click="taskStore.filters.tags = []"
      >Clear</button>
    </div>

    <hr class="ft-sep">

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
  </RailCard>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTaskStore } from '../store';
import RailCard from './RailCard.vue';
import { getApp } from '../pluginContext';
import TreeNode from './TreeNode.vue';

const taskStore = useTaskStore();
const treeData = ref([]);
const checkedTags = computed(() => new Set(taskStore.filters.tags));

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
  const app = getApp();
  if (app) {
    const files = app.vault.getAllLoadedFiles();
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
.ft-exclude-input {
  width: 100%;
}

.ft-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

/* Unchecked chips are faded so the checked ones stand out; the chip colors
   themselves come from the shared .ft-tag rule in TaskFlowNode.vue. */
.ft-tag-toggle {
  cursor: pointer;
  opacity: 0.45;
  font-size: 0.8rem;
}

.ft-tag-toggle--on {
  opacity: 1;
  font-weight: 600;
  border-width: 2px;
}

.ft-tag-clear {
  margin-top: 4px;
  font-size: 0.75rem;
  padding: 0 6px;
}

.directory-tree {
  font-size: 0.85rem;
  max-height: 250px;
  overflow-y: auto;
}
</style>
