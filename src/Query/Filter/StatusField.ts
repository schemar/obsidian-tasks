import type { Task } from '../../Task';
import type { Comparator } from '../Sorter';
import { StatusType } from '../../StatusConfiguration';
import { FilterInstructionsBasedField } from './FilterInstructionsBasedField';

export class StatusField extends FilterInstructionsBasedField {
    constructor() {
        super();

        // Backwards-compatibility change: In Tasks 1.22.0 and earlier, all tasks
        // with any status character except space were considered by the status filter
        // instructions to be done.
        // In later versions:
        //   StatusType.DONE counts as done
        //   StatusType.CANCELLED counts as done
        //   StatusType.TODO counts as not done
        //   StatusType.IN_PROGRESS counts as not done
        //   StatusType.NON_TASK counts as done
        this._filters.add(
            'done',
            (task: Task) =>
                task.status.type === StatusType.DONE ||
                task.status.type === StatusType.CANCELLED ||
                task.status.type === StatusType.NON_TASK,
        );
        this._filters.add(
            'not done',
            (task: Task) => task.status.type === StatusType.TODO || task.status.type === StatusType.IN_PROGRESS,
        );
    }

    public fieldName(): string {
        return 'status';
    }

    public supportsSorting(): boolean {
        return true;
    }

    /**
     * Return a function to compare two Task objects, for use in sorting by status.
     */
    public comparator(): Comparator {
        // Backwards-compatibility note: In Tasks 1.22.0 and earlier, the
        // only available status names were 'Todo' and 'Done'.
        // And 'Todo' sorted before 'Done'.
        return (a: Task, b: Task) => {
            const oldStatusNameA = StatusField.oldStatusName(a);
            const oldStatusNameB = StatusField.oldStatusName(b);
            if (oldStatusNameA < oldStatusNameB) {
                return 1;
            } else if (oldStatusNameA > oldStatusNameB) {
                return -1;
            } else {
                return 0;
            }
        };
    }

    private static oldStatusName(a: Task): string {
        if (a.status.symbol === ' ') {
            return 'Todo';
        } else {
            return 'Done';
        }
    }
}
