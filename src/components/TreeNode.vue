<template>
  <div class="tree-node">
    <div class="tree-node__row">
      <span
        v-if="node.children && node.children.length > 0"
        class="tree-node__caret"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="tree-node__caret tree-node__caret--spacer"></span>

      <input
        class="tree-node__checkbox"
        type="checkbox"
        :value="node.path"
        v-model="taskStore.filters.directories"
        @change="handleCheckboxChange"
        :id="'tree-' + node.path"
      >
      <label class="tree-node__label" :for="'tree-' + node.path" :title="node.path">
        <span>📁</span> {{ node.name }}
      </label>
    </div>

    <!-- Recursive Children -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="tree-node__children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTaskStore } from '../store';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const taskStore = useTaskStore();
const isExpanded = ref(false); // Default collapsed

// Optional: Logic to automatically check/uncheck children when parent is checked
// The user requested "目录树可以选中父目录从而选中所有子目录".
// In our filter logic (startsWith), selecting a parent inherently includes everything under it.
// We just need to ensure the UI behaves intuitively or we let the backend filter logic handle it.
// The backend uses `task.path?.startsWith(dir)`, so selecting 'projects/frontend' mathematically limits
// results to everything starting with 'projects/frontend', effectively selecting children.

const handleCheckboxChange = (event) => {
  const isChecked = event.target.checked;

  if (isChecked) {
    // If a parent is checked, we might want to automatically uncheck explicit child selections
    // to keep the array clean, but it's not strictly necessary for the startsWith filter logic.
    taskStore.filters.directories = taskStore.filters.directories.filter(dir => !dir.startsWith(props.node.path + '/'));
  }
};
</script>

<style scoped>
/* Bootstrap's ms-2/ps-1/border-start/d-flex classes previously here had no
   effect (no bootstrap.css loaded, see App.vue) — that's why nested levels
   rendered without indentation. Plain CSS below gives each recursion level
   an actual left offset and a vertical guide line. */
.tree-node {
  font-size: 0.9em;
}

.tree-node__row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}

.tree-node__caret {
  width: 14px;
  flex-shrink: 0;
  display: inline-block;
  font-size: 0.7em;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.tree-node__caret--spacer {
  cursor: default;
}

.tree-node__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.tree-node__children {
  margin-left: 10px;
  padding-left: 8px;
  border-left: 1px solid var(--background-modifier-border, #ccc);
}
</style>
