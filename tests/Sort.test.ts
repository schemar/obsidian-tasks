import moment from 'moment';

window.moment = moment;

import { Task } from '../src/Task';
import { Sort } from '../src/Sort';

function fromLine(line: string, path = '') {
    return Task.fromLine({
        line,
        path,
        precedingHeader: '',
        headings: [''],
        sectionIndex: 0,
        sectionStart: 0,
    })!;
}

describe('Sort', () => {
    test('by due', () => {
        const a = fromLine('- [x] bring out the trash 🗓 2021-09-12');
        const b = fromLine('- [ ] pet the cat 🗓 2021-09-15');
        const c = fromLine('- [ ] pet the cat 🗓 2021-09-18');
        expect(Sort.by({ sorting: ['due'] }, [a, b, c])).toEqual([a, b, c]);
        expect(Sort.by({ sorting: ['due'] }, [b, c, a])).toEqual([a, b, c]);
    });

    test('by done', () => {
        const a = fromLine('- [ ] bring out the trash 🗓 2021-09-12');
        const b = fromLine('- [x] pet the cat 🗓 2021-09-16 ✅ 2021-09-16');
        const c = fromLine('- [x] pet the cat 🗓 2021-09-15 ✅ 2021-09-15');
        expect(Sort.by({ sorting: ['done'] }, [a, b, c])).toEqual([c, b, a]);
        expect(Sort.by({ sorting: ['done'] }, [b, c, a])).toEqual([c, b, a]);
    });

    test('by due, path, status', () => {
        const a = fromLine('- [ ] a 🗓 1970-01-01', '1');
        const b = fromLine('- [x] b 🗓 1970-01-02', '2');
        const c = fromLine('- [ ] c 🗓 1970-01-02', '1');
        const d = fromLine('- [ ] d 🗓 1970-01-02', '2');
        const expectedOrder = [
            a, // Sort by due date first.
            c, // Same due as the rest, but lower path.
            d, // Same as b, but not done.
            b, // Done tasks are sorted after open tasks for status.
        ];
        expect(
            Sort.by({ sorting: ['due', 'path', 'status'] }, [a, b, c, d]),
        ).toEqual(expectedOrder);
    });
});
