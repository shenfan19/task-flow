import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';
import { setPlugin } from './src/pluginContext';
import { hasOpenGraph, runViewCommand } from './src/viewCommands';

const VIEW_TYPE_TASK_FLOW = "task-flow-view";

// Lucide icon for the ribbon button and the view tab: several lines joining
// into one, like tasks that a later task depends on.
const VIEW_ICON = "merge";

export default class TaskFlowPlugin extends Plugin {
	async onload() {
		// The Vue app reaches this.app and loadData/saveData (node positions and
		// settings, stored as plain JSON in .obsidian/plugins/task-flow/data.json)
		// through this, see src/pluginContext.ts.
		setPlugin(this);

		this.registerView(
			VIEW_TYPE_TASK_FLOW,
			(leaf) => new TaskFlowView(leaf)
		);

		this.addRibbonIcon(VIEW_ICON, 'Open tasks flowchart', () => {
			void this.activateView();
		});

		// Obsidian already prefixes the command with the plugin name, so it
		// shows up as "Tasks Flowchart: Open flowchart".
		this.addCommand({
			id: 'open-view',
			name: 'Open flowchart',
			callback: () => {
				void this.activateView();
			}
		});

		// The two buttons at the top of the view, as commands so they can
		// get hotkeys. Offered only while a flowchart is open.
		this.addCommand({
			id: 'layout',
			name: 'Layout',
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('layout');
				return true;
			}
		});

		this.addCommand({
			id: 'reset',
			name: 'Reset, clear highlights and focus',
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('reset');
				return true;
			}
		});

		this.addCommand({
			id: 'overview',
			name: 'Overview, fit the graph in the view',
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('overview');
				return true;
			}
		});
	}

	// Stops the graph in every open view before this copy of the plugin goes
	// away, on disable or on update. A view left running kept its refresh
	// and layout timers, and went on writing data.json alongside the new
	// copy. The tabs themselves stay open, as Obsidian's guidelines ask.
	onunload() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_FLOW)) {
			if (leaf.view instanceof TaskFlowView) leaf.view.unmountApp();
		}
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TASK_FLOW);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf('tab');
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_TASK_FLOW,
					active: true,
				});
			}
		}

		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}
}

class TaskFlowView extends ItemView {
	vueApp: VueApp | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TASK_FLOW;
	}

	getDisplayText() {
		return "Tasks flowchart";
	}

	getIcon() {
		return VIEW_ICON;
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		this.vueApp = createApp(App);
		this.vueApp.use(createPinia());
		this.vueApp.mount(container);
	}

	async onClose() {
		this.unmountApp();
	}

	unmountApp() {
		if (this.vueApp) {
			this.vueApp.unmount();
			this.vueApp = null;
		}
	}
}
