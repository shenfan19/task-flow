import { defineStore } from 'pinia';
import { Notice } from 'obsidian';
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
  listItemBlockEnd,
  readInlineFields,
  stripInlineFields,
  renameIdInLine
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
// path + name and two identical names would collide. Kept to one word, with
// the number joined on, so a double-click in the editor selects all of it.
const NEW_TASK_NAME = 'untitled';

// True for a name still left as given by createLinkedTask.
export const isPlaceholderTaskName = (name) => /^untitled\d*$/.test(name ?? '');

const UNINDEXED_GRACE_MS = 60000;

// The one date a task is placed by on the time axis: done date for a
// finished task (when it actually happened), otherwise due, then scheduled,
// then start (when it is meant to happen). Returned as a whole-day number
// counted in UTC so time zones can never shift a task onto a neighboring day.
// Each date is the Tasks plugin's field paired with its inline field name,
// read when the plugin could not read it (see readInlineFields). Both are
// tried before moving to the next date, so a due date the plugin missed
// still wins over a scheduled date it found.
const DATE_FIELDS = [
  ['doneDate', 'completion'],
  ['dueDate', 'due'],
  ['scheduledDate', 'scheduled'],
  ['startDate', 'start']
];

function dayFromIso(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text ?? '');
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000 : null;
}

function taskDay(t, fields) {
  for (const [field, inline] of DATE_FIELDS) {
    const m = t[field];
    if (m && typeof m.isValid === 'function' && m.isValid()) return dayFromIso(m.format('YYYY-MM-DD'));
    const day = dayFromIso(fields[inline]);
    if (day !== null) return day;
  }
  return null;
}

// The filter settings a preset stores, copied so later edits to the live
// filters do not reach into the preset.
const filterSnapshot = (f) => ({
  directories: [...f.directories],
  directoryMode: f.directoryMode,
  status: { ...f.status },
  onlyRelated: f.onlyRelated,
  tags: [...f.tags],
  tagMode: f.tagMode,
  excludeText: f.excludeText
});

// data.json holds every node position, so it runs to hundreds of KB in a
// large vault. Saves requested within this window are merged into one
// write, and writes run one after another: many overlapping writes of a file
// that size left it empty or cut short, and the next load then failed.
const SAVE_DELAY_MS = 500;
let saveTimer = null;
let writing = Promise.resolve();

// Keeps a copy of a data.json that could not be parsed, so the next save
// does not destroy whatever can still be recovered from it by hand.
async function setAsideUnreadableData(plugin) {
  const adapter = plugin.app.vault.adapter;
  const dir = plugin.manifest.dir;
  if (!dir) return null;
  try {
    const raw = await adapter.read(`${dir}/data.json`);
    const copy = `${dir}/data-unreadable-${Date.now()}.json`;
    await adapter.write(copy, raw);
    return copy;
  } catch {
    return null;
  }
}

// The preset that always exists and cannot be deleted.
export const DEFAULT_PRESET_ID = 'default';

// Ids listed in a dependsOn field value, e.g. "abc123,def456".
const splitIds = (value) => (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

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
        tagMode: 'include', // 'include': only tasks with any checked tag; 'exclude': hide tasks with any checked tag
        excludeText: '' // comma-separated keywords; a task whose line contains any of them is hidden
      },
      filterPresets: [], // [{id, name, ...filterSnapshot}], always starting with the Default preset, see loadState
      selectedPresetId: DEFAULT_PRESET_ID, // the preset shown in the Presets card; Save writes the filters into it
      appearance: {
        nodeBg: '#ffffff',
        nodeBorder: '#0d6efd',
        nodeText: '#212529',
        fontSize: 12,
        // Font size and background of the high, medium and low priority tiers; the
        // no-priority row uses fontSize and nodeBg above (see TaskFlowNode.vue).
        highFontSize: 15,
        highBg: '#fff1e0',
        mediumFontSize: 13,
        mediumBg: '#fdf8e1',
        lowFontSize: 11,
        lowBg: '#eef0f3',
        highlightColor: '#f59e0b', // glow around a highlighted node or link
        richText: true, // task text rendered as Markdown; off skips the MarkdownRenderer call entirely
        showTags: true // colored tag chips under each node's text
      },
      viewSettings: {
        layoutDirection: 'TB', // dagre rankdir: TB/BT/LR/RL
        edgeType: 'default', // vue-flow edge type: default(bezier)/straight/smoothstep
        clickAction: 'select', // what a single click on a node does: 'select', 'focus' or 'open' (see runNodeAction)
        doubleClickAction: 'edit', // the same choice for a double click, plus 'edit'
        newTaskAction: 'edit', // a task made by dragging onto empty canvas: 'edit' it in the Tasks dialog or 'open' its note
        settingsVersion: 4, // the plugin's minor version when these settings were last carried over, see loadState
        timeAxis: false // when on, nodes are ordered along the flow direction by date (see layoutWithTimeAxis)
      },
      // {direction, anchors} from the last time-axis layout, which is what
      // the ruler reads to map canvas coordinates back to dates. Saved
      // with the positions it was computed alongside, so the ruler still
      // matches after a reload without re-running layout.
      timeAxisInfo: null,
      // Highlight and focus, kept between sessions: the highlighted node and
      // edge ids, and the task whose chain is focused (its chain is worked
      // out again from the links when the view opens).
      marks: { highlightNodes: [], highlightEdges: [], focusId: null },
      // Where the canvas was panned and zoomed to, {x, y, zoom}, with the
      // canvas size at that moment ({width, height}), so reopening the view
      // shows the same part of the graph. Null until the canvas first moves.
      viewport: null,
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
    selectedPreset() {
      return this.filterPresets.find((p) => p.id === this.selectedPresetId) ?? null;
    },
    // True when the filters differ from the selected preset, i.e. there is
    // something for Save to store.
    presetModified() {
      const preset = this.selectedPreset;
      if (!preset) return false;
      const { id, name, ...saved } = preset;
      return JSON.stringify(filterSnapshot({ ...this.filters, ...saved })) !== JSON.stringify(filterSnapshot(this.filters));
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
    // Lowercased keywords from filters.excludeText.
    excludeKeywords() {
      return this.filters.excludeText
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
    },
    filteredTasks() {
      const checkedTags = new Set(this.filters.tags);
      const excluded = this.excludeKeywords;
      return this.relatedTasks.filter(task => {
        // Keyword exclusion, matched anywhere in the task's markdown line,
        // e.g. "archived on" to hide tasks an archiving plugin has marked.
        if (excluded.length > 0) {
          const line = (task.originalTask?.originalMarkdown || task.name).toLowerCase();
          if (excluded.some((k) => line.includes(k))) return false;
        }

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
      let data = null;
      try {
        data = await plugin.loadData();
      } catch (error) {
        console.error('Tasks Flowchart: could not read data.json', error);
        const copy = await setAsideUnreadableData(plugin);
        new Notice(`Tasks Flowchart: saved positions and settings could not be read${copy ? ` and were copied to ${copy}` : ''}. Starting with defaults.`);
      }
      // data.json used to be a flat {id: {x,y}} positions map; fall back to
      // treating the whole object as positions if it isn't in the new shape.
      this.positions = data?.positions ?? data ?? {};
      if (data?.appearance) {
        this.appearance = { ...this.appearance, ...data.appearance };
      }
      if (data?.viewSettings) {
        // clickToOpen, autoLayoutEnabled, autoLayoutInterval,
        // autoRefreshEnabled and autoRefreshInterval belong to settings that
        // no longer exist and are dropped here.
        // eslint-disable-next-line no-unused-vars
        const { clickToOpen, autoLayoutEnabled, autoLayoutInterval, autoRefreshEnabled, autoRefreshInterval, ...saved } = data.viewSettings;
        this.viewSettings = { ...this.viewSettings, ...saved };
        // The earlier "Click to open" checkbox, carried over to Click.
        if (clickToOpen && !saved.clickAction) this.viewSettings.clickAction = 'open';
        // Highlight was a click action up to 0.2.0, the default for Click.
        // It is now a mark set from the right-click menu, so a click saved
        // as Highlight becomes Select.
        for (const key of ['clickAction', 'doubleClickAction']) {
          if (this.viewSettings[key] === 'highlight') this.viewSettings[key] = 'select';
        }
        // From 0.4.0 a double click edits the task, as a double click opened
        // it before; a double click left at Open task moves along.
        if ((saved.settingsVersion ?? 0) < 4 && this.viewSettings.doubleClickAction === 'open') {
          this.viewSettings.doubleClickAction = 'edit';
        }
      }
      if (data?.filterPresets) {
        this.filterPresets = data.filterPresets;
      }
      if (data?.selectedPresetId) {
        this.selectedPresetId = data.selectedPresetId;
      }
      if (data?.filters) {
        this.filters = {
          ...this.filters,
          ...data.filters,
          status: { ...this.filters.status, ...data.filters.status }
        };
      }
      if (data?.timeAxisInfo) {
        this.timeAxisInfo = data.timeAxisInfo;
      }
      if (data?.marks) {
        this.marks = { ...this.marks, ...data.marks };
      }
      if (data?.viewport) {
        this.viewport = data.viewport;
      }
      // Default is made from the filters in use when it first appears, so
      // upgrading does not change what anyone sees.
      if (!this.filterPresets.some((p) => p.id === DEFAULT_PRESET_ID)) {
        this.filterPresets.unshift({ id: DEFAULT_PRESET_ID, name: 'Default', ...filterSnapshot(this.filters) });
      }
      if (!this.selectedPreset) this.selectedPresetId = DEFAULT_PRESET_ID;
    },
    fetchTasksFromObsidian() {
      const app = getApp();
      if (!app) return;

      const api = new TasksPluginAPI(app);
      const allTasks = api.getTasks() || [];

      // Editing a task's text changes its node id (path + name), so a node
      // with no saved position takes over the position of whatever node was
      // on the same line before; renaming a task then leaves it in place
      // instead of jumping to a random spot.
      const lineKey = (path, line) => `${path}:${line}`;
      const positionByLine = new Map(
        this.tasks.map((task) => [lineKey(task.path, task.originalTask?.taskLocation?.lineNumber), task.position])
      );

      this.tasks = allTasks.map((t) => {
        // Fields are read from the whole line as well as taken from the Tasks
        // plugin, which misses any that have plain text after them.
        const fields = readInlineFields(t.originalMarkdown || '');
        const name = stripInlineFields(t.descriptionWithoutTags || t.description || '') || 'Unnamed Task';
        const path = t.taskLocation?.path || t.path || '';
        const id = stableTaskId(path, name);
        const carried = positionByLine.get(lineKey(path, t.taskLocation?.lineNumber));
        const pos = this.positions[id] || (carried && { ...carried }) || { x: Math.random() * 500, y: Math.random() * 500 };
        if (!this.positions[id] && carried) this.positions[id] = pos;
        return {
          id, // stable across re-parses; independent of the Tasks plugin's own id field
          pluginId: t.id || fields.id || '', // the task's id field, used to match dependsOn references
          dependsOn: [...new Set([...(t.dependsOn || []), ...splitIds(fields.dependsOn)])],
          originalTask: t, // Keep a reference to the actual Obsidian Task object
          name,
          path,
          completed: t.status?.symbol !== ' ',
          status: t.status,
          priority: t.priority, // Tasks plugin's Priority enum string ('0' Highest .. '5' Lowest, '3' None)
          tags: [...new Set(t.tags || [])], // e.g. ['#work'], without the Tasks global filter
          day: taskDay(t, fields), // whole-day number or null, see taskDay above
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
    // View settings change one click at a time, so they are written at once
    // rather than after SAVE_DELAY_MS: a choice made just before Obsidian
    // closes is not lost.
    updateViewSettings(partial) {
      this.viewSettings = { ...this.viewSettings, ...partial };
      void this.flushState();
    },
    // A new preset holding the current filters, which becomes the selected one.
    createFilterPreset(name) {
      const id = Date.now().toString(36);
      this.filterPresets.push({ id, name, ...filterSnapshot(this.filters) });
      this.selectedPresetId = id;
      this.saveState();
    },
    // Stores the current filters in the selected preset.
    saveFilterPreset() {
      const preset = this.selectedPreset;
      if (!preset) return;
      Object.assign(preset, filterSnapshot(this.filters));
      this.saveState();
    },
    // Selects a preset and loads its filters.
    applyFilterPreset(id) {
      const preset = this.filterPresets.find((p) => p.id === id);
      if (!preset) return;
      this.selectedPresetId = id;
      const defaults = { onlyRelated: this.filters.onlyRelated, tags: [], tagMode: 'include', excludeText: '' };
      Object.assign(this.filters, filterSnapshot({ ...defaults, ...preset }));
      this.saveState();
    },
    // Deletes a preset other than Default, then goes back to Default.
    deleteFilterPreset(id) {
      if (id === DEFAULT_PRESET_ID) return;
      this.filterPresets = this.filterPresets.filter((p) => p.id !== id);
      this.applyFilterPreset(DEFAULT_PRESET_ID);
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
    // Opens the Tasks plugin's edit dialog on a task and writes the result
    // back over the task's line. The line is read again when the dialog
    // closes, and nothing is written if it changed meanwhile, so an edit
    // made in the note while the dialog was open is never overwritten. The
    // graph picks the change up on the reload that follows the write.
    async editTaskInModal(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      const app = getApp();
      if (!task || !app) return;
      const api = new TasksPluginAPI(app);
      if (!api.canEditInModal()) {
        new Notice('Tasks Flowchart: editing a task needs the Tasks plugin 7.21.0 or later.');
        return;
      }
      const file = app.vault.getAbstractFileByPath(task.path);
      if (!file) return;
      const lines = (await app.vault.read(file)).split('\n');
      const index = locateTaskLine(lines, task);
      if (index === -1) {
        new Notice('Tasks Flowchart: the task line could not be found in its note.');
        return;
      }
      const before = lines[index];
      const edited = await api.editTaskLineModal(before);
      if (!edited || edited === before) return;

      let written = false;
      await app.vault.process(file, (content) => {
        const current = content.split('\n');
        const at = current[index] === before ? index : current.indexOf(before);
        if (at === -1) return content;
        current.splice(at, 1, ...edited.split('\n'));
        written = true;
        return current.join('\n');
      });
      if (!written) {
        new Notice('Tasks Flowchart: the task changed in its note while the dialog was open, so the edit was not saved.');
        return;
      }
      // A task just created by dragging is kept on the graph by hand until
      // the Tasks plugin indexes it. Renamed here, it would come back under
      // its new name while the kept copy stayed under the old one, so it is
      // left to the next reload, which carries its position over by line.
      this.unindexedTasks = this.unindexedTasks.filter((u) => u.task !== task);
    },
    // Gives a task a new id, or its first one, and changes every
    // dependsOn that names the old id to match, like renaming a note
    // updates the links to it. Only task lines the Tasks plugin knows are
    // searched.
    async changeTaskId(taskId, newId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task || task.pluginId === newId) return;
      const oldId = task.pluginId;
      await editTaskLine(task, (line) => (oldId ? renameIdInLine(line, oldId, newId) : addIdTag(line, newId)));
      task.pluginId = newId;
      if (!oldId) return;

      const dependents = this.tasks.filter((t) => t !== task && t.dependsOn.includes(oldId));
      for (const dependent of dependents) {
        await editTaskLine(dependent, (line) => renameIdInLine(line, oldId, newId));
        dependent.dependsOn = dependent.dependsOn.map((id) => (id === oldId ? newId : id));
      }
      if (dependents.length) {
        new Notice(`Tasks Flowchart: id changed to ${newId} in this task and ${dependents.length} task${dependents.length === 1 ? '' : 's'} depending on it.`);
      }
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
      for (let n = 2; namesInFile.has(name); n++) name = `${NEW_TASK_NAME}${n}`;
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

      return { id, path: origin.path, lineNumber: created.lineNumber, name };
    },
    // Asks for a save; see SAVE_DELAY_MS.
    saveState() {
      if (saveTimer) activeWindow.clearTimeout(saveTimer);
      saveTimer = activeWindow.setTimeout(() => {
        saveTimer = null;
        void this.flushState();
      }, SAVE_DELAY_MS);
    },
    // Writes a pending save now, e.g. when the view closes. Resolves once
    // every write asked for so far has finished.
    flushState() {
      if (saveTimer) {
        activeWindow.clearTimeout(saveTimer);
        saveTimer = null;
      }
      writing = writing
        .then(() => this.writeState())
        .catch((error) => console.error('Tasks Flowchart: could not save data.json', error));
      return writing;
    },
    async writeState() {
      const plugin = getPlugin();
      if (!plugin) return;
      await plugin.saveData({
        positions: this.positions,
        appearance: this.appearance,
        viewSettings: this.viewSettings,
        filterPresets: this.filterPresets,
        selectedPresetId: this.selectedPresetId,
        filters: this.filters,
        timeAxisInfo: this.timeAxisInfo,
        marks: this.marks,
        viewport: this.viewport
      });
    },
    setMarks(marks) {
      this.marks = marks;
      this.saveState();
    },
    setSavedViewport(viewport) {
      this.viewport = viewport;
      this.saveState();
    }
  }
});
