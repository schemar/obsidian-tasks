import type { Task } from '../../Task';
import { FilterInstructionsBasedField } from './FilterInstructionsBasedField';

export class BlockingField extends FilterInstructionsBasedField {
    // @ts-ignore
    private readonly _allTasks: Task[];

    constructor(allTasks: Task[]) {
        super();
        this._allTasks = allTasks;
        this._filters.add('is blocking', (task) => {
            if (task.id === '') return false;

            return this._allTasks.some((cacheTask) => {
                return cacheTask.dependsOn.includes(task.id);
            });
        });
    }

    fieldName(): string {
        return 'blocking';
    }
}
