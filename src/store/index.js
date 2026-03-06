import { defineStore } from 'pinia';
import { TasksPluginAPI } from '../api/TasksPluginAPI';

export const useTaskStore = defineStore('task', {
  state: () => {
    // Load previously saved positions mapping (id -> {x, y})
    const savedPositions = JSON.parse(localStorage.getItem('flowy_task_positions')) || {};
    
    return {
      tasks: [], // We'll populate this from Obsidian Tasks
      positions: savedPositions,
      filters: {
        directories: [],
        status: {
          done: true,
          todo: true
        }
      }
    };
  },
  getters: {
    filteredTasks: (state) => {
      return state.tasks.filter(task => {
        // Logic AND between all filters
        
        // 1. Directory Filter (Obsidian task path)
        let dirMatch = true;
        if (state.filters.directories.length > 0) {
          // Task plugin gives 'path' which is the file path (e.g. 'folder/file.md')
          dirMatch = state.filters.directories.some(dir => task.path?.startsWith(dir));
        }

        // 2. Status Filter
        let statusMatch = false;
        // Obsidian Task status is usually a class/object. Let's simplify:
        // ' ' is todo, 'x' or 'X' or '-' is done/cancelled
        const isDone = task.status?.symbol !== ' ';
        if (state.filters.status.done && isDone) statusMatch = true;
        if (state.filters.status.todo && !isDone) statusMatch = true;

        return dirMatch && statusMatch;
      });
    }
  },
  actions: {
    fetchTasksFromObsidian() {
      if (!window.app) return;
      
      const api = new TasksPluginAPI(window.app);
      const allTasks = api.getTasks() || [];
      
      // Limit to 20 for initial prototype
      const limitedTasks = allTasks.slice(0, 20);
      
      this.tasks = limitedTasks.map((t, indexStr) => {
        const id = `obsidian-task-${indexStr}`;
        const pos = this.positions[id] || { x: Math.random() * 500, y: Math.random() * 500 };
        return {
          id: id,
          originalTask: t, // Keep a reference to the actual Obsidian Task object
          name: t.descriptionWithoutTags || t.description || 'Unnamed Task',
          path: t.taskLocation?.path || t.path || '',
          completed: t.status?.symbol !== ' ',
          status: t.status,
          position: pos
        };
      });
      console.log('FlowyTask: Fetched tasks from Obsidian Tasks plugin:', this.tasks);
    },
    updateTaskPosition(taskId, x, y) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.position = { x, y };
        this.positions[taskId] = { x, y };
        this.savePositions();
      }
    },
    savePositions() {
      localStorage.setItem('flowy_task_positions', JSON.stringify(this.positions));
    }
  }
});