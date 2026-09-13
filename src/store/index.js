import { defineStore } from 'pinia';
import { TasksPluginAPI } from '../api/TasksPluginAPI';
import { stableTaskId } from '../utils/hash';

export const useTaskStore = defineStore('task', {
  state: () => {
    return {
      tasks: [], // We'll populate this from Obsidian Tasks
      positions: {}, // id -> {x, y}, loaded from plugin data.json via loadPositions()
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
    },
    // Dependency edges derived from the Tasks plugin's own id / dependsOn fields,
    // restricted to edges whose endpoints both survive the current filter.
    filteredEdges() {
      const visibleIds = new Set(this.filteredTasks.map((t) => t.id));
      const nodeIdByPluginId = new Map();
      for (const task of this.tasks) {
        if (task.pluginId) nodeIdByPluginId.set(task.pluginId, task.id);
      }

      const edges = [];
      for (const task of this.filteredTasks) {
        for (const depPluginId of task.dependsOn) {
          const sourceId = nodeIdByPluginId.get(depPluginId);
          if (sourceId && visibleIds.has(sourceId)) {
            edges.push({ id: `${sourceId}->${task.id}`, source: sourceId, target: task.id });
          }
        }
      }
      return edges;
    }
  },
  actions: {
    async loadPositions() {
      if (!window.flowyTaskPlugin) return;
      const data = await window.flowyTaskPlugin.loadData();
      this.positions = data || {};
    },
    fetchTasksFromObsidian() {
      if (!window.app) return;

      const api = new TasksPluginAPI(window.app);
      const allTasks = api.getTasks() || [];

      this.tasks = allTasks.map((t) => {
        const name = t.descriptionWithoutTags || t.description || 'Unnamed Task';
        const path = t.taskLocation?.path || t.path || '';
        const id = stableTaskId(path, name);
        const pos = this.positions[id] || { x: Math.random() * 500, y: Math.random() * 500 };
        return {
          id, // stable across re-parses; independent of the Tasks plugin's own id field
          pluginId: t.id || '', // Tasks plugin's own 🆔, used to match dependsOn references
          dependsOn: t.dependsOn || [],
          originalTask: t, // Keep a reference to the actual Obsidian Task object
          name,
          path,
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
    async savePositions() {
      if (!window.flowyTaskPlugin) return;
      await window.flowyTaskPlugin.saveData(this.positions);
    }
  }
});