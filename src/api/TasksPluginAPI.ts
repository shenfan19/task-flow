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
     * Fetch all cached tasks from the Obsidian Tasks plugin.
     * Returns an empty array if the plugin is not available.
     */
    public getTasks(): any[] {
        if (!this.isTasksPluginAvailable()) {
            console.warn('Task Flowchart: Obsidian Tasks plugin is not available.');
            return [];
        }

        try {
            const tasksPlugin = this.app.plugins.plugins['obsidian-tasks-plugin'];
            // Tasks plugin exposes getTasks() on its main class instance
            if (typeof tasksPlugin.getTasks === 'function') {
                return tasksPlugin.getTasks();
            } else {
                console.error('Task Flowchart: Tasks plugin found, but getTasks() method is missing.');
                return [];
            }
        } catch (error) {
            console.error('Task Flowchart: Error fetching tasks from Tasks plugin:', error);
            return [];
        }
    }
}
