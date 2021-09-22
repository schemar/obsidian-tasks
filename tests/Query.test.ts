import { Query } from '../src/Query';
import { Status, Task } from '../src/Task';

describe('Query', () => {
    describe('filtering', () => {
        it('filters paths case insensitive', () => {
            // Arrange
            const tasks = [
                new Task({
                    status: Status.Todo,
                    description: 'description',
                    path: 'Ab/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    originalStatusCharacter: ' ',
                    precedingHeader: null,
                    dueDate: null,
                    doneDate: null,
                    recurrenceRule: null,
                    blockLink: '',
                }),
                new Task({
                    status: Status.Todo,
                    description: 'description',
                    path: 'FF/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    originalStatusCharacter: ' ',
                    precedingHeader: null,
                    dueDate: null,
                    doneDate: null,
                    recurrenceRule: null,
                    blockLink: '',
                }),
            ];
            const input = 'path includes ab/c d';
            const query = new Query({ source: input });

            // Act
            let filteredTasks = [...tasks];
            query.filters.forEach((filter) => {
                filteredTasks = filteredTasks.filter(filter);
            });

            // Assert
            expect(filteredTasks.length).toEqual(1);
            expect(filteredTasks[0]).toEqual(tasks[0]);
        });
    });

    describe('sorting instructions', () => {
        const cases: {
            input: string;
            output: { property: string; reverse: boolean }[];
        }[] = [
            {
                input: 'sort by status',
                output: [{ property: 'status', reverse: false }],
            },
            {
                input: 'sort by status\nsort by due',
                output: [
                    { property: 'status', reverse: false },
                    { property: 'due', reverse: false },
                ],
            },
        ];
        test.each(cases)('sorting as %p', ({ input, output }) => {
            const query = new Query({ source: input });

            expect(query.sorting).toEqual(output);
        });
    });
});
