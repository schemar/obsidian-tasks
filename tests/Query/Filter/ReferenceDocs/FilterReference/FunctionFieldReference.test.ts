/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { evaluateExpression } from '../../../../../src/Query/Filter/FunctionField';

import { TaskBuilder } from '../../../../TestingTools/TaskBuilder';
import { MarkdownTable } from '../../../../TestingTools/VerifyMarkdownTable';

window.moment = moment;

function formatToRepresentType(x: any) {
    if (typeof x === 'string') {
        return "'" + x + "'";
    }
    return x;
}

describe('task', () => {
    function verifyFieldDataForReferenceDocs(fields: string[]) {
        const markdownTable = new MarkdownTable(['Field', 'Type', 'Example']);
        const task = TaskBuilder.createFullyPopulatedTask();
        for (const field of fields) {
            const x = evaluateExpression(task, field);
            const cells = [field, typeof x, formatToRepresentType(x)];
            markdownTable.addRow(cells);
        }
        markdownTable.verifyForDocs();
    }

    it('status', () => {
        const fields = ['task.status.name', 'task.status.type', 'task.status.symbol', 'task.status.nextStatusSymbol'];
        verifyFieldDataForReferenceDocs(fields);
    });
});
