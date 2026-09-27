<template>
  <div class="card mb-4 shadow-sm">
    <div class="card-body">
      <h5 class="card-title">添加任务</h5>
      <form @submit.prevent="addTask">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="taskName" class="form-label">任务名称</label>
            <input type="text" class="form-control" id="taskName" v-model="form.name" required>
          </div>
          <div class="col-md-3 mb-3">
            <label for="dueDate" class="form-label">截止日期</label>
            <input type="date" class="form-control" id="dueDate" v-model="form.dueDate" required>
          </div>
          <div class="col-md-3 mb-3">
            <label for="priority" class="form-label">优先级</label>
            <select class="form-select" id="priority" v-model="form.priority" required>
              <option value="1">低</option>
              <option value="2">中</option>
              <option value="3">高</option>
            </select>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="taskPath" class="form-label">归属目录</label>
            <select class="form-select" id="taskPath" v-model="form.path">
              <option value="">(根目录)</option>
              <option v-for="dir in availableDirectories" :key="dir.path" :value="dir.path">
                {{ dir.path }}
              </option>
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label for="dependencies" class="form-label">依赖任务 (多选)</label>
            <select multiple class="form-select" id="dependencies" v-model="form.dependencies" style="height: auto;">
              <option v-for="t in taskStore.tasks" :key="t.id" :value="t.id">
                [{{ t.id }}] {{ t.name }}
              </option>
            </select>
            <small class="text-muted">按住 Ctrl/Cmd 可以多选</small>
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary w-100">添加任务</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTaskStore } from '../store';
import { getApp } from '../pluginContext';

const taskStore = useTaskStore();
const availableDirectories = ref([]);

const form = ref({
  name: '',
  dueDate: '',
  priority: 1,
  path: '',
  dependencies: []
});

onMounted(() => {
  // Fetch directories from Obsidian vault or use fallback
  const app = getApp();
  if (app) {
    const files = app.vault.getAllLoadedFiles();
    availableDirectories.value = files
      .filter(f => f.children && f.path !== '/') 
      .map(f => ({ name: f.name, path: f.path }));
  } else {
    availableDirectories.value = [
      { path: 'projects/frontend' },
      { path: 'projects/backend/api' },
      { path: 'projects/backend/db' },
      { path: 'archives/2025' }
    ];
  }
});

const addTask = () => {
  try {
    taskStore.addTask({
      name: form.value.name,
      dueDate: form.value.dueDate,
      priority: parseInt(form.value.priority),
      path: form.value.path,
      // Pass the array directly, the store can handle it or convert to string if legacy
      dependencies: form.value.dependencies 
    });
    form.value = { name: '', dueDate: '', priority: 1, path: '', dependencies: [] }; // 重置表单
  } catch (error) {
    alert(error.message);
  }
};
</script>
