import type { App } from 'obsidian';

/**
 * The parts of the Tasks plugin instance used here. Its task objects are
 * passed through as they are and read field by field in the store.
 */
interface TasksPluginInstance {
    getTasks?: () => unknown[];
    loadData: () => Promise<unknown>;
    apiV1?: {
        editTaskLineModal?: (taskLine: string) => Promise<string>;
    };
}

/**
 * `app.plugins` is not part of Obsidian's public typings, so it is described
 * here as far as it is used.
 */
interface AppWithPlugins extends App {
    plugins: {
        plugins: Record<string, TasksPluginInstance | undefined>;
    };
}

const TASKS_PLUGIN_ID = 'obsidian-tasks-plugin';

/**
 * Utility to communicate with the Obsidian Tasks plugin.
 */
export class TasksPluginAPI {
    private app: AppWithPlugins;

    constructor(app: App) {
        this.app = app as AppWithPlugins;
    }

    private get tasksPlugin(): TasksPluginInstance | undefined {
        return this.app.plugins.plugins[TASKS_PLUGIN_ID];
    }

    /**
     * Check if the Tasks plugin is enabled and accessible.
     */
    public isTasksPluginAvailable(): boolean {
        return !!this.tasksPlugin;
    }

    /**
     * The Tasks plugin's global filter (e.g. "#task"), or '' when none is
     * set. A line written without it is not recognized as a task at all, so
     * a newly created task has to include it. Read straight from the
     * plugin's data.json, since the parsed settings aren't exposed.
     */
    public async getGlobalFilter(): Promise<string> {
        const plugin = this.tasksPlugin;
        if (!plugin) return '';
        try {
            const data = (await plugin.loadData()) as { globalFilter?: unknown } | null;
            return typeof data?.globalFilter === 'string' ? data.globalFilter.trim() : '';
        } catch (error) {
            console.error('Tasks Flowchart: Error reading Tasks plugin settings:', error);
            return '';
        }
    }

    /**
     * The format the Tasks plugin is set to write and read, 'emoji' or
     * 'dataview'. Its setting is stored as 'tasksPluginEmoji' or 'dataview';
     * 'emoji' is also what a plugin that has not saved one yet uses.
     */
    public async getTaskFormat(): Promise<'emoji' | 'dataview'> {
        const plugin = this.tasksPlugin;
        if (!plugin) return 'dataview';
        try {
            const data = (await plugin.loadData()) as { taskFormat?: unknown } | null;
            return data?.taskFormat === 'dataview' ? 'dataview' : 'emoji';
        } catch (error) {
            console.error('Tasks Flowchart: Error reading Tasks plugin settings:', error);
            return 'dataview';
        }
    }

    /**
     * Whether the Tasks plugin offers its edit dialog to other plugins,
     * which it does from version 7.21.0.
     */
    public canEditInModal(): boolean {
        return typeof this.tasksPlugin?.apiV1?.editTaskLineModal === 'function';
    }

    /**
     * Opens the Tasks plugin's own edit dialog filled in from `taskLine`, so
     * the task is edited with the same form and settings as in a note.
     * Resolves to the edited Markdown, which is more than one line when
     * completing a recurring task adds its next occurrence, or to '' when
     * the dialog is cancelled. Tasks writes any change to what this task
     * blocks straight into the other tasks' files itself.
     */
    public editTaskLineModal(taskLine: string): Promise<string> {
        const edit = this.tasksPlugin?.apiV1?.editTaskLineModal;
        return edit ? edit(taskLine) : Promise.resolve('');
    }

    /**
     * Fetch all cached tasks from the Obsidian Tasks plugin.
     * Returns an empty array if the plugin is not available.
     */
    public getTasks(): unknown[] {
        const plugin = this.tasksPlugin;
        if (!plugin) {
            console.warn('Tasks Flowchart: Obsidian Tasks plugin is not available.');
            return [];
        }

        try {
            // Tasks plugin exposes getTasks() on its main class instance
            if (typeof plugin.getTasks === 'function') {
                return plugin.getTasks();
            }
            console.error('Tasks Flowchart: Tasks plugin found, but getTasks() method is missing.');
            return [];
        } catch (error) {
            console.error('Tasks Flowchart: Error fetching tasks from Tasks plugin:', error);
            return [];
        }
    }
}
