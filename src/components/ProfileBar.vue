<template>
  <!-- A bare row under the action bar, with no card frame. A profile holds
       the Filters, View and Style together: choosing one
       loads all three, Save stores the current settings into it, and New…
       makes a new one from the current settings. -->
  <div class="ft-profile-row">
    <label class="ft-profile-label" for="ftProfileSelect" title="Filters, View and Style saved together">Profile</label>
    <select
      id="ftProfileSelect"
      class="dropdown ft-profile-select"
      title="Switch to another saved set of filters, view and style"
      :value="taskStore.selectedProfileId"
      @change="onSelect"
    >
      <option v-for="profile in taskStore.profiles" :key="profile.id" :value="profile.id">
        {{ profile.name }}{{ profile.id === taskStore.selectedProfileId && taskStore.profileModified ? ' *' : '' }}
      </option>
      <option :value="NEW_PROFILE">New…</option>
    </select>
    <button
      :class="{ 'mod-cta': taskStore.profileModified }"
      :disabled="!taskStore.profileModified"
      title="Store the current filters, view and style in this profile"
      @click="taskStore.saveProfile()"
    >Save</button>
    <button
      :disabled="taskStore.selectedProfileId === DEFAULT_PROFILE_ID"
      title="Delete this profile"
      @click="onDelete"
    >Delete</button>
  </div>
</template>

<script setup>
import { useTaskStore, DEFAULT_PROFILE_ID } from '../store';
import { getApp } from '../pluginContext';
import { promptName } from '../utils/promptName';

// layout: the profile switched to places nodes differently (direction,
// link type or time axis), so the graph is laid out again.
const emit = defineEmits(['layout']);

const taskStore = useTaskStore();

// Option value of "New…"; not a profile id, since ids come from Date.now().
const NEW_PROFILE = '__new__';

const onSelect = async (event) => {
  const value = event.target.value;
  if (value !== NEW_PROFILE) {
    if (taskStore.applyProfile(value)) emit('layout');
    return;
  }
  // The select would otherwise keep showing "New…" while the dialog is up
  // and after it is cancelled.
  event.target.value = taskStore.selectedProfileId;
  const app = getApp();
  if (!app) return;
  const name = await promptName(app, {
    title: 'New profile',
    placeholder: 'Profile name',
    validate: (n) => (taskStore.profiles.some((p) => p.name === n) ? 'A profile with this name already exists.' : null)
  });
  if (name) taskStore.createProfile(name);
};

const onDelete = () => {
  if (taskStore.deleteProfile(taskStore.selectedProfileId)) emit('layout');
};
</script>

<style scoped>
.ft-profile-row {
  width: 250px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-profile-label {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted, #666);
  white-space: nowrap;
}

.ft-profile-row .ft-profile-select {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
}

.ft-profile-row button {
  flex: none;
  padding: 0 8px;
}
</style>

<style>
/* The name dialog lives outside this component, see utils/promptName.js. */
.ft-prompt-input {
  width: 100%;
}

.ft-prompt-error {
  margin-top: 6px;
  color: var(--text-error);
}
</style>
