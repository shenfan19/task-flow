import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';
import { setPlugin } from './src/pluginContext';

const VIEW_TYPE_TASK_FLOW = "task-flow-view";

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

		this.addRibbonIcon('workflow', 'Open tasks flowchart', () => {
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
	vueApp: VueApp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TASK_FLOW;
	}

	getDisplayText() {
		return "Tasks flowchart";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		this.vueApp = createApp(App);
		this.vueApp.use(createPinia());
		this.vueApp.mount(container);
	}

	async onClose() {
		if (this.vueApp) {
			this.vueApp.unmount();
		}
	}
}
