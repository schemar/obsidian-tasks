import moment from 'moment';

window.moment = moment;

import { Task } from '../src/Task';
import { Sort } from '../src/Sort';

function fromLine(
    line: string,
    opts: Partial<Parameters<typeof Task.fromLine>[0]> = {},
) {
    return Task.fromLine({
        line,
        path: '',
        precedingHeader: '',
        sectionIndex: 0,
        sectionStart: 0,
        ...opts,
    })!;
}

describe('Sort', () => {
    test('by due', () => {
        const a = fromLine('- [x] bring out the trash 🗓 2021-09-12');
        const b = fromLine('- [ ] pet the cat 🗓 2021-09-15');
        const c = fromLine('- [ ] pet the cat 🗓 2021-09-18');
        expect(
            Sort.by({ sorting: [{ property: 'due', reverse: false }] }, [
                a,
                b,
                c,
            ]),
        ).toEqual([a, b, c]);
        expect(
            Sort.by({ sorting: [{ property: 'due', reverse: false }] }, [
                b,
                c,
                a,
            ]),
        ).toEqual([a, b, c]);
    });

    test('by done', () => {
        const a = fromLine('- [ ] bring out the trash 🗓 2021-09-12');
        const b = fromLine('- [x] pet the cat 🗓 2021-09-16 ✅ 2021-09-16');
        const c = fromLine('- [x] pet the cat 🗓 2021-09-15 ✅ 2021-09-15');
        expect(
            Sort.by({ sorting: [{ property: 'done', reverse: false }] }, [
                a,
                b,
                c,
            ]),
        ).toEqual([c, b, a]);
        expect(
            Sort.by({ sorting: [{ property: 'done', reverse: false }] }, [
                b,
                c,
                a,
            ]),
        ).toEqual([c, b, a]);
    });

    test('by due, path, status', () => {
        const a = fromLine('- [ ] a 🗓 1970-01-01', { path: '1' });
        const b = fromLine('- [x] b 🗓 1970-01-02', { path: '2' });
        const c = fromLine('- [ ] c 🗓 1970-01-02', { path: '1' });
        const d = fromLine('- [ ] d 🗓 1970-01-02', { path: '2' });
        const expectedOrder = [
            a, // Sort by due date first.
            c, // Same due as the rest, but lower path.
            d, // Same as b, but not done.
            b, // Done tasks are sorted after open tasks for status.
        ];
        expect(
            Sort.by(
                {
                    sorting: [
                        { property: 'due', reverse: false },
                        { property: 'path', reverse: false },
                        { property: 'status', reverse: false },
                    ],
                },
                [a, b, c, d],
            ),
        ).toEqual(expectedOrder);
    });

    test('by due, path, status', () => {
        const a = fromLine('- [ ] a 🗓 1970-01-01', { path: '1' });
        const b = fromLine('- [x] b 🗓 1970-01-01', { path: '2' });
        const c = fromLine('- [ ] c 🗓 1970-01-01', { path: '2' });
        const expectedOrder = [
            a, // date is the same, but path is lower
            c, // path is higher, but same as b. this is first b/c it's not done yet
            b, // same as c, but already done. this has lowest priority
        ];
        expect(
            Sort.by(
                {
                    sorting: [
                        { property: 'due', reverse: false },
                        { property: 'path', reverse: false },
                        { property: 'status', reverse: false },
                    ],
                },
                [a, b, c],
            ),
        ).toEqual(expectedOrder);
    });

    test('by due, path reverse, status', () => {
        const a = fromLine('- [ ] a 🗓 1970-01-01', { path: '1' });
        const b = fromLine('- [x] b 🗓 1970-01-01', { path: '2' });
        const c = fromLine('- [ ] c 🗓 1970-01-01', { path: '2' });
        const expectedOrder = [
            c, // dates are all the same, but path is higher than a. this is before b b/c it's not done yet
            b, // same as c, but already done.
            a, // path is lowest, so it's last
        ];
        expect(
            Sort.by(
                {
                    sorting: [
                        { property: 'due', reverse: false },
                        { property: 'path', reverse: true },
                        { property: 'status', reverse: false },
                    ],
                },
                [a, b, c],
            ),
        ).toEqual(expectedOrder);
    });
});
