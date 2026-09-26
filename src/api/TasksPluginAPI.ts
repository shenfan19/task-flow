/**
 * Utility to communicate with the Obsidian Tasks plugin.
 */

export class TasksPluginAPI {
    private app: any;

    constructor(app: any) {
        this.app = app;
    }

    /**
     * Check if the Tasks plugin is enabled and accessible.
     */
    public isTasksPluginAvailable(): boolean {
        return !!this.app.plugins.plugins['obsidian-tasks-plugin'];
    }

    /**
     * The Tasks plugin's global filter (e.g. "#task"), or '' when none is
     * set. A line written without it is not recognized as a task at all, so
     * a newly created task has to include it. Read straight from the
     * plugin's data.json, since the parsed settings aren't exposed.
     */
    public async getGlobalFilter(): Promise<string> {
        if (!this.isTasksPluginAvailable()) return '';
        try {
            const data = await this.app.plugins.plugins['obsidian-tasks-plugin'].loadData();
            return (data?.globalFilter || '').trim();
        } catch (error) {
            console.error('Task Flow: Error reading Tasks plugin settings:', error);
            return '';
        }
    }

    /**
     * Fetch all cached tasks from the Obsidian Tasks plugin.
     * Returns an empty array if the plugin is not available.
     */
    public getTasks(): any[] {
        if (!this.isTasksPluginAvailable()) {
            console.warn('Task Flow: Obsidian Tasks plugin is not available.');
            return [];
        }

        try {
            const tasksPlugin = this.app.plugins.plugins['obsidian-tasks-plugin'];
            // Tasks plugin exposes getTasks() on its main class instance
            if (typeof tasksPlugin.getTasks === 'function') {
                return tasksPlugin.getTasks();
            } else {
                console.error('Task Flow: Tasks plugin found, but getTasks() method is missing.');
                return [];
            }
        } catch (error) {
            console.error('Task Flow: Error fetching tasks from Tasks plugin:', error);
            return [];
        }
    }
}
