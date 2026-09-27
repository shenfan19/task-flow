// The running plugin instance, set once by main.ts on load. Everything in
// the Vue app reaches Obsidian through this (getApp() is the plugin's own
// this.app) instead of through the global window.app, which Obsidian's
// plugin guidelines ask plugins not to rely on.
let plugin = null;

export function setPlugin(instance) {
  plugin = instance;
}

export function getPlugin() {
  return plugin;
}

export function getApp() {
  return plugin?.app ?? null;
}
