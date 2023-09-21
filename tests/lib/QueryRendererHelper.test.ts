/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { Query } from '../../src/Query/Query';
import { explainResults, getQueryForQueryRenderer } from '../../src/lib/QueryRendererHelper';
import { GlobalFilter } from '../../src/Config/GlobalFilter';
import { GlobalQuery } from '../../src/Config/GlobalQuery';

window.moment = moment;

describe('explain', () => {
    afterEach(() => {
        GlobalFilter.reset();
    });

    it('should explain a task', () => {
        const source = '';
        const query = new Query({ source });

        const expectedDisplayText = `Explanation of this Tasks code block query:

No filters supplied. All tasks will match the query.`;

        expect(explainResults(query.source, new GlobalQuery())).toEqual(expectedDisplayText);
    });

    it('should explain a task with global filter active', () => {
        GlobalFilter.set('#task');

        const source = '';
        const query = new Query({ source });

        const expectedDisplayText = `Only tasks containing the global filter '#task'.

Explanation of this Tasks code block query:

No filters supplied. All tasks will match the query.`;
        expect(explainResults(query.source, new GlobalQuery())).toEqual(expectedDisplayText);
    });

    it('should explain a task with global query active', () => {
        const globalQuery = new GlobalQuery('description includes hello');

        const source = '';
        const query = new Query({ source });

        const expectedDisplayText = `Explanation of the global query:

description includes hello

Explanation of this Tasks code block query:

No filters supplied. All tasks will match the query.`;

        expect(explainResults(query.source, globalQuery)).toEqual(expectedDisplayText);
    });

    it('should explain a task with global query and global filter active', () => {
        const globalQuery = new GlobalQuery('description includes hello');
        GlobalFilter.set('#task');

        const source = '';
        const query = new Query({ source });

        const expectedDisplayText = `Only tasks containing the global filter '#task'.

Explanation of the global query:

description includes hello

Explanation of this Tasks code block query:

No filters supplied. All tasks will match the query.`;

        expect(explainResults(query.source, globalQuery)).toEqual(expectedDisplayText);
    });

    it('should explain a task with global query set but ignored without the global query', () => {
        const globalQuery = new GlobalQuery('description includes hello');

        const source = 'ignore global query';
        const query = new Query({ source });

        const expectedDisplayText = `Explanation of this Tasks code block query:

No filters supplied. All tasks will match the query.`;

        expect(explainResults(query.source, globalQuery)).toEqual(expectedDisplayText);
    });
});

/**
 * @note Test suite deliberately omits any tests on the functionality of the query the QueryRenderer uses.
 *       Since it is just running a Query, we defer to the Query tests. We just check that we're getting
 *       the right query.
 */
describe('query used for QueryRenderer', () => {
    it('should be the result of combining the global query and the actual query', () => {
        // Arrange
        const querySource = 'description includes world';
        const globalQuerySource = 'description includes hello';
        const filePath = 'a/b/c.md';

        // Act
        const globalQuery = new GlobalQuery(globalQuerySource);
        const query = getQueryForQueryRenderer(querySource, globalQuery, filePath);

        // Assert
        expect(query.source).toEqual(`${globalQuerySource}\n${querySource}`);
    });

    it('should ignore the global query if "ignore global query" is set', () => {
        // Arrange
        const filePath = 'a/b/c.md';
        const globalQuery = new GlobalQuery('path includes from_global_query');

        // Act
        const query = getQueryForQueryRenderer(
            'description includes from_block_query\nignore global query',
            globalQuery,
            filePath,
        );

        // Assert
        expect(query.source).toEqual('description includes from_block_query\nignore global query');
    });
});
