<template>
  <div class="card mb-4">
    <div class="card-body">
      <h5 class="card-title">添加任务</h5>
      <form @submit.prevent="addTask">
        <div class="mb-3">
          <label for="taskName" class="form-label">任务名称</label>
          <input type="text" class="form-control" id="taskName" v-model="form.name" required>
        </div>
        <div class="mb-3">
          <label for="dueDate" class="form-label">截止日期</label>
          <input type="date" class="form-control" id="dueDate" v-model="form.dueDate" required>
        </div>
        <div class="mb-3">
          <label for="priority" class="form-label">优先级</label>
          <select class="form-select" id="priority" v-model="form.priority" required>
            <option value="1">低</option>
            <option value="2">中</option>
            <option value="3">高</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="dependencies" class="form-label">依赖任务（ID，逗号分隔）</label>
          <input type="text" class="form-control" id="dependencies" v-model="form.dependencies" placeholder="例如：1,2">
        </div>
        <button type="submit" class="btn btn-primary">添加任务</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTaskStore } from '../store';

const taskStore = useTaskStore();
const form = ref({
  name: '',
  dueDate: '',
  priority: 1,
  dependencies: ''
});

const addTask = () => {
  try {
    taskStore.addTask({
      name: form.value.name,
      dueDate: form.value.dueDate,
      priority: parseInt(form.value.priority),
      dependencies: form.value.dependencies
    });
    form.value = { name: '', dueDate: '', priority: 1, dependencies: '' }; // 重置表单
  } catch (error) {
    alert(error.message);
  }
};
</script>