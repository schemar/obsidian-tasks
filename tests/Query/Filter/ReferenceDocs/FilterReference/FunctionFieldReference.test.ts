/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { evaluateExpression } from '../../../../../src/Query/Filter/FunctionField';
import { Status } from '../../../../../src/Status';

import { TaskBuilder } from '../../../../TestingTools/TaskBuilder';
import { MarkdownTable } from '../../../../TestingTools/VerifyMarkdownTable';

window.moment = moment;

function formatToRepresentType(x: any) {
    if (typeof x === 'string') {
        return "'" + x + "'";
    }
    // TODO Round numbers
    // TODO Format string arrays - can I use 'toString()'?
    // TODO Fix display of 2 spaces as `'  '` - which appears as a single space. <pre></pre> gets the spacing OK, but line is too tall
    return x;
}

function addBackticks(x: any) {
    return '`' + x + '`';
}

function determineExpression(value: any) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `${typeof value[0]}[]`;
        } else {
            return 'any[]';
        }
    }
    return typeof value;
}

// TODO Show a task in a callout, or an ordered list
// TODO Also create an empty task, and combine its types together with that of the populated one - to find any types that could be none/null/undefined

describe('task', () => {
    function verifyFieldDataForReferenceDocs(fields: string[]) {
        const markdownTable = new MarkdownTable(['Field', 'Type 1', 'Example 1', 'Type 2', 'Example 2']);
        const task1 = TaskBuilder.createFullyPopulatedTask();
        const task2 = new TaskBuilder().description('minimal task').status(Status.makeInProgress()).build();
        for (const field of fields) {
            // TODO better type label for string[] (tags)
            const value1 = evaluateExpression(task1, field);
            const value2 = evaluateExpression(task2, field);
            const cells = [
                addBackticks(field),
                addBackticks(determineExpression(value1)),
                addBackticks(formatToRepresentType(value1)),
                addBackticks(determineExpression(value2)),
                addBackticks(formatToRepresentType(value2)),
            ];
            markdownTable.addRow(cells);
        }
        markdownTable.verifyForDocs();
    }

    // TODO Show which fields may be null

    it('status', () => {
        verifyFieldDataForReferenceDocs([
            'task.status.name',
            'task.status.type',
            'task.status.symbol',
            'task.status.nextStatusSymbol',
        ]);
    });

    it('dates', () => {
        verifyFieldDataForReferenceDocs([
            // TODO Replace these with values that can be released - TasksDate probably
            'task.status.createdDate',
            'task.createdDate',
            'task.startDate',
            'task.scheduledDate',
            'task.dueDate',
            'task.doneDate',
        ]);
    });

    it('other fields', () => {
        // TODO Recurrence
        verifyFieldDataForReferenceDocs([
            'task.description',
            'task.priority',
            'task.urgency',
            'task.tags',
            'task.indentation',
            'task.listMarker',
            'task.blockLink',
            'task.originalMarkdown',
        ]);
    });

    it('file properties', () => {
        // TODO Replace this with values that can be published
        // TODO Create task.file
        verifyFieldDataForReferenceDocs(['task.path', 'task.filename', 'task.lineNumber', 'task.precedingHeader']);
    });
});
