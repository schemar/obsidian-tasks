import { PluginSettingTab, Setting } from 'obsidian';

import { getSettings, updateSettings } from './Settings';
import type TasksPlugin from './main';

export class SettingsTab extends PluginSettingTab {
    private readonly plugin: TasksPlugin;

    constructor({ plugin }: { plugin: TasksPlugin }) {
        super(plugin.app, plugin);

        this.plugin = plugin;
    }

    public display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Tasks Settings' });
        containerEl.createEl('p', {
            cls: 'tasks-setting-important',
            text: 'Changing any settings requires a restart of obsidian.',
        });

        new Setting(containerEl)
            .setName('Global task filter')
            .setDesc(
                'The global filter will be applied to all checklist items.',
            )
            .addText((text) => {
                const settings = getSettings();

                text.setPlaceholder('#task')
                    .setValue(settings.globalFilter)
                    .onChange(async (value) => {
                        updateSettings({ globalFilter: value });

                        await this.plugin.saveSettings();
                    });
            });
        containerEl.createEl('div', {
            cls: 'setting-item-description',
            text:
                'The global filter will be applied to all checklist items to filter out "non-task" checklist items.\n' +
                'A checklist item must include the specified string in its description in order to be considered a task.\n' +
                'For example, if you set the global filter to `#task`, the Tasks plugin will only handle checklist items tagged with `#task`.\n' +
                'Other checklist items will remain normal checklist items and not appear in queries or get a done date set.\n' +
                'Leave empty if you want all checklist items from your vault to be tasks managed by this plugin.',
        });

        new Setting(containerEl)
            .setName('Remove global filter from description')
            .setDesc(
                'Enabling this removes the string that you set as global filter from the task description when displaying a task.',
            )
            .addToggle((toggle) => {
                const settings = getSettings();

                toggle
                    .setValue(settings.removeGlobalFilter)
                    .onChange(async (value) => {
                        updateSettings({ removeGlobalFilter: value });

                        await this.plugin.saveSettings();
                    });
            });
        new Setting(containerEl)
            .setName('Task Date Format')
            .setDesc('Set the date format for task due dates')
            .addText((text) => {
                const settings = getSettings();

                text.setPlaceholder('YYYY-MM-DD')
                    .setValue(settings.dateFormat)
                    .onChange(async (value) => {
                        updateSettings({ dateFormat: value });

                        await this.plugin.saveSettings();
                    });
            });
        new Setting(containerEl)
            .setName('Date is a link')
            .setDesc(
                'Enabling this makes the due date a link to the Daily Notes Page',
            )
            .addToggle((toggle) => {
                const settings = getSettings();

                toggle.setValue(settings.dateLink).onChange(async (value) => {
                    updateSettings({ dateLink: value });

                    await this.plugin.saveSettings();
                });
            });
    }
}
