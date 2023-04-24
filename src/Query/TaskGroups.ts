import type { Task } from '../Task';
import type { Grouper } from './Grouper';
import { GroupHeadingsDisplaySelector } from './GroupHeadingsDisplaySelector';
import { TaskGroupingTree } from './TaskGroupingTree';
import { TaskGroup } from './TaskGroup';

/**
 * TaskGroup stores all the groups of tasks generated by any 'group by'
 * instructions in the task block.
 */
export class TaskGroups {
    private _groups: TaskGroup[] = new Array<TaskGroup>();
    private _totalTaskCount = 0;

    /**
     * Constructor for TaskGroups
     * @param {Grouper[]} groups - 0 or more Grouping values,
     *                              1 per 'group by' line in the task query block
     * @param {Task[]} tasks - 0 more more Task objects, with all the tasks
     *                         matching the query, already in sort order
     */
    constructor(groups: Grouper[], tasks: Task[]) {
        // Grouping doesn't change the number of tasks, and all the tasks
        // will be shown in at least one group.
        this._totalTaskCount = tasks.length;

        const taskGroupingTree = new TaskGroupingTree(groups, tasks);
        this.addTasks(taskGroupingTree);
    }

    /**
     * All the tasks matching the query, grouped together, and in the order
     * that they should be displayed.
     */
    public get groups(): TaskGroup[] {
        return this._groups;
    }

    /**
     * The total number of tasks matching the query.
     */
    public totalTasksCount() {
        return this._totalTaskCount;
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

    private addTasks(taskGroupingTree: TaskGroupingTree) {
        // Get the headings
        const headingsDisplaySelector = new GroupHeadingsDisplaySelector(taskGroupingTree.groups);

        // Build a container of all the groups
        for (const [groups, tasks] of taskGroupingTree.groups) {
            const groupHeadings = headingsDisplaySelector.getHeadingsForTaskGroup(groups);
            const taskGroup = new TaskGroup(groups, groupHeadings, tasks);
            this.add(taskGroup);
        }
    }

    private add(taskGroup: TaskGroup) {
        this._groups.push(taskGroup);
    }
}
