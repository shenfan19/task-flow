import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';

const VIEW_TYPE_FLOWY_TASK = "flowy-task-view";

export default class FlowyTaskPlugin extends Plugin {
	async onload() {
		// Ensure app is available globally for Vue components (Tasks plugin API needs it)
		(window as any).app = this.app;

		this.registerView(
			VIEW_TYPE_FLOWY_TASK,
			(leaf) => new FlowyTaskView(leaf)
		);

		this.addRibbonIcon('dice', 'Activate FlowyTask', (evt: MouseEvent) => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-flowytask-view',
			name: 'Open FlowyTask Graph View',
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
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_FLOWY_TASK);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf('tab');
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_FLOWY_TASK,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}

class FlowyTaskView extends ItemView {
	vueApp: VueApp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_FLOWY_TASK;
	}

	getDisplayText() {
		return "FlowyTask";
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
