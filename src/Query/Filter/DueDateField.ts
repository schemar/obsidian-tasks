import type { Moment } from 'moment';
import type { Task } from '../../Task';
import { DateField } from './DateField';

export class DueDateField extends DateField {
    private static readonly dueRegexp = /^due (before|after|on)? ?(.*)/;

    protected filterRegexp(): RegExp {
        return DueDateField.dueRegexp;
    }
    protected fieldName(): string {
        return 'due';
    }
    protected date(task: Task): Moment | null {
        return task.dueDate;
    }
}
