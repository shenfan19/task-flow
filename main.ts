import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';

const VIEW_TYPE_TASK_FLOWCHART = "task-flowchart-view";

export default class TaskFlowchartPlugin extends Plugin {
	async onload() {
		// Ensure app is available globally for Vue components (Tasks plugin API needs it)
		(window as any).app = this.app;
		// Vue store uses this to persist node positions via loadData/saveData,
		// which writes plain JSON to .obsidian/plugins/task-flowchart/data.json
		(window as any).taskFlowchartPlugin = this;

		this.registerView(
			VIEW_TYPE_TASK_FLOWCHART,
			(leaf) => new TaskFlowchartView(leaf)
		);

		this.addRibbonIcon('dice', 'Activate Task Flowchart', (evt: MouseEvent) => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-task-flowchart-view',
			name: 'Open Task Flowchart view',
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
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TASK_FLOWCHART);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf('tab');
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_TASK_FLOWCHART,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}

class TaskFlowchartView extends ItemView {
	vueApp: VueApp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_TASK_FLOWCHART;
	}

	getDisplayText() {
		return "Task Flowchart";
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
