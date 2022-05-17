import { GroupHeadings, IntermediateTaskGroups } from './GroupDetails';
import type { Grouping, GroupingProperty } from './Query';
import type { Task } from './Task';

/**
 * A naming function, that takes a Task object and returns the corresponding group property name
 */
type Grouper = (task: Task) => string;

/**
 * Implementation of the 'group by' instruction.
 */
export class Group {
    /**
     * Group a list of tasks, according to one or more task properties
     * @param grouping 0 or more Grouping values, one per 'group by' line
     * @param tasks The tasks that match the task block's Query
     */
    public static by(grouping: Grouping[], tasks: Task[]): TaskGroups {
        return new TaskGroups(grouping, tasks);
    }

    /**
     * Return the Grouper functions matching the 'group by' lines
     * @param grouping 0 or more Grouping values, one per 'group by' line
     */
    public static getGroupersForGroups(grouping: Grouping[]) {
        const groupers: Grouper[] = [];
        for (const { property } of grouping) {
            const comparator = Group.groupers[property];
            groupers.push(comparator);
        }
        return groupers;
    }

    /**
     * Return the group names for a single task
     * @param groupers The Grouper functions indicating the requested types of group
     * @param task
     */
    public static getGroupNamesForTask(groupers: Grouper[], task: Task) {
        const keys = [];
        for (const grouper of groupers) {
            const this_key = grouper(task);
            keys.push(this_key);
        }
        return keys;
    }

    /**
     * Return a single property name for a single task.
     * A convenience method for unit tests.
     * @param property
     * @param task
     */
    public static getGroupNameForTask(
        property: GroupingProperty,
        task: Task,
    ): string {
        const grouper = Group.groupers[property];
        return grouper(task);
    }

    private static groupers: Record<GroupingProperty, Grouper> = {
        backlink: Group.groupByBacklink,
        filename: Group.groupByFileName,
        folder: Group.groupByFolder,
        heading: Group.groupByHeading,
        path: Group.groupByPath,
        status: Group.groupByStatus,
    };

    private static groupByPath(task: Task): string {
        // Does this need to be made stricter?
        // Is there a better way of getting the file name?
        return task.path.replace('.md', '');
    }

    private static groupByFolder(task: Task): string {
        const path = task.path;
        const fileNameWithExtension = task.filename + '.md';
        const folder = path.substring(
            0,
            path.lastIndexOf(fileNameWithExtension),
        );
        if (folder === '') {
            return '/';
        }
        return folder;
    }

    private static groupByFileName(task: Task): string {
        const filename = task.filename;
        if (filename == null) {
            return 'Unknown Location';
        }
        return filename;
    }

    private static groupByBacklink(task: Task): string {
        const linkText = task.getLinkText({ isFilenameUnique: true });
        if (linkText == null) {
            return 'Unknown Location';
        }
        return linkText;
    }

    private static groupByStatus(task: Task): string {
        return task.status;
    }

    private static groupByHeading(task: Task): string {
        const defaultHeading = '(No heading)';
        if (task.precedingHeader == null) {
            return defaultHeading;
        }
        if (task.precedingHeader.length == 0) {
            return defaultHeading;
        }
        return task.precedingHeader;
    }
}

/**
 * GroupHeading contains the data needed to render one heading for a group of tasks
 */
export class GroupHeading {
    /**
     * How nested the heading is.
     * 0 is the first group, meaning this heading was generated by
     * the first 'group by' instruction.
     */
    public readonly nestingLevel: number;

    /**
     * The text to be displayed for the group.
     */
    public readonly name: string;

    /**
     * Construct a GroupHeading object
     * @param {number} nestingLevel - See this.nestingLevel for details
     * @param {string} name - The text to be displayed for the group
     */
    constructor(nestingLevel: number, name: string) {
        this.nestingLevel = nestingLevel;
        this.name = name;
    }
}

/**
 * TaskGroup stores a single group of tasks, that all share the same group names.
 * TaskGroup objects are stored in a TaskGroups object.
 *
 * For example, if the user supplied these 'group by' lines:
 *   group by folder
 *   group by filename
 *   group by heading
 * Then the names of one TaskGroup might be this:
 *   Some/Folder/In/The/Vault
 *   A Particular File Name
 *   My lovely heading
 * And the TaskGroup would store all the tasks from that location
 * that match the task block's filters, in the task block's sort order
 */
export class TaskGroup {
    /**
     * The names of the group properties for this set of tasks,
     * in the order of the 'group by' lines the user specified
     */
    public readonly groups: string[];

    /**
     * The headings to be displayed in front of this set of tasks,
     * when rendering the results.
     *
     * It only contains the minimal set of headings required to separate
     * this group of tasks from the previous group of tasks.
     */
    public readonly groupHeadings: GroupHeading[];

    /**
     * All the tasks that match the user's filters and that have the
     * group names exactly matching groups().
     */
    public readonly tasks: Task[];

    /**
     * Constructor for TaskGroup
     * @param {string[]} groups - See this.groups for details
     * @param {GroupHeading[]} groupHeadings - See this.groupHeadings for details
     * @param tasks {Task[]} - See this.tasks for details
     */
    constructor(
        groups: string[],
        groupHeadings: GroupHeading[],
        tasks: Task[],
    ) {
        this.groups = groups;
        this.groupHeadings = groupHeadings;
        this.tasks = tasks;
    }

    /**
     * A markdown-format representation of all the tasks in this group.
     *
     * Useful for testing.
     */
    public tasksAsStringOfLines(): string {
        let output = '';
        for (const task of this.tasks) {
            output += task.toFileLineString() + '\n';
        }
        return output;
    }

    /**
     * A human-readable representation of this task group, including names
     * and headings that should be displayed.
     *
     * Note that this is used in snapshot testing, so if the format is
     * changed, the snapshots will need to be updated.
     */
    public toString(): string {
        let output = '\n';
        output += `Group names: [${this.groups}]\n`;

        for (const heading of this.groupHeadings) {
            // These headings mimic the behaviour of QueryRenderer,
            // which uses 'h4', 'h5' and 'h6' for nested groups.
            const headingPrefix = '#'.repeat(4 + heading.nestingLevel);
            output += `${headingPrefix} ${heading.name}\n`;
        }

        output += this.tasksAsStringOfLines();
        return output;
    }
}

/**
 * TaskGroup stores all the groups of tasks generated by any 'group by'
 * instructions in the task block.
 */
export class TaskGroups {
    /**
     * Constructor for TaskGroups
     * @param {Grouping[]} groups - 0 or more Grouping values,
     *                              1 per 'group by' line in the task query block
     * @param {Task[]} tasks - 0 more more Task objects, with all the tasks
     *                         matching the query, already in sort order
     */
    constructor(groups: Grouping[], tasks: Task[]) {
        const initialGroups = new IntermediateTaskGroups(groups, tasks);
        this.addTasks(initialGroups);
    }

    private addTasks(initialGroups: IntermediateTaskGroups) {
        // Get the headings
        const grouper = new GroupHeadings(initialGroups.groups);

        // Build a container of all the groups
        for (const [groups, tasks] of initialGroups.groups) {
            const groupHeadings = grouper.getHeadingsForTaskGroup(groups);
            const taskGroup = new TaskGroup(groups, groupHeadings, tasks);
            this.add(taskGroup);
        }
    }

    private add(taskGroup: TaskGroup) {
        this._groups.push(taskGroup);
    }

    /**
     * All the tasks matching the query, grouped together, and in the order
     * that they should be displayed.
     */
    get groups(): TaskGroup[] {
        return this._groups;
    }

    /**
     * The total number of tasks matching the query - after applying any 'limit' instruction.
     */
    totalTasksCount() {
        let totalTasksCount = 0;
        for (const group of this.groups) {
            totalTasksCount += group.tasks.length;
        }
        return totalTasksCount;
    }

    /**
     * A human-readable representation of all the task groups.
     *
     * Note that this is used in snapshot testing, so if the format is
     * changed, the snapshots will need to be updated.
     */
    public toString(): string {
        let output = '';
        for (const taskGroup of this.groups) {
            output += taskGroup.toString();
            output += '\n---\n';
        }
        const totalTasksCount = this.totalTasksCount();
        output += `\n${totalTasksCount} tasks\n`;
        return output;
    }

    private _groups: TaskGroup[] = new Array<TaskGroup>();
}
