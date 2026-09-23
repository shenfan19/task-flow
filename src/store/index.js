import { defineStore } from 'pinia';
import { TasksPluginAPI } from '../api/TasksPluginAPI';
import { stableTaskId } from '../utils/hash';
import { generateTaskId, addIdTag, addDependsOnTag, removeDependsOnTag } from '../utils/taskLineEdits';

// Rewrites one line of a task's source file in place. Line numbers are
// stable across these edits since they only append/adjust trailing inline
// text, never insert or remove whole lines.
async function editTaskLine(task, transform) {
  if (!window.app) return;
  const file = window.app.vault.getAbstractFileByPath(task.path);
  if (!file) return;
  const lineNumber = task.originalTask?.taskLocation?.lineNumber;
  if (lineNumber === undefined) return;

  await window.app.vault.process(file, (content) => {
    const lines = content.split('\n');
    if (lines[lineNumber] === undefined) return content;
    lines[lineNumber] = transform(lines[lineNumber]);
    return lines.join('\n');
  });
}

export const useTaskStore = defineStore('task', {
  state: () => {
    return {
      tasks: [], // We'll populate this from Obsidian Tasks
      positions: {}, // id -> {x, y}, loaded from plugin data.json via loadState()
      filters: {
        directories: [],
        directoryMode: 'include', // 'include': only show checked dirs; 'exclude': hide checked dirs
        status: {
          done: true,
          todo: true
        },
        onlyRelated: true // hide tasks with no dependsOn link either way; was previously hardcoded on
      },
      filterPresets: [], // [{id, name, directories, directoryMode, status}], persisted via saveState
      appearance: {
        nodeBg: '#ffffff',
        nodeBorder: '#0d6efd',
        nodeText: '#212529',
        fontSize: 12,
        richText: false, // off by default: skips the MarkdownRenderer call entirely, not just hides its output
        priorityStyling: false // off by default: when on, priority overrides border color + node size (see TaskFlowNode.vue)
      },
      viewSettings: {
        layoutDirection: 'TB', // dagre rankdir: TB/BT/LR/RL
        edgeType: 'default', // vue-flow edge type: default(bezier)/straight/smoothstep
        autoLayoutEnabled: false, // off by default: re-running dagre on a timer repositions every node, which visibly jumps
        autoLayoutInterval: 10, // seconds
        autoRefreshEnabled: true, // preserves the previous always-on behavior
        autoRefreshInterval: 30 // seconds
      }
    };
  },
  getters: {
    // Tasks plugin ids referenced by at least one other task's dependsOn,
    // used below to tell whether a task is a dependency of something else.
    referencedPluginIds() {
      const ids = new Set();
      for (const task of this.tasks) {
        for (const dep of task.dependsOn) ids.add(dep);
      }
      return ids;
    },
    filteredTasks() {
      return this.tasks.filter(task => {
        // A task with no dependency link either way is noise on a vault this
        // size (thousands of tasks); it belongs in a plain to-do list, not a
        // dependency graph. Toggleable rather than hardcoded, see the
        // "only related" checkbox in FilterPanel.vue.
        if (this.filters.onlyRelated) {
          const hasOutgoing = task.dependsOn.length > 0;
          const hasIncoming = task.pluginId && this.referencedPluginIds.has(task.pluginId);
          if (!hasOutgoing && !hasIncoming) return false;
        }

        // Logic AND between all filters

        // 1. Directory Filter (Obsidian task path)
        let dirMatch = true;
        if (this.filters.directories.length > 0) {
          // Task plugin gives 'path' which is the file path (e.g. 'folder/file.md')
          const matchesChecked = this.filters.directories.some(dir => task.path?.startsWith(dir));
          dirMatch = this.filters.directoryMode === 'exclude' ? !matchesChecked : matchesChecked;
        }

        // 2. Status Filter
        let statusMatch = false;
        // Obsidian Task status is usually a class/object. Let's simplify:
        // ' ' is todo, 'x' or 'X' or '-' is done/cancelled
        const isDone = task.status?.symbol !== ' ';
        if (this.filters.status.done && isDone) statusMatch = true;
        if (this.filters.status.todo && !isDone) statusMatch = true;

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
    async loadState() {
      if (!window.taskFlowchartPlugin) return;
      const data = await window.taskFlowchartPlugin.loadData();
      // data.json used to be a flat {id: {x,y}} positions map; fall back to
      // treating the whole object as positions if it isn't in the new shape.
      this.positions = data?.positions ?? data ?? {};
      if (data?.appearance) {
        this.appearance = { ...this.appearance, ...data.appearance };
      }
      if (data?.viewSettings) {
        this.viewSettings = { ...this.viewSettings, ...data.viewSettings };
      }
      if (data?.filterPresets) {
        this.filterPresets = data.filterPresets;
      }
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
          priority: t.priority, // Tasks plugin's Priority enum string ('0' Highest .. '5' Lowest, '3' None)
          position: pos
        };
      });
    },
    updateTaskPosition(taskId, x, y) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.position = { x, y };
        this.positions[taskId] = { x, y };
        this.saveState();
      }
    },
    updateAppearance(partial) {
      this.appearance = { ...this.appearance, ...partial };
      this.saveState();
    },
    updateViewSettings(partial) {
      this.viewSettings = { ...this.viewSettings, ...partial };
      this.saveState();
    },
    saveFilterPreset(name) {
      this.filterPresets.push({
        id: Date.now().toString(36),
        name,
        directories: [...this.filters.directories],
        directoryMode: this.filters.directoryMode,
        status: { ...this.filters.status },
        onlyRelated: this.filters.onlyRelated
      });
      this.saveState();
    },
    applyFilterPreset(id) {
      const preset = this.filterPresets.find((p) => p.id === id);
      if (!preset) return;
      this.filters.directories = [...preset.directories];
      this.filters.directoryMode = preset.directoryMode;
      this.filters.status = { ...preset.status };
      if (preset.onlyRelated !== undefined) this.filters.onlyRelated = preset.onlyRelated;
    },
    deleteFilterPreset(id) {
      this.filterPresets = this.filterPresets.filter((p) => p.id !== id);
      this.saveState();
    },
    // Drawing an edge from `source` to `target` on the canvas means "target
    // depends on source" — writes real 🆔/⛔ tags back to both files (giving
    // source an id first if it doesn't have one yet), and updates the
    // in-memory tasks immediately so the graph reflects it without waiting
    // for the Tasks plugin to re-index the file.
    async connectTasks(sourceTaskId, targetTaskId) {
      const source = this.tasks.find((t) => t.id === sourceTaskId);
      const target = this.tasks.find((t) => t.id === targetTaskId);
      if (!source || !target || source === target) return;

      let sourcePluginId = source.pluginId;
      if (!sourcePluginId) {
        const existingIds = new Set(this.tasks.map((t) => t.pluginId).filter(Boolean));
        sourcePluginId = generateTaskId(existingIds);
        await editTaskLine(source, (line) => addIdTag(line, sourcePluginId));
        source.pluginId = sourcePluginId;
      }

      if (target.dependsOn.includes(sourcePluginId)) return;
      await editTaskLine(target, (line) => addDependsOnTag(line, sourcePluginId));
      target.dependsOn = [...target.dependsOn, sourcePluginId];
    },
    // Removes the dependency the given edge represents, both from the
    // target's file and from the in-memory task.
    async disconnectTasks(sourceTaskId, targetTaskId) {
      const source = this.tasks.find((t) => t.id === sourceTaskId);
      const target = this.tasks.find((t) => t.id === targetTaskId);
      if (!source || !target || !source.pluginId) return;

      await editTaskLine(target, (line) => removeDependsOnTag(line, source.pluginId));
      target.dependsOn = target.dependsOn.filter((id) => id !== source.pluginId);
    },
    async saveState() {
      if (!window.taskFlowchartPlugin) return;
      await window.taskFlowchartPlugin.saveData({
        positions: this.positions,
        appearance: this.appearance,
        viewSettings: this.viewSettings,
        filterPresets: this.filterPresets
      });
    }
  }
});