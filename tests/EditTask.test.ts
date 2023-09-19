/**
 * @jest-environment jsdom
 */
import { type RenderResult, fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it } from '@jest/globals';
import moment from 'moment';
import { taskFromLine } from '../src/Commands/CreateOrEditTaskParser';
import type { Task } from '../src/Task';
import EditTask from '../src/ui/EditTask.svelte';
import { Status } from '../src/Status';
import { DateFallback } from '../src/DateFallback';
import { GlobalFilter } from '../src/Config/GlobalFilter';
import { resetSettings, updateSettings } from '../src/Config/Settings';
import { verifyAllCombinations3Async } from './TestingTools/CombinationApprovalsAsync';

window.moment = moment;
const statusOptions: Status[] = [Status.DONE, Status.TODO];

/**
 * Construct an onSubmit function for editing the given task, and when Apply is clicked,
 * returning the edit task(s) converted to a string.
 * @param task
 */
function constructSerialisingOnSubmit(task: Task) {
    let resolvePromise: (input: string) => void;
    const waitForClose = new Promise<string>((resolve, _) => {
        resolvePromise = resolve;
    });

    const onSubmit = (updatedTasks: Task[]): void => {
        const serializedTask = DateFallback.removeInferredStatusIfNeeded(task, updatedTasks)
            .map((task: Task) => task.toFileLineString())
            .join('\n');
        resolvePromise(serializedTask);
    };

    return { waitForClose, onSubmit };
}

function renderAndCheckModal(task: Task, onSubmit: (updatedTasks: Task[]) => void) {
    const result: RenderResult<EditTask> = render(EditTask, { task, statusOptions, onSubmit });
    const { container } = result;
    expect(() => container).toBeTruthy();
    return { result, container };
}

function getAndCheckRenderedDescriptionElement(container: HTMLElement): HTMLInputElement {
    const renderedDescription = container.ownerDocument.getElementById('description') as HTMLInputElement;
    expect(() => renderedDescription).toBeTruthy();
    return renderedDescription;
}

function getAndCheckApplyButton(result: RenderResult<EditTask>): HTMLButtonElement {
    const submit = result.getByText('Apply') as HTMLButtonElement;
    expect(submit).toBeTruthy();
    return submit;
}

async function editDescriptionAndSubmit(
    description: HTMLInputElement,
    newDescription: string,
    submit: HTMLButtonElement,
    waitForClose: Promise<string>,
): Promise<string> {
    await fireEvent.input(description, { target: { value: newDescription } });
    submit.click();
    return await waitForClose;
}

function convertDescriptionToTaskLine(taskDescription: string): string {
    return `- [ ] ${taskDescription}`;
}

/**
 * Simulate the behaviour of:
 *   - clicking on a line in Obsidian,
 *   - opening the Edit task modal,
 *   - optionally editing the description,
 *   - and clicking Apply.
 * @param line
 * @param newDescription - the new value for the description field. if undefined, the description won't be edited.
 * @returns The the edited task line
 */
async function editTaskLine(line: string, newDescription: string | undefined) {
    const task = taskFromLine({ line: line, path: '' });
    const { waitForClose, onSubmit } = constructSerialisingOnSubmit(task);
    const { result, container } = renderAndCheckModal(task, onSubmit);

    const description = getAndCheckRenderedDescriptionElement(container);
    const submit = getAndCheckApplyButton(result);

    let adjustedNewDescription = newDescription ? newDescription : description!.value;
    if (!adjustedNewDescription) {
        adjustedNewDescription = 'simulate user typing text in to empty description field';
    }

    return await editDescriptionAndSubmit(description, adjustedNewDescription, submit, waitForClose);
}

describe('Task rendering', () => {
    afterEach(() => {
        GlobalFilter.reset();
    });

    function testDescriptionRender(taskDescription: string, expectedDescription: string) {
        const task = taskFromLine({ line: convertDescriptionToTaskLine(taskDescription), path: '' });

        const onSubmit = (_: Task[]): void => {};
        const { container } = renderAndCheckModal(task, onSubmit);

        const renderedDescription = getAndCheckRenderedDescriptionElement(container);
        expect(renderedDescription!.value).toEqual(expectedDescription);
    }

    it('should display task description (empty Global Filter)', () => {
        testDescriptionRender('important thing #todo', 'important thing #todo');
    });

    it('should display task description without non-tag Global Filter)', () => {
        GlobalFilter.set('filter');
        testDescriptionRender('filter important thing', 'important thing');
    });

    it('should display task description with complex non-tag Global Filter)', () => {
        GlobalFilter.set('filter');
        // This behavior is inconsistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('filter/important thing', 'filter/important thing');
    });

    it('should display task description without tag-like Global Filter', () => {
        GlobalFilter.set('#todo');
        testDescriptionRender('#todo another plan', 'another plan');
    });

    it('should display task description with complex tag-like Global Filter', () => {
        GlobalFilter.set('#todo');
        // This behavior is inconsistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('#todo/important another plan', '#todo/important another plan');
    });

    it('should display task description with emoji removed, when global filter is in initial line', () => {
        GlobalFilter.set('#todo');
        testDescriptionRender(
            '#todo with global filter and with scheduled date ⏳ 2023-06-13',
            'with global filter and with scheduled date',
        );
    });

    it('should display task description with emoji removed, even if the global filter is missing from initial line (bug 2037)', () => {
        GlobalFilter.set('#todo');
        // When written, this was a demonstration of the behaviour logged in
        // https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2037
        testDescriptionRender(
            'without global filter but with scheduled date ⏳ 2023-06-13',
            'without global filter but with scheduled date', // fails, as the absence of the global filter means the line is not parsed, and the emoji stays in the description.
        );
    });
});

describe('Task editing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-07-18'));
    });

    afterEach(() => {
        GlobalFilter.reset();
        resetSettings();
        jest.useRealTimers();
    });

    async function testDescriptionEdit(taskDescription: string, newDescription: string, expectedDescription: string) {
        const line = convertDescriptionToTaskLine(taskDescription);
        const editedTask = await editTaskLine(line, newDescription);
        expect(editedTask).toEqual(`- [ ] ${expectedDescription}`);
    }

    it('should keep task description if it was not edited (Empty Global Filter)', async () => {
        const description = 'simple task #remember';
        await testDescriptionEdit(description, description, description);
    });

    it('should change task description if it was edited (Empty Global Filter)', async () => {
        await testDescriptionEdit('simple task #remember', 'another', 'another');
    });

    it('should not change the description if the task was not edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const description = 'simple task';
        GlobalFilter.set(globalFilter);
        await testDescriptionEdit(`${globalFilter} ${description}`, description, `${globalFilter} ${description}`);
    });

    it('should change the description if the task was edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const oldDescription = 'simple task';
        const newDescription = 'new plan';
        GlobalFilter.set(globalFilter);
        await testDescriptionEdit(
            `${globalFilter} ${oldDescription}`,
            newDescription,
            `${globalFilter} ${newDescription}`,
        );
    });

    // TODO Put in own describe block - with better name
    // TODO Add explanatory comments
    describe('issues', () => {
        verifyAllCombinations3Async<string, boolean, string>(
            // TODO Better name
            '2112',
            'KEY: (globalFilter, set created date)\n',
            async (globalFilter, setCreatedDate, initialTaskLine) => {
                GlobalFilter.set(globalFilter as string);

                // @ts-expect-error: TS2322: Type 'T2' is not assignable to type 'boolean | undefined'.
                updateSettings({ setCreatedDate });

                // @ts-expect-error: TS2345: Argument of type 'T3' is not assignable to parameter of type 'string'.
                const editedTaskLine = await editTaskLine(initialTaskLine, undefined);

                return `
('${globalFilter}', ${setCreatedDate})
    '${initialTaskLine}' =>
    '${editedTaskLine}'`;
            },
            ['', '#task'],
            [false, true],
            [
                // Force line break TODO Remove line
                '',
                'plain text, not a list item',
                '-',
                '- ',
                '- [ ]',
                '- [ ] ',
                '- list item, but no checkbox',
                '- [ ] list item with checkbox',
                '- [ ] list item with checkbox and created date ➕ 2023-01-01',
            ],
        );
    });
});
