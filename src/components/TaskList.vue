<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">任务列表（按优先级和截止日期排序）</h5>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>截止日期</th>
            <th>优先级</th>
            <th>依赖</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in sortedTasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.name }}</td>
            <td>{{ task.dueDate }}</td>
            <td>{{ ['低', '中', '高'][task.priority - 1] }}</td>
            <td>{{ task.dependencies.join(', ') || '无' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTaskStore } from '../store';

const taskStore = useTaskStore();
const sortedTasks = computed(() =>
  [...taskStore.tasks].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return new Date(a.dueDate) - new Date(b.dueDate);
  })
);
</script>