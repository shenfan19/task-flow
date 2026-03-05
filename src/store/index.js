import { defineStore } from 'pinia';

export const useTaskStore = defineStore('task', {
  state: () => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    return {
      tasks: savedTasks,
      nextId: savedTasks.length > 0 ? Math.max(...savedTasks.map(t => t.id)) + 1 : 1
    };
  },
  actions: {
    addTask(task) {
      if (task.dependencies && !this.validateDependencies(task.dependencies)) {
        throw new Error('无效或循环依赖');
      }
      task.id = this.nextId++;
      task.dependencies = task.dependencies
        ? task.dependencies.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
      this.tasks.push(task);
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
      console.log('任务添加成功:', task);
    },
    validateDependencies(depIds) {
      const ids = depIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      return ids.every(id => this.tasks.some(task => task.id === id) && !this.hasCircularDependency(id, ids));
    },
    hasCircularDependency(taskId, depIds, visited = new Set()) {
      if (visited.has(taskId)) return true;
      visited.add(taskId);
      const task = this.tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies) return false;
      return task.dependencies.some(depId => this.hasCircularDependency(depId, depIds, new Set(visited)));
    }
  }
});