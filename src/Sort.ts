import type moment from 'moment';
import type { Task } from './Task';
import type { Query } from './Query';

type Comparator = (a: Task, b: Task) => number;

export class Sort {
    public static by(query: Pick<Query, 'sorting'>, tasks: Task[]): Task[] {
        const defaultComparators: Comparator[] = [
            this.compareByStatus,
            this.compareByDueDate,
            this.compareByPath,
        ];

        const userComparators: Comparator[] = [];
        for (const sortProp of query.sorting) {
            switch (sortProp) {
                case 'status':
                    userComparators.push(this.compareByStatus);
                    break;
                case 'due':
                    userComparators.push(this.compareByDueDate);
                    break;
                case 'done':
                    userComparators.push(this.compareByDoneDate);
                    break;
                case 'path':
                    userComparators.push(this.compareByPath);
                    break;
                case 'description':
                    userComparators.push(this.compareByDescription);
                    break;
            }
        }

        return tasks.sort(
            this.makeCompositeComparator([
                ...userComparators,
                ...defaultComparators,
            ]),
        );
    }

    private static makeCompositeComparator(
        comparators: Comparator[],
    ): Comparator {
        return (a, b) => {
            for (const comparator of comparators) {
                const result = comparator(a, b);
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        };
    }

    private static compareByStatus(a: Task, b: Task): -1 | 0 | 1 {
        if (a.status < b.status) {
            return 1;
        } else if (a.status > b.status) {
            return -1;
        } else {
            return 0;
        }
    }

    private static compareByDueDate(a: Task, b: Task): -1 | 0 | 1 {
        return Sort.compareByDate(a.dueDate, b.dueDate);
    }

    private static compareByDoneDate(a: Task, b: Task): -1 | 0 | 1 {
        return Sort.compareByDate(a.doneDate, b.doneDate);
    }

    private static compareByDate(
        a: moment.Moment | null,
        b: moment.Moment | null,
    ): -1 | 0 | 1 {
        if (a !== null && b === null) {
            return -1;
        } else if (a === null && b !== null) {
            return 1;
        } else if (a !== null && b !== null) {
            if (a.isAfter(b)) {
                return 1;
            } else if (a.isBefore(b)) {
                return -1;
            } else {
                return 0;
            }
        } else {
            return 0;
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

    private static compareByDescription(a: Task, b: Task) {
        return a.description.localeCompare(b.description);
    }
}
