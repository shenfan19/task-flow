<template>
  <RailCard :title="t('Filters')">
    <!-- Keywords, matched anywhere in the task line: Include shows only the
         tasks containing one, Exclude hides them. -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1" for="keywordInput">{{ t('Keywords') }}</label>
      <div class="d-flex gap-3 mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="include"
            v-model="taskStore.filters.textMode"
            id="textModeInclude"
          >
          <label class="form-check-label" for="textModeInclude">{{ t('Include') }}</label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="exclude"
            v-model="taskStore.filters.textMode"
            id="textModeExclude"
          >
          <label class="form-check-label" for="textModeExclude">{{ t('Exclude') }}</label>
        </div>
      </div>
      <input
        id="keywordInput"
        type="text"
        class="form-control form-control-sm ft-exclude-input"
        :placeholder="t('e.g. archived on, #someday')"
        :title="t('Comma-separated keywords, matched in the task text and tags in any case. Include shows only the tasks containing any of them, Exclude hides those tasks.')"
        v-model.trim="taskStore.filters.excludeText"
      >
    </div>

    <hr class="ft-sep">

    <!-- Tag Filter: click a chip to check/uncheck it -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1">{{ t('Tags') }}</label>
      <div class="d-flex gap-3 mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="include"
            v-model="taskStore.filters.tagMode"
            id="tagModeInclude"
          >
          <label class="form-check-label" for="tagModeInclude">{{ t('Include') }}</label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="exclude"
            v-model="taskStore.filters.tagMode"
            id="tagModeExclude"
          >
          <label class="form-check-label" for="tagModeExclude">{{ t('Exclude') }}</label>
        </div>
      </div>
      <div class="ft-tag-list">
        <!-- A span rather than a button: Obsidian's global button styles
             outrank a single class and would paint over the tag colors. -->
        <span
          v-for="{ tag, count } in taskStore.availableTags"
          :key="tag"
          role="button"
          tabindex="0"
          class="ft-tag ft-tag-toggle"
          :class="{ 'ft-tag-toggle--on': checkedTags.has(tag) }"
          :style="{ '--ft-tag-hue': taskStore.tagHues.get(tag) ?? 0 }"
          :title="tp(count, '{n} task', '{n} tasks')"
          @click="taskStore.toggleTagFilter(tag)"
          @keydown.enter.prevent="taskStore.toggleTagFilter(tag)"
          @contextmenu="onTagContextMenu($event, tag)"
        >{{ tag.replace(/^#/, '') }}</span>
        <span v-if="taskStore.availableTags.length === 0" class="text-muted small">{{ t('No tags found') }}</span>
      </div>
      <button
        v-if="taskStore.filters.tags.length"
        type="button"
        class="ft-tag-clear"
        @click="taskStore.filters.tags = []"
      >{{ t('Clear') }}</button>
    </div>

    <hr class="ft-sep">

    <!-- Priority Filter: click a chip to check/uncheck it; None is the last
         chip, on the same row as the others to save space -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1">{{ t('Priority') }}</label>
      <div class="d-flex gap-3 mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="include"
            v-model="taskStore.filters.priorityMode"
            id="priorityModeInclude"
          >
          <label class="form-check-label" for="priorityModeInclude">{{ t('Include') }}</label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="exclude"
            v-model="taskStore.filters.priorityMode"
            id="priorityModeExclude"
          >
          <label class="form-check-label" for="priorityModeExclude">{{ t('Exclude') }}</label>
        </div>
      </div>
      <div class="ft-tag-list">
        <template v-for="level in PRIORITY_LEVELS_NONE_LAST" :key="level.value">
          <span
            role="button"
            tabindex="0"
            class="ft-tag ft-tag-toggle"
            :class="{ 'ft-tag-toggle--on': checkedPriorities.has(level.value) }"
            :style="{ '--ft-tag-hue': PRIORITY_HUES[level.value] }"
            :title="tp(priorityCounts.get(level.value) ?? 0, '{n} task', '{n} tasks')"
            @click="taskStore.togglePriorityFilter(level.value)"
            @keydown.enter.prevent="taskStore.togglePriorityFilter(level.value)"
          >{{ t(level.label) }}</span>
        </template>
      </div>
      <button
        v-if="taskStore.filters.priorities.length"
        type="button"
        class="ft-tag-clear"
        @click="taskStore.filters.priorities = []"
      >{{ t('Clear') }}</button>
    </div>

    <hr class="ft-sep">

    <!-- Directory Tree Filter -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1">{{ t('Directory Path') }}</label>
      <div class="d-flex gap-3 mb-1">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="include"
            v-model="taskStore.filters.directoryMode"
            id="dirModeInclude"
          >
          <label class="form-check-label" for="dirModeInclude">{{ t('Include') }}</label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            value="exclude"
            v-model="taskStore.filters.directoryMode"
            id="dirModeExclude"
          >
          <label class="form-check-label" for="dirModeExclude">{{ t('Exclude') }}</label>
        </div>
      </div>
      <div class="directory-tree border rounded bg-light p-2 mt-1">
        <template v-for="node in treeData" :key="node.path">
          <TreeNode :node="node" />
        </template>
        <div v-if="treeData.length === 0" class="text-muted small text-center p-2">
          {{ t('No directories found') }}
        </div>
      </div>
    </div>

    <hr class="ft-sep">

    <!-- The two checkboxes that hide the most tasks at once sit last, away
         from the filters that are changed often, so one is not hit by
         mistake. -->
    <!-- Status Filter -->
    <div class="mb-3">
      <label class="form-label text-muted small fw-bold mb-1">{{ t('Status') }}</label>
      <div class="d-flex gap-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" v-model="taskStore.filters.status.todo" id="filterTodo">
          <label class="form-check-label" for="filterTodo">{{ t('To-do') }}</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" v-model="taskStore.filters.status.done" id="filterDone">
          <label class="form-check-label" for="filterDone">{{ t('Done') }}</label>
        </div>
      </div>
    </div>

    <hr class="ft-sep">

    <!-- Only tasks with a dependsOn relation -->
    <div class="form-check">
      <input
        class="form-check-input"
        type="checkbox"
        id="onlyRelatedToggle"
        :checked="taskStore.filters.onlyRelated"
        @change="onOnlyRelatedChange"
      >
      <label class="form-check-label" for="onlyRelatedToggle">{{ t('Only show tasks with a relation') }}</label>
    </div>
  </RailCard>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Menu, Notice } from 'obsidian';
import { useTaskStore } from '../store';
import { confirmDialog } from '../utils/confirmDialog';
import RailCard from './RailCard.vue';
import { getApp } from '../pluginContext';
import TreeNode from './TreeNode.vue';
import { NONE_PRIORITY, PRIORITY_HUES, PRIORITY_LEVELS_NONE_LAST, normalizeTag } from '../utils/taskLineEdits';
import { promptName } from '../utils/promptName';
import { t, tp } from '../i18n';

const taskStore = useTaskStore();
const treeData = ref([]);
const checkedTags = computed(() => new Set(taskStore.filters.tags));
const checkedPriorities = computed(() => new Set(taskStore.filters.priorities));

// Tasks of the view at each priority level, for the chips' tooltips.
const priorityCounts = computed(() => {
  const counts = new Map();
  for (const task of taskStore.relatedTasks) {
    const value = task.priority ?? NONE_PRIORITY;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
});

// Showing tasks with no link draws every task of the vault, which is slow
// when there are many, so the first untick of the day asks, but only above
// this many tasks.
const UNRELATED_WARN_COUNT = 100;
const WARNED_KEY = 'task-flow-unrelated-warned';

const warnedToday = () => {
  try {
    return window.localStorage.getItem(WARNED_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
};

const markWarnedToday = () => {
  try {
    window.localStorage.setItem(WARNED_KEY, new Date().toDateString());
  } catch {
    // Without storage the question simply comes back next time.
  }
};

const onOnlyRelatedChange = async (event) => {
  const box = event.target;
  const app = getApp();
  if (box.checked || !app || taskStore.tasks.length <= UNRELATED_WARN_COUNT || warnedToday()) {
    taskStore.filters.onlyRelated = box.checked;
    return;
  }
  box.checked = true;
  const sure = await confirmDialog(app, {
    title: t('Show tasks with no relation'),
    message: t("{count} tasks may render slowly. Show anyway? If you do, you won't be asked again today.", { count: taskStore.tasks.length }),
    confirmText: t('Show all')
  });
  if (!sure) return;
  markWarnedToday();
  taskStore.filters.onlyRelated = false;
};

// Right-clicking a tag offers to take it off every task of the view, which
// rewrites the notes, so it is confirmed first with the number of tasks and
// notes it touches.
const removeTagEverywhere = async (tag) => {
  const app = getApp();
  const holders = taskStore.tasks.filter((t) => t.tags.includes(tag));
  if (!app || !holders.length) return;
  const noteCount = new Set(holders.map((t) => t.path)).size;
  const sure = await confirmDialog(app, {
    title: t('Remove {tag}', { tag }),
    message: t('Remove {tag} from {tasks} in {notes}? This edits the text of those notes.', {
      tag,
      tasks: tp(holders.length, '{n} task', '{n} tasks'),
      notes: tp(noteCount, '{n} note', '{n} notes')
    }),
    confirmText: t('Remove')
  });
  if (!sure) return;
  const changed = await taskStore.removeTagFromAllTasks(tag);
  new Notice(t('Tasks Flowchart: removed {tag} from {tasks}.', { tag, tasks: tp(changed, '{n} task', '{n} tasks') }));
};

// Renames the tag on every task of the view. A name that is already another
// tag merges the two.
const renameTagEverywhere = async (tag) => {
  const app = getApp();
  const holders = taskStore.tasks.filter((t) => t.tags.includes(tag));
  if (!app || !holders.length) return;
  const noteCount = new Set(holders.map((t) => t.path)).size;
  const text = await promptName(app, {
    title: t('Rename {tag}', { tag }),
    placeholder: '#tag',
    value: tag,
    submitText: t('Rename'),
    emptyText: t('Enter a tag.'),
    validate: (value) => {
      const next = normalizeTag(value);
      if (!next) return t('Use letters, digits, - _ and /, not only digits, no spaces.');
      return next === tag ? t('Enter a different tag.') : null;
    }
  });
  const next = text && normalizeTag(text);
  if (!next || next === tag) return;
  if (taskStore.allTags.includes(next)) {
    const sure = await confirmDialog(app, {
      title: t('Merge into {next}', { next }),
      message: t('{next} is already a tag. Tasks tagged {tag} will get {next} instead, in {tasks} in {notes}. This edits the text of those notes.', {
        next,
        tag,
        tasks: tp(holders.length, '{n} task', '{n} tasks'),
        notes: tp(noteCount, '{n} note', '{n} notes')
      }),
      confirmText: t('Merge')
    });
    if (!sure) return;
  }
  const changed = await taskStore.removeTagFromAllTasks(tag, next);
  new Notice(t('Tasks Flowchart: renamed {tag} to {next} on {tasks}.', { tag, next, tasks: tp(changed, '{n} task', '{n} tasks') }));
};

const onTagContextMenu = (event, tag) => {
  event.preventDefault();
  const menu = new Menu();
  menu.addItem((item) => item
    .setTitle(t('Rename {tag}…', { tag }))
    .setIcon('pencil')
    .onClick(() => renameTagEverywhere(tag)));
  menu.addItem((item) => item
    .setTitle(t('Remove {tag} from all tasks', { tag }))
    .setIcon('trash')
    .onClick(() => removeTagEverywhere(tag)));
  menu.showAtMouseEvent(event);
};

// Helper to build tree from flat paths
const buildTree = (paths) => {
  const root = [];
  const map = {};

  paths.forEach(dir => {
    const parts = dir.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      let existingNode = currentLevel.find(n => n.name === part);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          children: []
        };
        currentLevel.push(existingNode);
      }
      currentLevel = existingNode.children;
    });
  });

  return root;
};

onMounted(() => {
  const app = getApp();
  if (app) {
    const files = app.vault.getAllLoadedFiles();
    const dirs = files
      .filter(f => f.children) // Is directory
      .filter(f => f.path !== '/') // Skip root usually
      .map(f => ({ name: f.name, path: f.path }));
    
    treeData.value = buildTree(dirs);
  } else {
    // Fallback Mock
    treeData.value = buildTree([
      { path: 'projects/frontend' },
      { path: 'projects/backend/api' },
      { path: 'projects/backend/db' },
      { path: 'archives/2025' }
    ]);
  }
});
</script>

<style scoped>
.ft-exclude-input {
  width: 100%;
}

.ft-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

/* Unchecked chips are faded so the checked ones stand out; the chip colors
   themselves come from the shared .ft-tag rule in TaskFlowNode.vue. */
.ft-tag-toggle {
  cursor: pointer;
  opacity: 0.45;
  font-size: 0.8rem;
}

.ft-tag-toggle--on {
  opacity: 1;
  font-weight: 600;
  border-width: 2px;
}

.ft-tag-clear {
  margin-top: 4px;
  font-size: 0.75rem;
  padding: 0 6px;
}

.directory-tree {
  font-size: 0.85rem;
  max-height: 250px;
  overflow-y: auto;
}
</style>
