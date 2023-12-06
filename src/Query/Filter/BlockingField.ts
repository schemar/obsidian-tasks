import type { SearchInfo } from '../SearchInfo';
import { FilterInstructionsBasedField } from './FilterInstructionsBasedField';

export class BlockingField extends FilterInstructionsBasedField {
    constructor() {
        super();
        this._filters.add('is blocking', (task, searchInfo: SearchInfo) => {
            if (task.id === '') return false;

            return searchInfo.allTasks.some((cacheTask) => {
                return cacheTask.dependsOn.includes(task.id);
            });
        });
        this._filters.add('is not blocked', (task, searchInfo: SearchInfo) => {
            if (task.dependsOn.length === 0) return true;

            for (const depId of task.dependsOn) {
                const depTask = searchInfo.allTasks.find((task) => task.id === depId);

                if (!depTask) continue;

                if (!depTask.status.isCompleted()) return false;
            }

            return true;
        });
    }

    fieldName(): string {
        return 'blocking';
    }
}
