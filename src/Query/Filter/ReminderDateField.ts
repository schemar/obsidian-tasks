import type { Moment } from 'moment';
import type { Task } from '../../Task';
import { DateField } from './DateField';

// TODO Think about how this handles times - can users query times?
export class ReminderDateField extends DateField {
    public fieldName(): string {
        return 'reminder';
    }

    public date(task: Task): Moment | null {
        if (task.reminder) {
            return task.reminder.time;
        } else {
            return null;
        }
    }

    protected filterResultIfFieldMissing() {
        return false;
    }
}
