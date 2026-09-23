import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';

const VIEW_TYPE_TASK_FLOW = "task-flow-view";

export default class TaskFlowPlugin extends Plugin {
	async onload() {
		// Ensure app is available globally for Vue components (Tasks plugin API needs it)
		(window as any).app = this.app;
		// Vue store uses this to persist node positions via loadData/saveData,
		// which writes plain JSON to .obsidian/plugins/task-flow/data.json
		(window as any).taskFlowPlugin = this;

		this.registerView(
			VIEW_TYPE_TASK_FLOW,
			(leaf) => new TaskFlowView(leaf)
		);

		this.addRibbonIcon('dice', 'Activate Task Flow', (evt: MouseEvent) => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-task-flow-view',
			name: 'Open Task Flow view',
			callback: () => {
				this.activateView();
			}
		});
	}

	async onunload() {

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
			workspace.revealLeaf(leaf);
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
		return "Task Flow";
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
