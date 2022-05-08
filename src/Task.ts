import type { Moment } from 'moment';
import { Component, MarkdownRenderer } from 'obsidian';
import { replaceTaskWithTasks } from './File';
import { LayoutOptions } from './LayoutOptions';
import { Recurrence } from './Recurrence';
import { getSettings } from './Settings';
import { Urgency } from './Urgency';

export enum Status {
    Todo = 'Todo',
    Done = 'Done',
    InProgress = 'InProgress',
    Cancelled = 'Cancelled',
}

// Sort low below none.
export enum Priority {
    High = '1',
    Medium = '2',
    None = '3',
    Low = '4',
}

/**
 * Main Task object, used to store all the task information of a checklist item on a page.
 *
 * @export
 * @class Task
 */
export class Task {
    // IDEA: Look at adding other states as a option.
    // Examples:
    // - [/] Task that is in progress.
    // - [-] Task that is canceled.

    /**
     * The status of the task, only supports Todo and Done.
     *
     * @type {Status}
     * @memberof Task
     */
    public readonly status: Status;

    /**
     * This contains the description of the task including the user tags. The global filter is removed.
     *
     * @type {string}
     * @memberof Task
     */
    public readonly description: string;

    /**
     * Path to the file that contains this task.
     *
     * @type {string}
     * @memberof Task
     */
    public readonly path: string;

    /**
     * A string the length of the indentation of the task.
     *
     * @type {string}
     * @memberof Task
     */
    public readonly indentation: string;

    /**
     * Line number where the section starts that contains this task.
     *
     * @type {number}
     * @memberof Task
     */
    public readonly sectionStart: number;

    /**
     * The index of the nth task in its section.
     *
     * @type {number}
     * @memberof Task
     */
    public readonly sectionIndex: number;

    /**
     * The original character from within `[]` in the document.
     * Required to be added to the LI the same way obsidian does as a `data-task` attribute.
     *
     * @type {string}
     * @memberof Task
     */
    public readonly originalStatusCharacter: string;
    public readonly precedingHeader: string | null;

    /**
     * A collection of tags that are associated with the task. Will not contain the global filter.
     *
     * @type {string[]}
     * @memberof Task
     */
    public readonly tags: string[];

    public readonly priority: Priority;

    public readonly startDate: Moment | null;
    public readonly scheduledDate: Moment | null;
    public readonly dueDate: Moment | null;
    public readonly doneDate: Moment | null;

    public readonly recurrence: Recurrence | null;

    /**
     * The blockLink is a "^" annotation after the dates/recurrence rules.
     *
     * @type {string}
     * @memberof Task
     */
    public readonly blockLink: string;

    /**
     * Default date format for any dates associated with the task.
     *
     * @static
     * @memberof Task
     */
    public static readonly dateFormat = 'YYYY-MM-DD';

    /**
     * Main regex for parsing a line. It matches the following:
     * - Indentation
     * - Status character
     * - Rest of task after checkbox markdown
     *
     * @static
     * @memberof Task
     */
    public static readonly taskRegex = /^([\s\t]*)[-*] +\[(.)\] *(.*)/u;

    /**
     * Match on block link at end.
     *
     * @static
     * @memberof Task
     */
    public static readonly blockLinkRegex = / \^[a-zA-Z0-9-]+$/u;

    //* INFO: The following regex's end with `$` because they will be matched and removed from the end until none are left.
    public static readonly priorityRegex = /([⏫🔼🔽])$/u;
    public static readonly startDateRegex = /🛫 ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly scheduledDateRegex = /[⏳⌛] ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly dueDateRegex = /[📅📆🗓] ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly doneDateRegex = /✅ ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly recurrenceRegex = /🔁 ?([a-zA-Z0-9, !]+)$/iu;

    //* INFO: Regex to match all hash tags, basically hash followed by anything but the characters in the negation.
    public static readonly hashTags = /#[^ !@#$%^&*(),.?":{}|<>]*/g;

    private _urgency: number | null = null;

    constructor({
        status,
        description,
        path,
        indentation,
        sectionStart,
        sectionIndex,
        originalStatusCharacter,
        precedingHeader,
        priority,
        startDate,
        scheduledDate,
        dueDate,
        doneDate,
        recurrence,
        blockLink,
        tags,
    }: {
        status: Status;
        description: string;
        path: string;
        indentation: string;
        sectionStart: number;
        sectionIndex: number;
        originalStatusCharacter: string;
        precedingHeader: string | null;
        priority: Priority;
        startDate: moment.Moment | null;
        scheduledDate: moment.Moment | null;
        dueDate: moment.Moment | null;
        doneDate: moment.Moment | null;
        recurrence: Recurrence | null;
        blockLink: string;
        tags: string[] | [];
    }) {
        this.status = status;
        this.description = description;
        this.path = path;
        this.indentation = indentation;
        this.sectionStart = sectionStart;
        this.sectionIndex = sectionIndex;
        this.originalStatusCharacter = originalStatusCharacter;
        this.precedingHeader = precedingHeader;

        this.tags = tags;

        this.priority = priority;

        this.startDate = startDate;
        this.scheduledDate = scheduledDate;
        this.dueDate = dueDate;
        this.doneDate = doneDate;

        this.recurrence = recurrence;
        this.blockLink = blockLink;
    }

    /**
     * Takes the given line from a obsidian note and returns a Task object.
     *
     * @static
     * @param {string} line - The full line in the note to parse.
     * @param {string} path - Path to the note in obsidian.
     * @param {number} sectionStart - Line number where the section starts that contains this task.
     * @param {number} sectionIndex - The index of the nth task in its section.
     * @param {(string | null)} precedingHeader - The header before this task.
     * @return {*}  {(Task | null)}
     * @memberof Task
     */
    public static fromLine({
        line,
        path,
        sectionStart,
        sectionIndex,
        precedingHeader,
    }: {
        line: string;
        path: string;
        sectionStart: number;
        sectionIndex: number;
        precedingHeader: string | null;
    }): Task | null {
        // Check the line to see if it is a markdown task.
        const regexMatch = line.match(Task.taskRegex);
        if (regexMatch === null) {
            return null;
        }

        // match[3] includes the whole body of the task after the brackets.
        const body = regexMatch[3].trim();

        // return if task does not have the global filter. Do this before processing
        // rest of match to improve performance.
        const { globalFilter } = getSettings();
        if (!body.includes(globalFilter)) {
            return null;
        }

        let description = body;
        const indentation = regexMatch[1];

        // Get the status of the task, only todo and done supported.
        const statusString = regexMatch[2].toLowerCase();
        let status: Status;
        switch (statusString) {
            case ' ':
                status = Status.Todo;
                break;
            case '/':
                status = Status.InProgress;
                break;
            case '-':
                status = Status.Cancelled;
                break;
            default:
                status = Status.Done;
        }

        // Match for block link and remove if found. Always expected to be
        // at the end of the line.
        const blockLinkMatch = description.match(this.blockLinkRegex);
        const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';

        if (blockLink !== '') {
            description = description.replace(this.blockLinkRegex, '').trim();
        }

        // Keep matching and removing special strings from the end of the
        // description in any order. The loop should only run once if the
        // strings are in the expected order after the description.
        let matched: boolean;
        let priority: Priority = Priority.None;
        let startDate: Moment | null = null;
        let scheduledDate: Moment | null = null;
        let dueDate: Moment | null = null;
        let doneDate: Moment | null = null;
        let recurrence: Recurrence | null = null;
        let tags: any = [];
        // Add a "max runs" failsafe to never end in an endless loop:
        const maxRuns = 7;
        let runs = 0;
        do {
            matched = false;
            const priorityMatch = description.match(Task.priorityRegex);
            if (priorityMatch !== null) {
                switch (priorityMatch[1]) {
                    case '🔽':
                        priority = Priority.Low;
                        break;
                    case '🔼':
                        priority = Priority.Medium;
                        break;
                    case '⏫':
                        priority = Priority.High;
                        break;
                }

                description = description
                    .replace(Task.priorityRegex, '')
                    .trim();
                matched = true;
            }

            const doneDateMatch = description.match(Task.doneDateRegex);
            if (doneDateMatch !== null) {
                doneDate = window.moment(doneDateMatch[1], Task.dateFormat);
                description = description
                    .replace(Task.doneDateRegex, '')
                    .trim();
                matched = true;
            }

            const dueDateMatch = description.match(Task.dueDateRegex);
            if (dueDateMatch !== null) {
                dueDate = window.moment(dueDateMatch[1], Task.dateFormat);
                description = description.replace(Task.dueDateRegex, '').trim();
                matched = true;
            }

            const scheduledDateMatch = description.match(
                Task.scheduledDateRegex,
            );
            if (scheduledDateMatch !== null) {
                scheduledDate = window.moment(
                    scheduledDateMatch[1],
                    Task.dateFormat,
                );
                description = description
                    .replace(Task.scheduledDateRegex, '')
                    .trim();
                matched = true;
            }

            const startDateMatch = description.match(Task.startDateRegex);
            if (startDateMatch !== null) {
                startDate = window.moment(startDateMatch[1], Task.dateFormat);
                description = description
                    .replace(Task.startDateRegex, '')
                    .trim();
                matched = true;
            }

            const recurrenceMatch = description.match(Task.recurrenceRegex);
            if (recurrenceMatch !== null) {
                recurrence = Recurrence.fromText({
                    recurrenceRuleText: recurrenceMatch[1].trim(),
                    startDate,
                    scheduledDate,
                    dueDate,
                });

                description = description
                    .replace(Task.recurrenceRegex, '')
                    .trim();
                matched = true;
            }

            runs++;
        } while (matched && runs <= maxRuns);

        // Tags are found in the string and pulled out but not removed,
        // so when returning the entire task it will match what the user
        // entered.
        // The global filter will be removed from the collection.
        const hashTagMatch = description.match(this.hashTags);
        if (hashTagMatch !== null) {
            tags = hashTagMatch.filter((tag) => tag !== globalFilter);
        }

        // Remove the global filter, it will be added back in the to string in the correct location.
        if (globalFilter !== '') {
            description = description.replace(globalFilter, '').trim();
        }

        const task = new Task({
            status,
            description,
            path,
            indentation,
            sectionStart,
            sectionIndex,
            originalStatusCharacter: statusString,
            precedingHeader,
            priority,
            startDate,
            scheduledDate,
            dueDate,
            doneDate,
            recurrence,
            blockLink,
            tags,
        });

        return task;
    }

    public async toLi({
        parentUlElement,
        listIndex,
        layoutOptions,
        isFilenameUnique,
    }: {
        parentUlElement: HTMLElement;
        /** The nth item in this list (including non-tasks). */
        listIndex: number;
        layoutOptions?: LayoutOptions;
        isFilenameUnique?: boolean;
    }): Promise<HTMLLIElement> {
        const li: HTMLLIElement = parentUlElement.createEl('li');
        li.addClasses(['task-list-item', 'plugin-tasks-list-item']);

        let taskAsString = this.toString(layoutOptions);
        const { globalFilter, removeGlobalFilter } = getSettings();
        if (removeGlobalFilter) {
            taskAsString = taskAsString.replace(globalFilter, '').trim();
        }

        const textSpan = li.createSpan();
        textSpan.addClass('tasks-list-text');

        await MarkdownRenderer.renderMarkdown(
            taskAsString,
            textSpan,
            this.path,
            null as unknown as Component,
        );

        // If the task is a block quote, the block quote wraps the p-tag that contains the content.
        // In that case, we need to unwrap the p-tag *inside* the surrounding block quote.
        // Otherwise, we unwrap the p-tag as a direct descendant of the textSpan.
        const blockQuote = textSpan.querySelector('blockquote');
        const directParentOfPTag = blockQuote ?? textSpan;

        // Unwrap the p-tag that was created by the MarkdownRenderer:
        const pElement = directParentOfPTag.querySelector('p');
        if (pElement !== null) {
            while (pElement.firstChild) {
                directParentOfPTag.insertBefore(pElement.firstChild, pElement);
            }
            pElement.remove();
        }

        // Remove an empty trailing p-tag that the MarkdownRenderer appends when there is a block link:
        textSpan.findAll('p').forEach((pElement) => {
            if (!pElement.hasChildNodes()) {
                pElement.remove();
            }
        });

        // Remove the footnote that the MarkdownRenderer appends when there is a footnote in the task:
        textSpan.findAll('.footnotes').forEach((footnoteElement) => {
            footnoteElement.remove();
        });

        const checkbox = li.createEl('input');
        checkbox.addClass('task-list-item-checkbox');
        checkbox.type = 'checkbox';
        if (this.status !== Status.Todo) {
            checkbox.checked = true;
            li.addClass('is-checked');
        }
        checkbox.onClickEvent((event: MouseEvent) => {
            event.preventDefault();
            // It is required to stop propagation so that obsidian won't write the file with the
            // checkbox (un)checked. Obsidian would write after us and overwrite our change.
            event.stopPropagation();

            // Should be re-rendered as enabled after update in file.
            checkbox.disabled = true;
            const toggledTasks = this.toggle();
            replaceTaskWithTasks({
                originalTask: this,
                newTasks: toggledTasks,
            });
        });

        li.prepend(checkbox);

        // Set these to be compatible with stock obsidian lists:
        li.setAttr('data-task', this.originalStatusCharacter.trim()); // Trim to ensure empty attribute for space. Same way as obsidian.
        li.setAttr('data-line', listIndex);
        checkbox.setAttr('data-line', listIndex);

        if (layoutOptions?.shortMode) {
            this.addTooltip({ element: textSpan, isFilenameUnique });
        }

        return li;
    }

    /**
     * Converts the task back into a string, does not have the markdown list or task prefix.
     *
     * @param {LayoutOptions} [layoutOptions]
     * @return {*}  {string}
     * @memberof Task
     */
    public toString(layoutOptions?: LayoutOptions): string {
        layoutOptions = layoutOptions ?? new LayoutOptions();

        const { globalFilter, removeGlobalFilter, appendGlobalFilter } =
            getSettings();

        let taskString = '';

        if (!removeGlobalFilter && appendGlobalFilter && globalFilter !== '') {
            taskString = `${this.description} ${globalFilter}`;
        } else if (
            !removeGlobalFilter &&
            !appendGlobalFilter &&
            globalFilter !== ''
        ) {
            taskString = `${globalFilter} ${this.description}`;
        } else {
            taskString = this.description;
        }

        if (!layoutOptions.hidePriority) {
            let priority: string = '';

            if (this.priority === Priority.High) {
                priority = ' ⏫';
            } else if (this.priority === Priority.Medium) {
                priority = ' 🔼';
            } else if (this.priority === Priority.Low) {
                priority = ' 🔽';
            }

            taskString += priority;
        }

        if (!layoutOptions.hideRecurrenceRule && this.recurrence) {
            const recurrenceRule: string = layoutOptions.shortMode
                ? ' 🔁'
                : ` 🔁 ${this.recurrence.toText()}`;
            taskString += recurrenceRule;
        }

        if (!layoutOptions.hideStartDate && this.startDate) {
            const startDate: string = layoutOptions.shortMode
                ? ' 🛫'
                : ` 🛫 ${this.startDate.format(Task.dateFormat)}`;
            taskString += startDate;
        }

        if (!layoutOptions.hideScheduledDate && this.scheduledDate) {
            const scheduledDate: string = layoutOptions.shortMode
                ? ' ⏳'
                : ` ⏳ ${this.scheduledDate.format(Task.dateFormat)}`;
            taskString += scheduledDate;
        }

        if (!layoutOptions.hideDueDate && this.dueDate) {
            const dueDate: string = layoutOptions.shortMode
                ? ' 📅'
                : ` 📅 ${this.dueDate.format(Task.dateFormat)}`;
            taskString += dueDate;
        }

        if (!layoutOptions.hideDoneDate && this.doneDate) {
            const doneDate: string = layoutOptions.shortMode
                ? ' ✅'
                : ` ✅ ${this.doneDate.format(Task.dateFormat)}`;
            taskString += doneDate;
        }

        const blockLink: string = this.blockLink ?? '';
        taskString += blockLink;

        return taskString;
    }

    /**
     * Returns the Task as a list item with a checkbox.
     *
     * @return {*}  {string}
     * @memberof Task
     */
    public toFileLineString(): string {
        return `${this.indentation}- [${
            this.originalStatusCharacter
        }] ${this.toString()}`;
    }

    /**
     * Toggles this task and returns the resulting tasks.
     *
     * Toggling can result in more than one returned task in the case of
     * recurrence. If it is a recurring task, the toggled task will be returned
     * together with the next occurrence in the order `[next, toggled]`. If the
     * task is not recurring, it will return `[toggled]`.
     * @return {*}  {Task[]}
     * @memberof Task
     */
    public toggle(): Task[] {
        let newStatus: Status;
        let statusCharacter: string;

        switch (this.status) {
            case Status.Todo:
                newStatus = Status.InProgress;
                statusCharacter = '/';
                break;
            case Status.InProgress:
                newStatus = Status.Cancelled;
                statusCharacter = '-';
                break;
            case Status.Cancelled:
                newStatus = Status.Done;
                statusCharacter = 'x';
                break;
            case Status.Done:
                newStatus = Status.Todo;
                statusCharacter = ' ';
                break;
        }

        let newDoneDate = null;

        let nextOccurrence: {
            startDate: Moment | null;
            scheduledDate: Moment | null;
            dueDate: Moment | null;
        } | null = null;

        if (newStatus === Status.Done) {
            // Set done date only if setting value is true
            const { setDoneDate } = getSettings();
            if (setDoneDate) {
                newDoneDate = window.moment();
            }

            // If this task is no longer todo, we need to check if it is recurring:
            if (this.recurrence !== null) {
                nextOccurrence = this.recurrence.next();
            }
        }

        const toggledTask = new Task({
            ...this,
            status: newStatus,
            doneDate: newDoneDate,
            originalStatusCharacter: statusCharacter,
        });

        const newTasks: Task[] = [];

        if (nextOccurrence !== null) {
            const nextTask = new Task({
                ...this,
                ...nextOccurrence,
                // New occurrences cannot have the same block link.
                // And random block links don't help.
                blockLink: '',
            });
            newTasks.push(nextTask);
        }

        // Write next occurrence before previous occurrence.
        newTasks.push(toggledTask);

        return newTasks;
    }

    public get urgency(): number {
        if (this._urgency === null) {
            this._urgency = Urgency.calculate(this);
        }

        return this._urgency;
    }

    public get filename(): string | null {
        const fileNameMatch = this.path.match(/([^/]+)\.md$/);
        if (fileNameMatch !== null) {
            return fileNameMatch[1];
        } else {
            return null;
        }
    }

    /**
     * Returns the text that should be displayed to the user when linking to the origin of the task
     *
     * @param isFilenameUnique {boolean|null} Whether the name of the file that contains the task is unique in the vault.
     *                                        If it is undefined, the outcome will be the same as with a unique file name: the file name only.
     *                                        If set to `true`, the full path will be returned.
     */
    public getLinkText({
        isFilenameUnique,
    }: {
        isFilenameUnique: boolean | undefined;
    }): string | null {
        let linkText: string | null;
        if (isFilenameUnique) {
            linkText = this.filename;
        } else {
            // A slash at the beginning indicates this is a path, not a filename.
            linkText = '/' + this.path;
        }

        if (linkText === null) {
            return null;
        }

        // Otherwise, this wouldn't provide additional information and only take up space.
        if (
            this.precedingHeader !== null &&
            this.precedingHeader !== linkText
        ) {
            linkText = linkText + ' > ' + this.precedingHeader;
        }

        return linkText;
    }

    private addTooltip({
        element,
        isFilenameUnique,
    }: {
        element: HTMLElement;
        isFilenameUnique: boolean | undefined;
    }): void {
        element.addEventListener('mouseenter', () => {
            const tooltip = element.createDiv();
            tooltip.addClasses(['tooltip', 'mod-right']);

            if (this.recurrence) {
                const recurrenceDiv = tooltip.createDiv();
                recurrenceDiv.setText(`🔁 ${this.recurrence.toText()}`);
            }

            if (this.startDate) {
                const startDateDiv = tooltip.createDiv();
                startDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '🛫',
                        date: this.startDate,
                    }),
                );
            }

            if (this.scheduledDate) {
                const scheduledDateDiv = tooltip.createDiv();
                scheduledDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '⏳',
                        date: this.scheduledDate,
                    }),
                );
            }

            if (this.dueDate) {
                const dueDateDiv = tooltip.createDiv();
                dueDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '📅',
                        date: this.dueDate,
                    }),
                );
            }

            if (this.doneDate) {
                const doneDateDiv = tooltip.createDiv();
                doneDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '✅',
                        date: this.doneDate,
                    }),
                );
            }

            const linkText = this.getLinkText({ isFilenameUnique });
            if (linkText) {
                const backlinkDiv = tooltip.createDiv();
                backlinkDiv.setText(`🔗 ${linkText}`);
            }

            element.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    }

    private static toTooltipDate({
        signifier,
        date,
    }: {
        signifier: string;
        date: Moment;
    }): string {
        return `${signifier} ${date.format(Task.dateFormat)} (${date.from(
            window.moment().startOf('day'),
        )})`;
    }
}
