/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { Query } from '../src/Query/Query';
import { Status } from '../src/Status';
import { Priority, Task } from '../src/Task';
import { GlobalFilter } from '../src/Config/GlobalFilter';
import { TaskLocation } from '../src/TaskLocation';
import { fieldCreators } from '../src/Query/FilterParser';
import type { Field } from '../src/Query/Filter/Field';
import type { BooleanField } from '../src/Query/Filter/BooleanField';
import { SearchInfo } from '../src/Query/SearchInfo';
import { FilterOrErrorMessage } from '../src/Query/Filter/FilterOrErrorMessage';
import { Explanation } from '../src/Query/Explain/Explanation';
import { Filter } from '../src/Query/Filter/Filter';
import { DescriptionField } from '../src/Query/Filter/DescriptionField';
import { createTasksFromMarkdown, fromLine } from './TestHelpers';
import type { FilteringCase } from './TestingTools/FilterTestHelpers';
import { shouldSupportFiltering } from './TestingTools/FilterTestHelpers';
import { TaskBuilder } from './TestingTools/TaskBuilder';

window.moment = moment;

interface NamedField {
    name: string;
    field: Field;
}
const namedFields: ReadonlyArray<NamedField> = fieldCreators
    .map((creator) => {
        const field = creator();
        return { name: field.fieldName(), field };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

function sortInstructionLines(filters: ReadonlyArray<string>) {
    // Sort a copy of the array of filters.
    return [...filters].sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));
}

describe('Query parsing', () => {
    // In alphabetical order, please
    const filters: ReadonlyArray<string> = [
        '(due this week) AND (description includes Hello World)',
        '(DUE THIS WEEK) AND (DESCRIPTION INCLUDES Hello World)',
        'created after 2021-12-27',
        'CREATED AFTER 2021-12-27',
        'created before 2021-12-27',
        'CREATED BEFORE 2021-12-27',
        'created date is invalid',
        'CREATED date is invalid',
        'created in 2021-12-27 2021-12-29',
        'CREATED IN 2021-12-27 2021-12-29',
        'created on 2021-12-27',
        'CREATED ON 2021-12-27',
        'created this week',
        'CREATED THIS WEEK',
        'description does not include wibble',
        'DESCRIPTION DOES NOT INCLUDE wibble',
        'description includes AND', // Verify Query doesn't confuse this with a boolean query
        'DESCRIPTION INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'description includes wibble',
        'DESCRIPTION INCLUDES wibble',
        'done',
        'DONE',
        'done after 2021-12-27',
        'DONE AFTER 2021-12-27',
        'done before 2021-12-27',
        'DONE BEFORE 2021-12-27',
        'done date is invalid',
        'DONE DATE IS INVALID',
        'done in 2021-12-27 2021-12-29',
        'DONE IN 2021-12-27 2021-12-29',
        'done on 2021-12-27',
        'DONE ON 2021-12-27',
        'done this week',
        'DONE THIS WEEK',
        'due after 2021-12-27',
        'DUE AFTER 2021-12-27',
        'due before 2021-12-27',
        'DUE BEFORE 2021-12-27',
        'due date is invalid',
        'DUE DATE IS INVALID',
        'due in 2021-12-27 2021-12-29',
        'DUE IN 2021-12-27 2021-12-29',
        'due on 2021-12-27',
        'DUE ON 2021-12-27',
        'due this week',
        'DUE THIS WEEK',
        'exclude sub-items',
        'EXCLUDE SUB-ITEMS',
        'filename includes wibble',
        'FILENAME INCLUDES wibble',
        'filter by function task.isDone', // This cannot contain any () because of issue #1500
        'FILTER BY FUNCTION task.isDone', // This cannot contain any () because of issue #1500
        'folder does not include some/path',
        'FOLDER DOES NOT INCLUDE some/path',
        'folder includes AND', // Verify Query doesn't confuse this with a boolean query
        'FOLDER INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'folder includes some/path',
        'FOLDER INCLUDES some/path',
        'happens after 2021-12-27',
        'HAPPENS AFTER 2021-12-27',
        'happens before 2021-12-27',
        'HAPPENS BEFORE 2021-12-27',
        'happens in 2021-12-27 2021-12-29',
        'HAPPENS IN 2021-12-27 2021-12-29',
        'happens on 2021-12-27',
        'HAPPENS ON 2021-12-27',
        'happens this week',
        'HAPPENS THIS WEEK',
        'has created date',
        'HAS CREATED DATE',
        'has done date',
        'HAS DONE DATE',
        'has due date',
        'HAS DUE DATE',
        'has happens date',
        'HAS HAPPENS DATE',
        'has scheduled date',
        'HAS SCHEDULED DATE',
        'has start date',
        'HAS START DATE',
        'has tag',
        'HAS TAG',
        'has tags',
        'HAS TAGS',
        'heading does not include wibble',
        'HEADING DOES NOT INCLUDE wibble',
        'heading includes AND', // Verify Query doesn't confuse this with a boolean query
        'HEADING INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'heading includes wibble',
        'HEADING INCLUDES wibble',
        'is not recurring',
        'IS NOT RECURRING',
        'is recurring',
        'IS RECURRING',
        'no created date',
        'NO CREATED DATE',
        'no due date',
        'NO DUE DATE',
        'no happens date',
        'NO HAPPENS DATE',
        'no scheduled date',
        'NO SCHEDULED DATE',
        'no start date',
        'NO START DATE',
        'no tag',
        'NO TAG',
        'no tags',
        'NO TAGS',
        'not done',
        'NOT DONE',
        'path does not include some/path',
        'PATH DOES NOT INCLUDE some/path',
        'path includes AND', // Verify Query doesn't confuse this with a boolean query
        'PATH INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'path includes some/path',
        'PATH INCLUDES some/path',
        'priority is above none',
        'PRIORITY IS ABOVE NONE',
        'priority is below none',
        'PRIORITY IS BELOW NONE',
        'priority is high',
        'PRIORITY IS HIGH',
        'priority is low',
        'PRIORITY IS LOW',
        'priority is medium',
        'PRIORITY IS MEDIUM',
        'priority is none',
        'PRIORITY IS NONE',
        'recurrence does not include wednesday',
        'RECURRENCE DOES NOT INCLUDE wednesday',
        'recurrence includes wednesday',
        'RECURRENCE INCLUDES wednesday',
        'root does not include some',
        'ROOT DOES NOT INCLUDE some',
        'root includes AND', // Verify Query doesn't confuse this with a boolean query
        'ROOT INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'root includes some',
        'ROOT INCLUDES some',
        'scheduled after 2021-12-27',
        'SCHEDULED AFTER 2021-12-27',
        'scheduled before 2021-12-27',
        'SCHEDULED BEFORE 2021-12-27',
        'scheduled date is invalid',
        'SCHEDULED DATE IS INVALID',
        'scheduled in 2021-12-27 2021-12-29',
        'SCHEDULED IN 2021-12-27 2021-12-29',
        'scheduled on 2021-12-27',
        'SCHEDULED ON 2021-12-27',
        'scheduled this week',
        'SCHEDULED THIS WEEK',
        'start date is invalid',
        'START DATE IS INVALID',
        'starts after 2021-12-27',
        'STARTS AFTER 2021-12-27',
        'starts before 2021-12-27',
        'STARTS BEFORE 2021-12-27',
        'starts in 2021-12-27 2021-12-29',
        'STARTS IN 2021-12-27 2021-12-29',
        'starts on 2021-12-27',
        'STARTS ON 2021-12-27',
        'starts this week',
        'STARTS THIS WEEK',
        'status.name includes cancelled',
        'STATUS.NAME INCLUDES cancelled',
        'status.type is IN_PROGRESS',
        'STATUS.TYPE IS IN_PROGRESS',
        'tag does not include #sometag',
        'TAG DOES NOT INCLUDE #sometag',
        'tag does not include sometag',
        'TAG DOES NOT INCLUDE sometag',
        'tag includes #sometag',
        'TAG INCLUDES #sometag',
        'tag includes AND', // Verify Query doesn't confuse this with a boolean query
        'TAG INCLUDES AND', // Verify Query doesn't confuse this with a boolean query
        'tag includes sometag',
        'TAG INCLUDES sometag',
        'tags do not include #sometag',
        'TAGS DO NOT INCLUDE #sometag',
        'tags do not include sometag',
        'TAGS DO NOT INCLUDE sometag',
        'tags include #sometag',
        'TAGS INCLUDE #sometag',
        'tags include sometag',
        'TAGS INCLUDE sometag',
    ];

    /**
     * As more and more filters are added via the Field class, and tested
     * outside of this test file, there is the chance that someone thinks that
     * they have correctly added a new filter option, but forgotten to register
     * it in the FilterParser.ts file.
     *
     * This set of tests exists as a growing list of sample filters, and purely checks
     * that the Query class parses them successfully.
     *
     * A failure here means that the Query constructor or FilterParser.ts is missing code to
     * recognise one of the supported instructions.
     */
    describe('should recognise every supported filter', () => {
        test.concurrent.each<string>(filters)('recognises %j', (filter) => {
            // Arrange
            const query = new Query(filter);

            // Assert
            expect(query.error).toBeUndefined();
            expect(query.filters.length).toEqual(1);
            expect(query.filters[0]).toBeDefined();
        });

        it('sample lines really are in alphabetical order', () => {
            expect(filters).toStrictEqual(sortInstructionLines(filters));
        });

        function linesMatchingField(field: Field | BooleanField) {
            return filters.filter((instruction) => {
                return (
                    field.canCreateFilterForLine(instruction) &&
                    field.createFilterOrErrorMessage(instruction).error === undefined
                );
            });
        }

        describe.each(namedFields)('has sufficient sample "filter" lines for field "%s"', ({ name, field }) => {
            function fieldDoesNotSupportFiltering() {
                return name === 'backlink' || name === 'urgency';
            }

            // This is a bit weaker than the corresponding tests for 'sort by' and 'group by',
            // because so many of the Field classes support multiple different search lines.
            // But it has found a few missing test cases nevertheless.
            it('has at least one sample line for filter', () => {
                const matchingLines = linesMatchingField(field);
                if (fieldDoesNotSupportFiltering()) {
                    expect(matchingLines.length).toEqual(0);
                } else {
                    expect(matchingLines.length).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('should not confuse a boolean query for any other single field', () => {
        test.concurrent.each<string>(filters)('sub-query %j is recognized inside a boolean query', (filter) => {
            // Arrange
            // For every sub-query from the filters list above, compose a boolean query that is always
            // true, in the format (expression) OR NOT (expression)
            const queryString = `(${filter}) OR NOT (${filter})`;
            const query = new Query(queryString);

            const taskLine = '- [ ] this is a task due 📅 2021-09-12 #inside_tag ⏫ #some/tags_with_underscore';
            const task = fromLine({
                line: taskLine,
            });

            // Assert
            expect(query.error).toBeUndefined();
            expect(query.filters.length).toEqual(1);
            expect(query.filters[0]).toBeDefined();
            // If the boolean query and its sub-query are parsed correctly, the expression should always be true
            expect(query.filters[0].filterFunction(task, SearchInfo.fromAllTasks([task]))).toBeTruthy();
        });
    });

    describe('should recognise every sort instruction', () => {
        // In alphabetical order, please
        const filters: ReadonlyArray<string> = [
            'sort by created',
            'SORT BY CREATED',
            'sort by created reverse',
            'SORT BY CREATED REVERSE',
            'sort by description',
            'SORT BY DESCRIPTION',
            'sort by description reverse',
            'SORT BY DESCRIPTION REVERSE',
            'sort by done',
            'SORT BY DONE',
            'sort by done reverse',
            'SORT BY DONE REVERSE',
            'sort by due',
            'SORT BY DUE',
            'sort by due reverse',
            'SORT BY DUE REVERSE',
            'sort by filename',
            'SORT BY FILENAME',
            'sort by filename reverse',
            'SORT BY FILENAME REVERSE',
            'sort by happens',
            'SORT BY HAPPENS',
            'sort by happens reverse',
            'SORT BY HAPPENS REVERSE',
            'sort by heading',
            'SORT BY HEADING',
            'sort by heading reverse',
            'SORT BY HEADING REVERSE',
            'sort by path',
            'SORT BY PATH',
            'sort by path reverse',
            'SORT BY PATH REVERSE',
            'sort by priority',
            'SORT BY PRIORITY',
            'sort by priority reverse',
            'SORT BY PRIORITY REVERSE',
            'sort by recurring',
            'SORT BY RECURRING',
            'sort by recurring reverse',
            'SORT BY RECURRING REVERSE',
            'sort by scheduled',
            'SORT BY SCHEDULED',
            'sort by scheduled reverse',
            'SORT BY SCHEDULED REVERSE',
            'sort by start',
            'SORT BY START',
            'sort by start reverse',
            'SORT BY START REVERSE',
            'sort by status',
            'SORT BY STATUS',
            'sort by status reverse',
            'SORT BY STATUS REVERSE',
            'sort by status.name',
            'SORT BY STATUS.NAME',
            'sort by status.name reverse',
            'SORT BY STATUS.NAME REVERSE',
            'sort by status.type',
            'SORT BY STATUS.TYPE',
            'sort by status.type reverse',
            'SORT BY STATUS.TYPE REVERSE',
            'sort by tag',
            'SORT BY TAG',
            'sort by tag 5',
            'SORT BY TAG 5',
            'sort by tag reverse',
            'SORT BY TAG REVERSE',
            'sort by tag reverse 3',
            'SORT BY TAG REVERSE 3',
            'sort by urgency',
            'SORT BY URGENCY',
            'sort by urgency reverse',
            'SORT BY URGENCY REVERSE',
        ];
        test.concurrent.each<string>(filters)('recognises %j', (filter) => {
            // Arrange
            const query = new Query(filter);

            // Assert
            expect(query.error).toBeUndefined();
            expect(query.sorting.length).toEqual(1);
            expect(query.sorting[0]).toBeDefined();
        });

        it('sample lines really are in alphabetical order', () => {
            expect(filters).toStrictEqual(sortInstructionLines(filters));
        });

        function linesMatchingField(field: Field | BooleanField) {
            return filters.filter((instruction) => field.createSorterFromLine(instruction) !== null);
        }

        describe.each(namedFields)('has sufficient sample "sort by" lines for field "%s"', ({ field }) => {
            if (!field.supportsSorting()) {
                return;
            }

            const matchingLines = linesMatchingField(field);

            it('has at least one test for normal sorting', () => {
                expect(matchingLines.filter((line) => !line.includes(' reverse')).length).toBeGreaterThan(0);
            });

            it('has at least one test for reverse sorting', () => {
                expect(matchingLines.filter((line) => line.includes(' reverse')).length).toBeGreaterThan(0);
            });
        });
    });

    describe('should recognise every group instruction', () => {
        // In alphabetical order, please
        const filters: ReadonlyArray<string> = [
            'group by backlink',
            'GROUP BY BACKLINK',
            'group by backlink reverse',
            'GROUP BY BACKLINK REVERSE',
            'group by created',
            'GROUP BY CREATED',
            'group by created reverse',
            'GROUP BY CREATED REVERSE',
            'group by done',
            'GROUP BY DONE',
            'group by done reverse',
            'GROUP BY DONE REVERSE',
            'group by due',
            'GROUP BY DUE',
            'group by due reverse',
            'GROUP BY DUE REVERSE',
            'group by filename',
            'GROUP BY FILENAME',
            'group by filename reverse',
            'GROUP BY FILENAME REVERSE',
            'group by folder',
            'GROUP BY FOLDER',
            'group by folder reverse',
            'GROUP BY FOLDER REVERSE',
            'group by function reverse task.status.symbol.replace(" ", "space")',
            'GROUP BY FUNCTION REVERSE task.status.symbol.replace(" ", "space")',
            'group by function task.file.path.replace(query.file.folder, "")',
            'GROUP BY FUNCTION task.file.path.replace(query.file.folder, "")',
            'group by function task.status.symbol.replace(" ", "space")',
            'GROUP BY FUNCTION task.status.symbol.replace(" ", "space")',
            'group by happens',
            'GROUP BY HAPPENS',
            'group by happens reverse',
            'GROUP BY HAPPENS REVERSE',
            'group by heading',
            'GROUP BY HEADING',
            'group by heading reverse',
            'GROUP BY HEADING REVERSE',
            'group by path',
            'GROUP BY PATH',
            'group by path reverse',
            'GROUP BY PATH REVERSE',
            'group by priority',
            'GROUP BY PRIORITY',
            'group by priority reverse',
            'GROUP BY PRIORITY REVERSE',
            'group by recurrence',
            'GROUP BY RECURRENCE',
            'group by recurrence reverse',
            'GROUP BY RECURRENCE REVERSE',
            'group by recurring',
            'GROUP BY RECURRING',
            'group by recurring reverse',
            'GROUP BY RECURRING REVERSE',
            'group by root',
            'GROUP BY ROOT',
            'group by root reverse',
            'GROUP BY ROOT REVERSE',
            'group by scheduled',
            'GROUP BY SCHEDULED',
            'group by scheduled reverse',
            'GROUP BY SCHEDULED REVERSE',
            'group by start',
            'GROUP BY START',
            'group by start reverse',
            'GROUP BY START REVERSE',
            'group by status',
            'GROUP BY STATUS',
            'group by status reverse',
            'GROUP BY STATUS REVERSE',
            'group by status.name',
            'GROUP BY STATUS.NAME',
            'group by status.name reverse',
            'GROUP BY STATUS.NAME REVERSE',
            'group by status.type',
            'GROUP BY STATUS.TYPE',
            'group by status.type reverse',
            'GROUP BY STATUS.TYPE REVERSE',
            'group by tags',
            'GROUP BY TAGS',
            'group by tags reverse',
            'GROUP BY TAGS REVERSE',
            'group by urgency',
            'GROUP BY URGENCY',
            'group by urgency reverse',
            'GROUP BY URGENCY REVERSE',
        ];
        test.concurrent.each<string>(filters)('recognises %j', (filter) => {
            // Arrange
            const query = new Query(filter);

            // Assert
            expect(query.error).toBeUndefined();
            expect(query.grouping.length).toEqual(1);
            expect(query.grouping[0]).toBeDefined();
        });

        it('sample lines really are in alphabetical order', () => {
            expect(filters).toStrictEqual(sortInstructionLines(filters));
        });

        function linesMatchingField(field: Field | BooleanField) {
            return filters.filter((instruction) => field.createGrouperFromLine(instruction) !== null);
        }

        describe.each(namedFields)('has sufficient sample "group by" lines for field "%s"', ({ field }) => {
            if (!field.supportsGrouping()) {
                return;
            }

            const matchingLines = linesMatchingField(field);

            it('has at least one test for normal grouping', () => {
                expect(matchingLines.filter((line) => !line.includes(' reverse')).length).toBeGreaterThan(0);
            });

            it('has at least one test for reverse grouping', () => {
                expect(matchingLines.filter((line) => line.includes(' reverse')).length).toBeGreaterThan(0);
            });
        });
    });

    describe('should recognise every other instruction', () => {
        // In alphabetical order, please
        const filters: ReadonlyArray<string> = [
            '# Comment lines are ignored',
            'explain',
            'EXPLAIN',
            'hide backlink',
            'HIDE backlink',
            'hide created date',
            'HIDE CREATED DATE',
            'hide done date',
            'HIDE DONE DATE',
            'hide due date',
            'HIDE DUE DATE',
            'hide edit button',
            'HIDE EDIT BUTTON',
            'hide priority',
            'HIDE PRIORITY',
            'hide recurrence rule',
            'HIDE RECURRENCE RULE',
            'hide scheduled date',
            'HIDE SCHEDULED DATE',
            'hide start date',
            'HIDE START DATE',
            'hide tags',
            'HIDE TAGS',
            'hide task count',
            'HIDE TASK COUNT',
            'hide urgency',
            'HIDE URGENCY',
            'ignore global query',
            'IGNORE GLOBAL QUERY',
            'limit 42',
            'LIMIT 42',
            'limit groups 31',
            'LIMIT GROUPS 31',
            'limit groups to 31 tasks',
            'LIMIT GROUPS TO 31 TASKS',
            'limit to 42 tasks',
            'LIMIT TO 42 TASKS',
            'short',
            'SHORT',
            'short mode',
            'SHORT MODE',
            'show backlink',
            'SHOW BACKLINK',
            'show created date',
            'SHOW CREATED DATE',
            'show done date',
            'SHOW DONE DATE',
            'show due date',
            'SHOW DUE DATE',
            'show edit button',
            'SHOW EDIT BUTTON',
            'show priority',
            'SHOW PRIORITY',
            'show recurrence rule',
            'SHOW RECURRENCE RULE',
            'show scheduled date',
            'SHOW SCHEDULED DATE',
            'show start date',
            'SHOW START DATE',
            'show tags',
            'SHOW TAGS',
            'show task count',
            'SHOW TASK COUNT',
            'show urgency',
            'SHOW URGENCY',
        ];
        test.concurrent.each<string>(filters)('recognises %j', (filter) => {
            // Arrange
            const query = new Query(filter);

            // Assert
            expect(query.error).toBeUndefined();
        });

        it('sample lines really are in alphabetical order', () => {
            expect(filters).toStrictEqual(sortInstructionLines(filters));
        });
    });

    describe('should recognize boolean queries', () => {
        const filters: ReadonlyArray<string> = [
            '# Comment lines are ignored',
            '(DESCRIPTION INCLUDES wibble) OR (has due date)',
            '(has due date) OR ((HAS START DATE) AND (due after 2021-12-27))',
            '(is not recurring) XOR ((path includes ab/c) OR (happens before 2021-12-27))',
            String.raw`(description includes line 1) OR \
(description includes line 1 continued\
 with \ backslash)`,
        ];
        test.concurrent.each<string>(filters)('recognises %j', (filter) => {
            // Arrange
            const query = new Query(filter);

            // Assert
            expect(query.error).toBeUndefined();
        });
    });

    it('should parse ambiguous sort by queries correctly', () => {
        expect(new Query('sort by status').sorting[0].property).toEqual('status');
        expect(new Query('SORT BY STATUS').sorting[0].property).toEqual('status');

        expect(new Query('sort by status.name').sorting[0].property).toEqual('status.name');
        expect(new Query('SORT BY STATUS.NAME').sorting[0].property).toEqual('status.name');
    });

    it('should parse ambiguous group by queries correctly', () => {
        expect(new Query('group by status').grouping[0].property).toEqual('status');
        expect(new Query('GROUP BY STATUS').grouping[0].property).toEqual('status');

        expect(new Query('group by status.name').grouping[0].property).toEqual('status.name');
        expect(new Query('GROUP BY STATUS.NAME').grouping[0].property).toEqual('status.name');

        expect(new Query('group by status.type').grouping[0].property).toEqual('status.type');
        expect(new Query('GROUP BY STATUS.TYPE').grouping[0].property).toEqual('status.type');
    });

    describe('should include instruction in parsing error messages', () => {
        function getQueryError(source: string) {
            return new Query(source).error;
        }

        it('for invalid regular expression filter', () => {
            const source = 'description regex matches apple sauce';
            expect(getQueryError(source)).toEqual(
                String.raw`Invalid instruction: 'description regex matches apple sauce'

See https://publish.obsidian.md/tasks/Queries/Regular+Expressions

Regular expressions must look like this:
    /pattern/
or this:
    /pattern/flags

Where:
- pattern: The 'regular expression' pattern to search for.
- flags:   Optional characters that modify the search.
           i => make the search case-insensitive
           u => add Unicode support

Examples:  /^Log/
           /^Log/i
           /File Name\.md/
           /waiting|waits|waited/i
           /\d\d:\d\d/

The following characters have special meaning in the pattern:
to find them literally, you must add a \ before them:
    [\^$.|?*+()

CAUTION! Regular expression (or 'regex') searching is a powerful
but advanced feature that requires thorough knowledge in order to
use successfully, and not miss intended search results.

Problem line: "${source}"`,
            );
        });

        it('for invalid sort by', () => {
            const source = 'sort by nonsense';
            const sourceUpperCase = source.toUpperCase();
            expect(getQueryError(source)).toEqual(`do not understand query
Problem line: "${source}"`);
            expect(getQueryError(sourceUpperCase)).toEqual(`do not understand query
Problem line: "${sourceUpperCase}"`);
        });

        it('for invalid group by', () => {
            const source = 'group by nonsense';
            const sourceUpperCase = source.toUpperCase();
            expect(getQueryError(source)).toEqual(`do not understand query
Problem line: "${source}"`);
            expect(getQueryError(sourceUpperCase)).toEqual(`do not understand query
Problem line: "${sourceUpperCase}"`);
        });

        it('for invalid hide', () => {
            const source = 'hide nonsense';
            const sourceUpperCase = source.toUpperCase();
            expect(getQueryError(source)).toEqual(`do not understand query
Problem line: "${source}"`);
            expect(getQueryError(sourceUpperCase)).toEqual(`do not understand query
Problem line: "${sourceUpperCase}"`);
        });

        it('for unknown instruction', () => {
            const source = 'spaghetti';
            const sourceUpperCase = source.toUpperCase();
            expect(getQueryError(source)).toEqual(`do not understand query
Problem line: "${source}"`);
            expect(getQueryError(sourceUpperCase)).toEqual(`do not understand query
Problem line: "${sourceUpperCase}"`);
        });
    });

    describe('parsing placeholders', () => {
        it('should expand placeholder values in filters, but not source', () => {
            // Arrange
            const rawQuery = 'path includes {{query.file.path}}';
            const path = 'a/b/path with space.md';

            // Act
            const query = new Query(rawQuery, path);

            // Assert
            expect(query.source).toEqual(rawQuery); // Interesting that query.source still has the placeholder text
            expect(query.filters.length).toEqual(1);
            expect(query.filters[0].instruction).toEqual('path includes a/b/path with space.md');
        });

        it('should report error if placeholders used without query location', () => {
            // Arrange
            const source = 'path includes {{query.file.path}}';

            // Act
            const query = new Query(source);

            // Assert
            expect(query).not.toBeValid();
            expect(query.error).toEqual(
                'The query looks like it contains a placeholder, with "{{" and "}}"\n' +
                    'but no file path has been supplied, so cannot expand placeholder values.\n' +
                    'The query is:\n' +
                    'path includes {{query.file.path}}',
            );
            expect(query.filters.length).toEqual(0);
        });

        it('should report error if non-existent placeholder used', () => {
            // Arrange
            const source = 'path includes {{query.file.noSuchProperty}}';
            const path = 'a/b/path with space.md';

            // Act
            const query = new Query(source, path);

            // Assert
            expect(query).not.toBeValid();
            expect(query.error).toEqual(
                'There was an error expanding one or more placeholders.\n' +
                    '\n' +
                    'The error message was:\n' +
                    '    Unknown property: query.file.noSuchProperty\n' +
                    '\n' +
                    'The problem is in:\n' +
                    '    path includes {{query.file.noSuchProperty}}',
            );
            expect(query.filters.length).toEqual(0);
        });
    });
});

describe('Query', () => {
    describe('filtering', () => {
        it('filters paths case insensitive', () => {
            // Arrange
            const tasks = [
                new Task({
                    status: Status.TODO,
                    description: 'description',
                    taskLocation: TaskLocation.fromUnknownPosition('Ab/C D'),
                    indentation: '',
                    listMarker: '-',
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                    originalMarkdown: '',
                    scheduledDateIsInferred: false,
                    createdDate: null,
                }),
                new Task({
                    status: Status.TODO,
                    description: 'description',
                    taskLocation: TaskLocation.fromUnknownPosition('FF/C D'),
                    indentation: '',
                    listMarker: '-',
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                    originalMarkdown: '',
                    scheduledDateIsInferred: false,
                    createdDate: null,
                }),
            ];
            const source = 'path includes ab/c d';
            const query = new Query(source);

            // Act
            let filteredTasks = [...tasks];
            const searchInfo = SearchInfo.fromAllTasks(tasks);
            query.filters.forEach((filter) => {
                filteredTasks = filteredTasks.filter((task) => filter.filterFunction(task, searchInfo));
            });

            // Assert
            expect(filteredTasks.length).toEqual(1);
            expect(filteredTasks[0]).toEqual(tasks[0]);
        });

        test.concurrent.each<[string, FilteringCase]>([
            [
                'by due date presence',
                {
                    filters: ['has due date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                },
            ],
            [
                'by due date presence uppercase',
                {
                    filters: ['HAS DUE DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                },
            ],
            [
                'by start date presence',
                {
                    filters: ['has start date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                },
            ],
            [
                'by start date presence uppercase',
                {
                    filters: ['HAS START DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                },
            ],
            [
                'by scheduled date presence',
                {
                    filters: ['has scheduled date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                },
            ],
            [
                'by scheduled date presence uppercase',
                {
                    filters: ['HAS SCHEDULED DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                },
            ],
            [
                'by due date absence',
                {
                    filters: ['no due date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by due date absence uppercase',
                {
                    filters: ['NO DUE DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by start date absence',
                {
                    filters: ['no start date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by start date absence uppercase',
                {
                    filters: ['NO START DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 🛫 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by scheduled date absence',
                {
                    filters: ['no scheduled date'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by scheduled date absence uppercase',
                {
                    filters: ['NO SCHEDULED DATE'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 ⏳ 2022-04-20',
                    ],
                    expectedResult: ['- [ ] task 1'],
                },
            ],
            [
                'by start date (before)',
                {
                    filters: ['starts before 2022-04-20'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-15',
                        '- [ ] task 3 🛫 2022-04-20',
                        '- [ ] task 4 🛫 2022-04-25',
                    ],
                    expectedResult: [
                        '- [ ] task 1', // reference: https://publish.obsidian.md/tasks/Queries/Filters#Start+Date
                        '- [ ] task 2 🛫 2022-04-15',
                    ],
                },
            ],
            [
                'by start date (before) uppercase',
                {
                    filters: ['STARTS BEFORE 2022-04-20'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-15',
                        '- [ ] task 3 🛫 2022-04-20',
                        '- [ ] task 4 🛫 2022-04-25',
                    ],
                    expectedResult: [
                        '- [ ] task 1', // reference: https://publish.obsidian.md/tasks/Queries/Filters#Start+Date
                        '- [ ] task 2 🛫 2022-04-15',
                    ],
                },
            ],
            [
                'by scheduled date (before)',
                {
                    filters: ['scheduled before 2022-04-20'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 ⏳ 2022-04-15',
                        '- [ ] task 3 ⏳ 2022-04-20',
                        '- [ ] task 4 ⏳ 2022-04-25',
                    ],
                    expectedResult: ['- [ ] task 2 ⏳ 2022-04-15'],
                },
            ],
            [
                'by scheduled date (before) uppercase',
                {
                    filters: ['SCHEDULED BEFORE 2022-04-20'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 ⏳ 2022-04-15',
                        '- [ ] task 3 ⏳ 2022-04-20',
                        '- [ ] task 4 ⏳ 2022-04-25',
                    ],
                    expectedResult: ['- [ ] task 2 ⏳ 2022-04-15'],
                },
            ],
            [
                'by done date (before)',
                {
                    filters: ['done before 2022-12-23'],
                    tasks: [
                        '- [ ] I am done before filter, and should pass ✅ 2022-12-01',
                        '- [ ] I have no done date, so should fail',
                    ],
                    expectedResult: ['- [ ] I am done before filter, and should pass ✅ 2022-12-01'],
                },
            ],
            [
                'by done date (before) uppercase',
                {
                    filters: ['DONE BEFORE 2022-12-23'],
                    tasks: [
                        '- [ ] I am done before filter, and should pass ✅ 2022-12-01',
                        '- [ ] I have no done date, so should fail',
                    ],
                    expectedResult: ['- [ ] I am done before filter, and should pass ✅ 2022-12-01'],
                },
            ],
        ])('should support filtering %s', (_, { tasks: allTaskLines, filters, expectedResult }) => {
            shouldSupportFiltering(filters, allTaskLines, expectedResult);
        });
    });

    describe('filtering with "happens"', () => {
        type HappensCase = {
            description: string;
            happensFilter: string;

            due?: string;
            scheduled?: string;
            start?: string;
            done?: string;

            taskShouldMatch: boolean;
        };

        const HappensCases: Array<HappensCase> = [
            // Assumptions made:
            // - That the date-parsing is valid, and we do not need to validate dates

            // ----------------------------------------------------------------
            // Simple date checks - using 'on'
            {
                description: 'on: should match if due matches',
                happensFilter: 'happens on 2012-03-04',
                due: '2012-03-04',
                taskShouldMatch: true,
            },
            {
                description: 'on: should match if scheduled matches',
                happensFilter: 'happens on 2012-03-04',
                scheduled: '2012-03-04',
                taskShouldMatch: true,
            },
            {
                description: 'on: should match if start matches',
                happensFilter: 'happens on 2012-03-04',
                start: '2012-03-04',
                taskShouldMatch: true,
            },
            {
                description: 'on: the on keyword should be optional',
                happensFilter: 'happens 2012-03-04',
                start: '2012-03-04',
                taskShouldMatch: true,
            },

            // ----------------------------------------------------------------
            // Ignores 'done' date
            {
                description: 'on: should not match if only done date matches',
                happensFilter: 'happens on 2012-03-04',
                done: '2012-03-04',
                taskShouldMatch: false,
            },

            // ----------------------------------------------------------------
            // 'before'
            {
                description: 'before: should match if a date is before specified date',
                happensFilter: 'happens before 2012-03-04',
                start: '2012-03-02',
                taskShouldMatch: true,
            },
            {
                description: 'before: should not match if a date is on specified date',
                happensFilter: 'happens before 2012-03-04',
                start: '2012-03-04',
                taskShouldMatch: false,
            },
            {
                description: 'before: should not match if a date is after specified date',
                happensFilter: 'happens before 2012-03-04',
                start: '2012-03-05',
                taskShouldMatch: false,
            },

            // ----------------------------------------------------------------
            // 'after'
            {
                description: 'after: should match if a date is after specified date',
                happensFilter: 'happens after 2012-03-04',
                start: '2012-03-05',
                taskShouldMatch: true,
            },
            {
                description: 'after: should not match if a date is on specified date',
                happensFilter: 'happens after 2012-03-04',
                start: '2012-03-04',
                taskShouldMatch: false,
            },
            {
                description: 'after: should not match if a date is before specified date',
                happensFilter: 'happens after 2012-03-04',
                start: '2012-03-03',
                taskShouldMatch: false,
            },

            // ----------------------------------------------------------------
            // multiple date values
            {
                description: 'multiple dates in task: should match if any date matches',
                happensFilter: 'happens on 2012-03-04',
                due: '2012-03-04',
                scheduled: '2012-03-05',
                start: '2012-03-06',
                taskShouldMatch: true,
            },
        ];

        test.concurrent.each<HappensCase>(HappensCases)(
            'filters via "happens" correctly (%j)',
            ({ happensFilter, due, scheduled, start, done, taskShouldMatch }) => {
                // Arrange
                const line = [
                    '- [ ] this is a task',
                    !!start && `🛫 ${start}`,
                    !!scheduled && `⏳ ${scheduled}`,
                    !!due && `📅 ${due}`,
                    !!done && `✅ ${done}`,
                ]
                    .filter(Boolean)
                    .join(' ');

                const expectedResult: Array<string> = [];
                if (taskShouldMatch) {
                    expectedResult.push(line);
                }

                // Act, Assert
                shouldSupportFiltering([happensFilter], [line], expectedResult);
            },
        );
    });

    describe('filtering with boolean operators', () => {
        test.concurrent.each<[string, FilteringCase]>([
            [
                'simple OR',
                {
                    filters: ['"has due date" OR (description includes special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                },
            ],
            [
                'simple OR UpperCase',
                {
                    filters: ['"HAS DUE DATE" OR (DESCRIPTION INCLUDES special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] task 3 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                },
            ],
            [
                'simple AND',
                {
                    filters: ['(has start date) AND "description includes some"'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20'],
                },
            ],
            [
                'simple AND UpperCase',
                {
                    filters: ['(HAS START DATE) AND "DESCRIPTION INCLUDES some"'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20'],
                },
            ],
            [
                'simple AND NOT',
                {
                    filters: ['(has start date) AND NOT (description includes some)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] any task 3 🛫 2022-04-20'],
                },
            ],
            [
                'simple AND NOT UpperCase',
                {
                    filters: ['(HAS START DATE) AND NOT (DESCRIPTION INCLUDES some)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] any task 3 🛫 2022-04-20'],
                },
            ],
            [
                'simple OR NOT',
                {
                    filters: ['(has start date) OR NOT (description includes special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                    ],
                },
            ],
            [
                'simple OR NOT UpperCase',
                {
                    filters: ['(HAS START DATE) OR NOT (DESCRIPTION INCLUDES special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                    ],
                },
            ],
            [
                'simple XOR',
                {
                    filters: ['(has start date) XOR (description includes special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] special task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] any task 3 🛫 2022-04-20', '- [ ] special task 4'],
                },
            ],
            [
                'simple XOR UpperCase',
                {
                    filters: ['(HAS START DATE) XOR (DESCRIPTION INCLUDES special)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] special task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] any task 3 🛫 2022-04-20', '- [ ] special task 4'],
                },
            ],
            [
                'simple NOT',
                {
                    filters: ['NOT (has start date)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] special task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] task 1', '- [ ] special task 4'],
                },
            ],
            [
                'simple NOT UpperCase',
                {
                    filters: ['NOT (HAS START DATE)'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] special task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: ['- [ ] task 1', '- [ ] special task 4'],
                },
            ],
            [
                'AND-first composition',
                {
                    filters: ['(has start date) AND ((description includes some) OR (has due date))'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                    ],
                },
            ],
            [
                'AND-first composition UpperCase',
                {
                    filters: ['(HAS START DATE) AND ((DESCRIPTION INCLUDES some) OR (HAS DUE DATE))'],
                    tasks: [
                        '- [ ] task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4',
                    ],
                    expectedResult: [
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                    ],
                },
            ],
            [
                'OR-first composition',
                {
                    filters: ['(has start date) OR ((description includes special) AND (has due date))'],
                    tasks: [
                        '- [ ] special task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                },
            ],
            [
                'OR-first composition UpperCase',
                {
                    filters: ['(HAS START DATE) OR ((DESCRIPTION INCLUDES special) AND (HAS DUE DATE))'],
                    tasks: [
                        '- [ ] special task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                    expectedResult: [
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                },
            ],
            [
                'NOT-first composition',
                {
                    filters: ['NOT ((has start date) OR (description includes special))'],
                    tasks: [
                        '- [ ] regular task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                    expectedResult: ['- [ ] regular task 1'],
                },
            ],
            [
                'NOT-first composition UpperCase',
                {
                    filters: ['NOT ((HAS START DATE) OR (DESCRIPTION INCLUDES special))'],
                    tasks: [
                        '- [ ] regular task 1',
                        '- [ ] some task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
                        '- [ ] any task 3 🛫 2022-04-20',
                        '- [ ] any task 4 🛫 2022-04-20 📅 2022-04-20',
                        '- [ ] special task 4 📅 2022-04-20',
                    ],
                    expectedResult: ['- [ ] regular task 1'],
                },
            ],
        ])('should support boolean filtering %s', (_, { tasks: allTaskLines, filters, expectedResult }) => {
            shouldSupportFiltering(filters, allTaskLines, expectedResult);
        });
    });

    describe('filtering with code-based custom filters', () => {
        it('should allow a Filter to be added', () => {
            // Arrange
            const filterOrErrorMessage = new DescriptionField().createFilterOrErrorMessage('description includes xxx');
            expect(filterOrErrorMessage).toBeValid();
            const query = new Query('');
            expect(query.filters.length).toEqual(0);

            // Act
            query.addFilter(filterOrErrorMessage.filter!);

            // Assert
            expect(query.filters.length).toEqual(1);
        });
    });

    describe('SearchInfo', () => {
        it('should pass SearchInfo through to filter functions', () => {
            // Arrange
            const same1 = new TaskBuilder().description('duplicate').build();
            const same2 = new TaskBuilder().description('duplicate').build();
            const different = new TaskBuilder().description('different').build();
            const allTasks = [same1, same2, different];

            const moreThanOneTaskHasThisDescription = (task: Task, searchInfo: SearchInfo) => {
                return searchInfo.allTasks.filter((t) => t.description === task.description).length > 1;
            };
            const filter = FilterOrErrorMessage.fromFilter(
                new Filter('stuff', moreThanOneTaskHasThisDescription, new Explanation('explanation of stuff')),
            );

            // Act, Assert
            const searchInfo = SearchInfo.fromAllTasks(allTasks);
            expect(filter).toMatchTaskWithSearchInfo(same1, searchInfo);
            expect(filter).toMatchTaskWithSearchInfo(same2, searchInfo);
            expect(filter).not.toMatchTaskWithSearchInfo(different, searchInfo);
        });

        it('should pass the query path through to filter functions', () => {
            // Arrange
            const queryPath = 'this/was/passed/in/correctly.md';
            const query = new Query('', queryPath);

            const matchesIfSearchInfoHasCorrectPath = (_task: Task, searchInfo: SearchInfo) => {
                return searchInfo.queryPath === queryPath;
            };
            query.addFilter(
                new Filter('instruction', matchesIfSearchInfoHasCorrectPath, new Explanation('explanation')),
            );

            // Act
            const task = new TaskBuilder().build();
            const results = query.applyQueryToTasks([task]);

            // Assert
            // The task will match if the correct path.
            expect(results.totalTasksCount).toEqual(1);
        });
    });

    describe('sorting', () => {
        const doneTask = new TaskBuilder().status(Status.DONE).build();
        const todoTask = new TaskBuilder().status(Status.TODO).build();

        it('sort reverse returns -0 for equal tasks', () => {
            // This test was added when I discovered that reverse sort returns
            // -0 for equivalent tasks.
            // This is a test to demonstrate that current behevaiour,
            // rather than a test of the **required** behaviour.
            // If the behaviour changes and '0' is returned instead of '-0',
            // that is absolutely fine.
            const query = new Query('sort by status reverse');
            const sorter = query.sorting[0];

            expect(sorter!.comparator(todoTask, doneTask)).toEqual(1);
            expect(sorter!.comparator(doneTask, doneTask)).toEqual(-0); // Note the minus sign. It's a consequence of
            expect(sorter!.comparator(doneTask, todoTask)).toEqual(-1);
        });
    });

    describe('comments', () => {
        it('ignores comments', () => {
            // Arrange
            const source = '# I am a comment, which will be ignored';
            const query = new Query(source);

            // Assert
            expect(query.error).toBeUndefined();
        });
    });

    describe('explanations', () => {
        afterEach(() => {
            GlobalFilter.getInstance().reset();
        });

        it('should explain 0 filters', () => {
            const source = '';
            const query = new Query(source);

            const expectedDisplayText = 'No filters supplied. All tasks will match the query.';
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain 1 filter', () => {
            const source = 'description includes hello';
            const query = new Query(source);

            const expectedDisplayText = `description includes hello
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain 2 filters', () => {
            const source = 'description includes hello\ndue 2012-01-23';
            const query = new Query(source);

            const expectedDisplayText = `description includes hello

due 2012-01-23 =>
  due date is on 2012-01-23 (Monday 23rd January 2012)
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should include any error message in the explanation', () => {
            const source = 'i am a nonsense query';
            const query = new Query(source);

            const expectedDisplayText = `Query has an error:
do not understand query
Problem line: "i am a nonsense query"
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain limit 5', () => {
            const source = 'limit 5';
            const query = new Query(source);

            const expectedDisplayText = `No filters supplied. All tasks will match the query.

At most 5 tasks.
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain limit 1', () => {
            const source = 'limit 1';
            const query = new Query(source);

            const expectedDisplayText = `No filters supplied. All tasks will match the query.

At most 1 task.
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain limit 0', () => {
            const source = 'limit 0';
            const query = new Query(source);

            const expectedDisplayText = `No filters supplied. All tasks will match the query.

At most 0 tasks.
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain group limit 4', () => {
            const source = 'limit groups 4';
            const query = new Query(source);

            const expectedDisplayText = `No filters supplied. All tasks will match the query.

At most 4 tasks per group (if any "group by" options are supplied).
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });

        it('should explain all limit options', () => {
            const source = 'limit 127\nlimit groups to 8 tasks';
            const query = new Query(source);

            const expectedDisplayText = `No filters supplied. All tasks will match the query.

At most 127 tasks.


At most 8 tasks per group (if any "group by" options are supplied).
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });
    });

    // This tests the parsing of 'group by' instructions.
    // Group.test.ts tests the actual grouping code.
    describe('grouping instructions', () => {
        it('should default to ungrouped', () => {
            // Arrange
            const source = '';
            const query = new Query(source);

            // Assert
            expect(query.grouping.length).toEqual(0);
        });

        it('should parse a supported group command without error', () => {
            // Arrange
            const source = 'group by path';
            const query = new Query(source);
            const queryUpper = new Query(source.toUpperCase());

            // Assert
            expect(query.error).toBeUndefined();
            expect(queryUpper.error).toBeUndefined();

            expect(query.grouping.length).toEqual(1);
            expect(queryUpper.grouping.length).toEqual(1);
        });

        it('should work with a custom group that uses query information', () => {
            // Arrange
            const source = 'group by function query.file.path';
            const sourceUpper = 'GROUP BY FUNCTION query.file.path';

            const query = new Query(source, 'hello.md');
            const queryUpper = new Query(sourceUpper, 'hello.md');

            // Act
            const results = query.applyQueryToTasks([new TaskBuilder().build()]);
            const resultsUpper = queryUpper.applyQueryToTasks([new TaskBuilder().build()]);

            // Assert
            const groups = results.taskGroups;
            const groupsUpper = resultsUpper.taskGroups;

            expect(groups.groups.length).toEqual(1);
            expect(groupsUpper.groups.length).toEqual(1);

            expect(groups.groups[0].groups).toEqual(['hello.md']);
            expect(groupsUpper.groups[0].groups).toEqual(['hello.md']);
        });

        it('should log meaningful error for supported group type', () => {
            // Arrange
            const source = 'group by xxxx';
            const sourceUpper = source.toUpperCase();

            const query = new Query(source);
            const queryUpperr = new Query(sourceUpper);

            // Assert
            // Check that the error message contains the actual problem line
            expect(query.error).toContain(source);
            expect(queryUpperr.error).toContain(sourceUpper);

            expect(query.grouping.length).toEqual(0);
            expect(queryUpperr.grouping.length).toEqual(0);
        });

        it('should apply limit correctly, after sorting tasks', () => {
            // Arrange
            const source = `
                # sorting by status will move the incomplete tasks first
                sort by status

                # grouping by status will give two groups: Done and Todo
                group by status

                # Apply a limit, to test which tasks make it to
                limit 2
                `;
            const sourceUpper = source.toUpperCase();
            const query = new Query(source);
            const queryUpper = new Query(sourceUpper);

            const tasksAsMarkdown = `
- [x] Task 1 - should not appear in output
- [x] Task 2 - should not appear in output
- [ ] Task 3 - will be sorted to 1st place, so should pass limit
- [ ] Task 4 - will be sorted to 2nd place, so should pass limit
- [ ] Task 5 - should not appear in output
- [ ] Task 6 - should not appear in output
            `;

            const tasks = createTasksFromMarkdown(tasksAsMarkdown, 'some_markdown_file', 'Some Heading');

            // Act
            const queryResult = query.applyQueryToTasks(tasks);
            const queryUpperResult = queryUpper.applyQueryToTasks(tasks);

            // Assert
            expect(queryResult.groups.length).toEqual(1);
            expect(queryUpperResult.groups.length).toEqual(1);

            const soleTaskGroup = queryResult.groups[0];
            const soleTaskGroupUpper = queryUpperResult.groups[0];
            const expectedTasks = `
- [ ] Task 3 - will be sorted to 1st place, so should pass limit
- [ ] Task 4 - will be sorted to 2nd place, so should pass limit
`;
            expect('\n' + soleTaskGroup.tasksAsStringOfLines()).toStrictEqual(expectedTasks);
            expect('\n' + soleTaskGroupUpper.tasksAsStringOfLines()).toStrictEqual(expectedTasks);

            expect(queryResult.taskGroups.totalTasksCount()).toEqual(2);
            expect(queryUpperResult.taskGroups.totalTasksCount()).toEqual(2);

            expect(queryResult.totalTasksCountBeforeLimit).toEqual(6);
            expect(queryUpperResult.totalTasksCountBeforeLimit).toEqual(6);
        });

        it('should apply group limit correctly, after sorting tasks', () => {
            // Arrange
            const source = `
                # sorting by description will sort the tasks alphabetically
                sort by description

                # grouping by status will give two groups: Done and Todo
                group by status

                # Apply a limit, to test which tasks make it to
                limit groups 3
                `;
            const sourceUpper = source.toUpperCase();
            const query = new Query(source);
            const queryUpper = new Query(sourceUpper);

            const tasksAsMarkdown = `
- [x] Task 2 - will be in the first group and sorted after next one
- [x] Task 1 - will be in the first group
- [ ] Task 4 - will be sorted to 2nd place in the second group and pass the limit
- [ ] Task 6 - will be sorted to 4th place in the second group and NOT pass the limit
- [ ] Task 3 - will be sorted to 1st place in the second group and pass the limit
- [ ] Task 5 - will be sorted to 3nd place in the second group and pass the limit
            `;

            const tasks = createTasksFromMarkdown(tasksAsMarkdown, 'some_markdown_file', 'Some Heading');

            // Act
            const queryResult = query.applyQueryToTasks(tasks);
            const queryUpperResult = queryUpper.applyQueryToTasks(tasks);

            // Assert
            expect(queryResult.groups.length).toEqual(2);
            expect(queryUpperResult.groups.length).toEqual(2);

            expect(queryResult.totalTasksCount).toEqual(5);
            expect(queryUpperResult.totalTasksCount).toEqual(5);

            expect(queryResult.groups[0].tasksAsStringOfLines()).toMatchInlineSnapshot(`
                "- [x] Task 1 - will be in the first group
                - [x] Task 2 - will be in the first group and sorted after next one
                "
            `);
            expect(queryUpperResult.groups[0].tasksAsStringOfLines()).toMatchInlineSnapshot(`
                "- [x] Task 1 - will be in the first group
                - [x] Task 2 - will be in the first group and sorted after next one
                "
            `);

            expect(queryResult.groups[1].tasksAsStringOfLines()).toMatchInlineSnapshot(`
                "- [ ] Task 3 - will be sorted to 1st place in the second group and pass the limit
                - [ ] Task 4 - will be sorted to 2nd place in the second group and pass the limit
                - [ ] Task 5 - will be sorted to 3nd place in the second group and pass the limit
                "
            `);
            expect(queryUpperResult.groups[1].tasksAsStringOfLines()).toMatchInlineSnapshot(`
                "- [ ] Task 3 - will be sorted to 1st place in the second group and pass the limit
                - [ ] Task 4 - will be sorted to 2nd place in the second group and pass the limit
                - [ ] Task 5 - will be sorted to 3nd place in the second group and pass the limit
                "
            `);

            expect(queryResult.taskGroups.totalTasksCount()).toEqual(5);
            expect(queryUpperResult.taskGroups.totalTasksCount()).toEqual(5);

            expect(queryResult.totalTasksCountBeforeLimit).toEqual(6);
            expect(queryUpperResult.totalTasksCountBeforeLimit).toEqual(6);
        });
    });

    describe('error handling', () => {
        it('should catch an exception that occurs during searching', () => {
            // Arrange
            const source = 'filter by function wibble';
            const query = new Query(source);
            const queryUpper = new Query(source.toUpperCase());
            const task = TaskBuilder.createFullyPopulatedTask();

            // Act
            const queryResult = query.applyQueryToTasks([task]);
            const queryResultUpper = queryUpper.applyQueryToTasks([task]);

            // Assert
            expect(queryResult.searchErrorMessage).toEqual(
                'Error: Search failed.\nThe error message was:\n    "ReferenceError: wibble is not defined"',
            );
            expect(queryResultUpper.searchErrorMessage).toEqual(
                'Error: Search failed.\nThe error message was:\n    "ReferenceError: WIBBLE is not defined"',
            );
        });
    });

    describe('line continuations', () => {
        it('should work in group by functions', () => {
            const source = String.raw`group by function \
                const date = task.due.moment; \
                const now = moment(); \
                const label = (order, name) => '%%'+order+'%% =='+name+'=='; \
                if (!date) return label(4, 'Undated'); \
                if (date.isBefore(now, 'day')) return label(1, 'Overdue'); \
                if (date.isSame(now, 'day')) return label(2, 'Today'); \
                return label(3, 'Future');`;
            const query = new Query(source);
            expect(query.error).toBeUndefined();
        });
        it('should be explained correctly in boolean queries', () => {
            const source = String.raw`explain
(description includes line 1) OR        \
  (description includes line 1 continued\
with \ backslash)`;
            const query = new Query(source);

            const expectedDisplayText = String.raw`(description includes line 1) OR (description includes line 1 continued with \ backslash) =>
  OR (At least one of):
    description includes line 1
    description includes line 1 continued with \ backslash
`;
            expect(query.explainQuery()).toEqual(expectedDisplayText);
        });
    });
});
