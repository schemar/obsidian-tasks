import type { Task } from './Task';
import type { Query } from './Query';

export class Sort {
    public static by(query: Query, tasks: Task[]): Task[] {
        switch (query.sorting) {
            case 'status':
                return this.byStatusThenDateThenPath(tasks);
            case "due":
                return this.byDue(tasks);
            case "done":
                return this.byDone(tasks);
            default:
                return this.byStatusThenDateThenPath(tasks);
        }
    }

    public static byDue(tasks: Task[]): Task[] {
        return tasks.sort(Sort.compareByDate);
    }

    public static byDone(tasks: Task[]): Task[] {
        return tasks.sort(Sort.compareByStatus);
    }

    public static byStatusThenDateThenPath(tasks: Task[]): Task[] {
        return tasks.sort(Sort.compareByStatus);
    }

    private static compareByStatus(a: Task, b: Task): -1 | 0 | 1 {
        if (a.status < b.status) {
            return 1;
        } else if (a.status > b.status) {
            return -1;
        } else {
            return Sort.compareByDate(a, b);
        }
    }

    private static compareByDate(a: Task, b: Task): -1 | 0 | 1 {
        if (a.dueDate !== null && b.dueDate === null) {
            return -1;
        } else if (a.dueDate === null && b.dueDate !== null) {
            return 1;
        } else if (a.dueDate !== null && b.dueDate !== null) {
            if (a.dueDate.isAfter(b.dueDate)) {
                return 1;
            } else if (a.dueDate.isBefore(b.dueDate)) {
                return -1;
            } else {
                return Sort.compareByPath(a, b);
            }
        } else {
            return Sort.compareByPath(a, b);
        }
    }

    private static compareByPath(a: Task, b: Task): -1 | 0 | 1 {
        if (a.path < b.path) {
            return -1;
        } else if (a.path > b.path) {
            return 1;
        } else {
            return 0;
        }
    }
}
