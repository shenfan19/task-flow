<template>
  <div class="tree-node ms-2">
    <div class="d-flex align-items-center py-1">
      <!-- Caret for expanding/collapsing if has children -->
      <span 
        v-if="node.children && node.children.length > 0" 
        class="tree-caret me-1 cursor-pointer"
        @click="isExpanded = !isExpanded"
        style="width: 15px; display: inline-block; cursor: pointer;"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else style="width: 15px; display: inline-block;"></span>
      
      <div class="form-check mb-0">
        <!-- Checking a folder adds the path prefix to the array -->
        <input 
          class="form-check-input" 
          type="checkbox" 
          :value="node.path" 
          v-model="taskStore.filters.directories"
          @change="handleCheckboxChange"
          :id="'tree-' + node.path"
        >
        <label class="form-check-label text-truncate d-block cursor-pointer" :for="'tree-' + node.path" :title="node.path">
          <span class="fs-6 me-1">📁</span> {{ node.name }}
        </label>
      </div>
    </div>
    
    <!-- Recursive Children -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="border-start ms-2 ps-1">
      <TreeNode 
        v-for="child in node.children" 
        :key="child.path" 
        :node="child" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
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
.tree-node {
  font-size: 0.9em;
}
.cursor-pointer {
  cursor: pointer;
}
.tree-caret {
  font-size: 0.7em;
  color: #666;
  user-select: none;
}
</style>
