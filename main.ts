import { Plugin, WorkspaceLeaf, ItemView, Scope } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import App from './src/App.vue';
import { setPlugin } from './src/pluginContext';
import { hasOpenGraph, runEscape, runViewCommand } from './src/viewCommands';
import { onLanguageChange, t } from './src/i18n';

const VIEW_TYPE_TASK_FLOW = "task-flow-view";

// Lucide icon for the ribbon button and the view tab: several lines joining
// into one, like tasks that a later task depends on.
const VIEW_ICON = "merge";

// How long Create sample note waits for a flowchart it just opened to be
// ready: 20 checks, 100 ms apart.
const SAMPLE_WAIT_ATTEMPTS = 20;
const SAMPLE_WAIT_INTERVAL_MS = 100;

export default class TaskFlowPlugin extends Plugin {
	async onload() {
		// The Vue app reaches this.app and loadData/saveData (node positions and
		// settings, stored as plain JSON in .obsidian/plugins/task-flow/data.json)
		// through this, see src/pluginContext.ts.
		setPlugin(this);

		// Obsidian reads a tab's title once, so it is told to read it again when
		// the language is changed in the View card.
		this.register(onLanguageChange(() => this.refreshTabTitles()));

		this.registerView(
			VIEW_TYPE_TASK_FLOW,
			(leaf) => new TaskFlowView(leaf)
		);

		this.addRibbonIcon(VIEW_ICON, t('Open tasks flowchart'), () => {
			void this.activateView();
		});

		// Obsidian already prefixes the command with the plugin name, so it
		// shows up as "Tasks Flowchart: Open flowchart".
		this.addCommand({
			id: 'open-view',
			name: t('Open flowchart'),
			callback: () => {
				void this.activateView();
			}
		});

		// The buttons at the top of the view, as commands so they can
		// get hotkeys. Offered only while a flowchart is open.
		this.addCommand({
			id: 'layout',
			name: t('Layout, arrange and fit the graph in the view'),
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('layout');
				return true;
			}
		});

		// Tasks reload by themselves when a note changes and every 30 seconds;
		// this reloads them at once.
		this.addCommand({
			id: 'refresh',
			name: t('Refresh tasks'),
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('refresh');
				return true;
			}
		});

		this.addCommand({
			id: 'reset',
			name: t('Reset, clear highlights and focus'),
			checkCallback: (checking) => {
				if (!hasOpenGraph()) return false;
				if (!checking) runViewCommand('reset');
				return true;
			}
		});

		// Writes a sample note of linked tasks, or opens the one written
		// before, and shows it beside the flowchart, which opens if needed.
		this.addCommand({
			id: 'create-sample',
			name: t('Create sample note'),
			callback: async () => {
				await this.activateView();
				for (let i = 0; i < SAMPLE_WAIT_ATTEMPTS && !hasOpenGraph(); i++) {
					await new Promise((resolve) => window.setTimeout(resolve, SAMPLE_WAIT_INTERVAL_MS));
				}
				runViewCommand('sample');
			}
		});

		this.addCommand({
			id: 'overview',
			name: t('Overview, fit the graph in the view'),
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

	// updateHeader is not in Obsidian's typings, so it is called only if the
	// leaf has it.
	refreshTabTitles() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_FLOW)) {
			(leaf as WorkspaceLeaf & { updateHeader?: () => void }).updateHeader?.();
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
		// Returning false marks the key as used, which keeps Obsidian from
		// switching tabs on it.
		this.scope = new Scope(this.app.scope);
		this.scope.register([], 'Escape', () => (runEscape() ? false : undefined));
	}

	getViewType() {
		return VIEW_TYPE_TASK_FLOW;
	}

	getDisplayText() {
		return t('Tasks flowchart');
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
