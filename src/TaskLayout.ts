/**
 * Various rendering options for a query.
 * See applyOptions below when adding options here.
 */
export class LayoutOptions {
    hideTaskCount: boolean = false;
    hideBacklinks: boolean = false;
    hidePriority: boolean = false;
    hideCreatedDate: boolean = false;
    hideStartDate: boolean = false;
    hideScheduledDate: boolean = false;
    hideDoneDate: boolean = false;
    hideDueDate: boolean = false;
    hideRecurrenceRule: boolean = false;
    hideEditButton: boolean = false;
    hideUrgency: boolean = true;
    hideTags: boolean = false;
    shortMode: boolean = false;
    explainQuery: boolean = false;
}

export type TaskLayoutComponent =
    | 'description'
    | 'priority'
    | 'recurrenceRule'
    | 'createdDate'
    | 'startDate'
    | 'scheduledDate'
    | 'dueDate'
    | 'doneDate'
    | 'blockLink';

/**
 * This represents the desired layout of tasks when they are rendered in a given configuration.
 * The layout is used when flattening the task to a string and when rendering queries, and can be
 * modified by applying {@link LayoutOptions} objects.
 */
export class TaskLayout {
    public defaultLayout: TaskLayoutComponent[] = [
        'description',
        'priority',
        'recurrenceRule',
        'createdDate',
        'startDate',
        'scheduledDate',
        'dueDate',
        'doneDate',
        'blockLink',
    ];
    public shownTaskLayoutComponents: TaskLayoutComponent[];
    public hiddenTaskLayoutComponents: TaskLayoutComponent[] = [];
    public options: LayoutOptions;
    public taskListClasses: string[] = [];

    constructor(options?: LayoutOptions) {
        if (options) {
            this.options = options;
        } else {
            this.options = new LayoutOptions();
        }

        this.shownTaskLayoutComponents = this.defaultLayout;
        this.shownTaskLayoutComponents = this.applyOptions(this.options);
    }

    /**
     * Return a new list of components with the given options applied.
     */
    applyOptions(layoutOptions: LayoutOptions): TaskLayoutComponent[] {
        // Remove components from the layout according to the task options. These represent the existing task options,
        // so some components (e.g. the description) are not here because there are no layout options to remove them.
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hidePriority,
            'priority',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideRecurrenceRule,
            'recurrenceRule',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideCreatedDate,
            'createdDate',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideStartDate,
            'startDate',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideScheduledDate,
            'scheduledDate',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideDueDate,
            'dueDate',
            this.shownTaskLayoutComponents,
        );
        this.shownTaskLayoutComponents = this.removeIf2(
            layoutOptions.hideDoneDate,
            'doneDate',
            this.shownTaskLayoutComponents,
        );
        // Tags are hidden, rather than removed. See tasks-layout-hide-tags in styles.css.

        this.markHiddenQueryComponents(layoutOptions);
        return this.shownTaskLayoutComponents;
    }

    // Remove a component from the taskComponents array if the given layoutOption criteria is met,
    // and add to the layout's specific classes list the class that denotes that this component
    // isn't in the layout
    private removeIf2(
        shouldRemove: boolean,
        componentToRemove: TaskLayoutComponent,
        taskComponents: TaskLayoutComponent[],
    ) {
        if (shouldRemove) {
            this.taskListClasses.push(`tasks-layout-hide-${componentToRemove}`);
            this.hiddenTaskLayoutComponents.push(componentToRemove);
            taskComponents = taskComponents.filter((element) => element != componentToRemove);
        }
        return taskComponents;
    }

    private markHiddenQueryComponents(layoutOptions: LayoutOptions) {
        const markHiddenQueryComponent = (hidden: boolean, hiddenComponentName: string) => {
            if (hidden) {
                this.taskListClasses.push(`tasks-layout-hide-${hiddenComponentName}`);
            }
        };

        markHiddenQueryComponent(layoutOptions.hideTags, 'tags');

        // The following components are handled in QueryRenderer.ts and thus are not part of the same flow that
        // hides TaskLayoutComponent items. However, we still want to have 'tasks-layout-hide' items for them
        // (see https://github.com/obsidian-tasks-group/obsidian-tasks/issues/1866).
        // This can benefit from some refactoring, i.e. render these components in a similar flow rather than
        // separately.
        markHiddenQueryComponent(layoutOptions.hideUrgency, 'urgency');
        markHiddenQueryComponent(layoutOptions.hideBacklinks, 'backlinks');
        markHiddenQueryComponent(layoutOptions.hideEditButton, 'edit-button');
        if (layoutOptions.shortMode) this.taskListClasses.push('tasks-layout-short-mode');
    }
}
