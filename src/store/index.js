import { defineStore } from 'pinia';
import { TasksPluginAPI } from '../api/TasksPluginAPI';
import { getApp, getPlugin } from '../pluginContext';
import { stableTaskId } from '../utils/hash';
import { assignTagHues } from '../utils/tagColor';
import {
  generateTaskId,
  addIdTag,
  addDependsOnTag,
  removeDependsOnTag,
  newSiblingTaskLine,
  listItemBlockEnd
} from '../utils/taskLineEdits';

// Which line of `lines` currently holds `task`. Normally its recorded line
// number, but a line inserted above it (see createLinkedTask) shifts it down
// until the Tasks plugin re-indexes the file, so when that line no longer
// matches the task's own markdown, the nearest line that does is used.
function locateTaskLine(lines, task) {
  const lineNumber = task.originalTask?.taskLocation?.lineNumber;
  const markdown = task.originalTask?.originalMarkdown;
  if (lineNumber === undefined) return -1;
  if (!markdown || lines[lineNumber] === markdown) return lines[lineNumber] === undefined ? -1 : lineNumber;
  let best = -1;
  lines.forEach((l, i) => {
    if (l === markdown && (best === -1 || Math.abs(i - lineNumber) < Math.abs(best - lineNumber))) best = i;
  });
  return best === -1 && lines[lineNumber] !== undefined ? lineNumber : best;
}

// Rewrites one line of a task's source file in place. Only appends/adjusts
// trailing inline text, never inserts or removes whole lines.
async function editTaskLine(task, transform) {
  const app = getApp();
  if (!app) return;
  const file = app.vault.getAbstractFileByPath(task.path);
  if (!file) return;

  await app.vault.process(file, (content) => {
    const lines = content.split('\n');
    const index = locateTaskLine(lines, task);
    if (index === -1) return content;
    lines[index] = transform(lines[index]);
    task.originalTask = { ...task.originalTask, originalMarkdown: lines[index] };
    return lines.join('\n');
  });
}

// Name for a task created by dragging out of a node; numbered when the
// file already has one of that name, since the node id is derived from
// path + name and two identical names would collide.
const NEW_TASK_NAME = 'new task';
const UNINDEXED_GRACE_MS = 60000;

// The one date a task is placed by on the time axis: done date for a
// finished task (when it actually happened), otherwise scheduled, then due
// (when it is meant to happen). Returned as a whole-day number counted in
// UTC so time zones can never shift a task onto a neighboring day.
const DATE_FIELDS = ['doneDate', 'scheduledDate', 'dueDate'];

function taskDay(t) {
  for (const field of DATE_FIELDS) {
    const m = t[field];
    if (!m || typeof m.isValid !== 'function' || !m.isValid()) continue;
    const [y, mo, d] = m.format('YYYY-MM-DD').split('-').map(Number);
    return Date.UTC(y, mo - 1, d) / 86400000;
  }
  return null;
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
        onlyRelated: true, // hide tasks with no dependsOn link either way; was previously hardcoded on
        tags: [],
        tagMode: 'include' // 'include': only tasks with any checked tag; 'exclude': hide tasks with any checked tag
      },
      filterPresets: [], // [{id, name, directories, directoryMode, status}], persisted via saveState
      appearance: {
        nodeBg: '#ffffff',
        nodeBorder: '#0d6efd',
        nodeText: '#212529',
        fontSize: 12,
        richText: false, // off by default: skips the MarkdownRenderer call entirely, not just hides its output
        priorityStyling: false, // off by default: when on, priority overrides border color + node size (see TaskFlowNode.vue)
        showTags: true // colored tag chips under each node's text
      },
      viewSettings: {
        layoutDirection: 'TB', // dagre rankdir: TB/BT/LR/RL
        edgeType: 'default', // vue-flow edge type: default(bezier)/straight/smoothstep
        autoLayoutEnabled: false, // off by default: re-running dagre on a timer repositions every node, which visibly jumps
        autoLayoutInterval: 30, // seconds
        autoRefreshEnabled: true, // preserves the previous always-on behavior
        autoRefreshInterval: 30, // seconds
        timeAxis: false // when on, nodes are ordered along the flow direction by date (see layoutWithTimeAxis)
      },
      // {direction, anchors} from the last time-axis layout, which is what
      // the ruler reads to map canvas coordinates back to dates. Saved
      // with the positions it was computed alongside, so the ruler still
      // matches after a reload without re-running layout.
      timeAxisInfo: null,
      // Tasks created on the canvas (see createLinkedTask) that the Tasks
      // plugin may not have indexed yet: {task, createdAt}. Kept across
      // refreshes until a fetch returns them, so a refresh landing before the
      // re-index doesn't make the new node vanish for a cycle.
      unindexedTasks: []
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
    // Tasks that pass the "only related" filter; the tag list in the filter
    // panel is built from these, so it only offers tags that can show up.
    relatedTasks() {
      // A task with no dependency link either way is noise on a vault this
      // size (thousands of tasks); it belongs in a plain to-do list, not a
      // dependency graph. Toggleable rather than hardcoded, see the
      // "only related" checkbox in FilterPanel.vue.
      if (!this.filters.onlyRelated) return this.tasks;
      return this.tasks.filter((task) => {
        const hasOutgoing = task.dependsOn.length > 0;
        const hasIncoming = task.pluginId && this.referencedPluginIds.has(task.pluginId);
        return hasOutgoing || hasIncoming;
      });
    },
    // tag -> hue for every tag in the vault, see utils/tagColor.js.
    tagHues() {
      return assignTagHues(this.tasks.flatMap((t) => t.tags));
    },
    // [{tag, count}] over relatedTasks, most used first.
    availableTags() {
      const counts = new Map();
      for (const task of this.relatedTasks) {
        for (const tag of task.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
      }
      return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    },
    filteredTasks() {
      const checkedTags = new Set(this.filters.tags);
      return this.relatedTasks.filter(task => {
        // Tag filter: in include mode a task needs at least one checked tag,
        // in exclude mode it must have none of them.
        if (checkedTags.size > 0) {
          const hasChecked = task.tags.some((tag) => checkedTags.has(tag));
          if (this.filters.tagMode === 'exclude' ? hasChecked : !hasChecked) return false;
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
      const plugin = getPlugin();
      if (!plugin) return;
      const data = await plugin.loadData();
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
      if (data?.timeAxisInfo) {
        this.timeAxisInfo = data.timeAxisInfo;
      }
    },
    fetchTasksFromObsidian() {
      const app = getApp();
      if (!app) return;

      const api = new TasksPluginAPI(app);
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
          tags: [...new Set(t.tags || [])], // e.g. ['#work'], without the Tasks global filter
          day: taskDay(t), // whole-day number or null, see taskDay above
          position: pos
        };
      });

      const fetchedIds = new Set(this.tasks.map((t) => t.id));
      const now = Date.now();
      this.unindexedTasks = this.unindexedTasks.filter(
        (u) => !fetchedIds.has(u.task.id) && now - u.createdAt < UNINDEXED_GRACE_MS
      );
      for (const u of this.unindexedTasks) {
        u.task.position = this.positions[u.task.id] || u.task.position;
        this.tasks.push(u.task);
      }
    },
    updateTaskPosition(taskId, x, y) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.position = { x, y };
        this.positions[taskId] = { x, y };
        this.saveState();
      }
    },
    toggleTagFilter(tag) {
      const tags = new Set(this.filters.tags);
      if (tags.has(tag)) tags.delete(tag);
      else tags.add(tag);
      this.filters.tags = [...tags];
    },
    updateAppearance(partial) {
      this.appearance = { ...this.appearance, ...partial };
      this.saveState();
    },
    // Positions are saved separately by updateTaskPosition; this only
    // records how they map back to dates.
    setTimeAxisInfo(info) {
      this.timeAxisInfo = info;
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
        onlyRelated: this.filters.onlyRelated,
        tags: [...this.filters.tags],
        tagMode: this.filters.tagMode
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
      this.filters.tags = [...(preset.tags ?? [])];
      this.filters.tagMode = preset.tagMode ?? 'include';
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
    // Creates a blank task right after `originTaskId`'s list item in the same
    // file, linked to it: with `upstream` false the new task depends on the
    // origin (origin -> new), with `upstream` true the origin depends on the
    // new task (new -> origin). The new line and the origin's tag edit are
    // written in one vault.process call, so the origin's line number can't
    // go stale between them. The new task is added to the in-memory list
    // straight away at `position`, before the Tasks plugin re-indexes the
    // file. Returns {path, lineNumber, name} of the new line, or null.
    async createLinkedTask(originTaskId, { upstream, position }) {
      const origin = this.tasks.find((t) => t.id === originTaskId);
      const app = getApp();
      if (!origin || !app) return null;
      const file = app.vault.getAbstractFileByPath(origin.path);
      if (!file) return null;

      const api = new TasksPluginAPI(app);
      const globalFilter = await api.getGlobalFilter();
      const existingIds = new Set(this.tasks.map((t) => t.pluginId).filter(Boolean));
      const newPluginId = generateTaskId(existingIds);
      existingIds.add(newPluginId);
      const originPluginId = origin.pluginId || generateTaskId(existingIds);

      const namesInFile = new Set(this.tasks.filter((t) => t.path === origin.path).map((t) => t.name));
      let name = NEW_TASK_NAME;
      for (let n = 2; namesInFile.has(name); n++) name = `${NEW_TASK_NAME} ${n}`;
      const description = globalFilter ? `${globalFilter} ${name}` : name;

      let created = null;
      await app.vault.process(file, (content) => {
        const lines = content.split('\n');
        const originIndex = locateTaskLine(lines, origin);
        if (originIndex === -1) return content;

        let newLine = newSiblingTaskLine(lines[originIndex], description);
        if (upstream) {
          newLine = addIdTag(newLine, newPluginId);
          lines[originIndex] = addDependsOnTag(lines[originIndex], newPluginId);
        } else {
          lines[originIndex] = addIdTag(lines[originIndex], originPluginId);
          newLine = addDependsOnTag(addIdTag(newLine, newPluginId), originPluginId);
        }
        const insertAt = listItemBlockEnd(lines, originIndex) + 1;
        lines.splice(insertAt, 0, newLine);
        created = { originIndex, originLine: lines[originIndex], lineNumber: insertAt, newLine };
        return lines.join('\n');
      });
      if (!created) return null;

      origin.originalTask = { ...origin.originalTask, originalMarkdown: created.originLine };
      if (upstream) {
        origin.dependsOn = [...origin.dependsOn, newPluginId];
      } else {
        origin.pluginId = originPluginId;
      }

      const id = stableTaskId(origin.path, name);
      this.positions[id] = { ...position };
      const task = {
        id,
        pluginId: newPluginId,
        dependsOn: upstream ? [] : [originPluginId],
        originalTask: {
          taskLocation: { path: origin.path, lineNumber: created.lineNumber },
          originalMarkdown: created.newLine
        },
        name,
        path: origin.path,
        completed: false,
        status: { symbol: ' ' },
        priority: '3',
        tags: [],
        day: null,
        position: { ...position }
      };
      this.tasks.push(task);
      this.unindexedTasks.push({ task, createdAt: Date.now() });
      this.saveState();

      return { path: origin.path, lineNumber: created.lineNumber, name };
    },
    async saveState() {
      const plugin = getPlugin();
      if (!plugin) return;
      await plugin.saveData({
        positions: this.positions,
        appearance: this.appearance,
        viewSettings: this.viewSettings,
        filterPresets: this.filterPresets,
        timeAxisInfo: this.timeAxisInfo
      });
    }
  }
});
