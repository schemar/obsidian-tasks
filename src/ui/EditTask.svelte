<script lang="ts">
    import { onMount } from 'svelte';

    import { TASK_FORMATS, getSettings } from '../Config/Settings';
    import type { Status } from '../Statuses/Status';
    import type { Task } from '../Task/Task';
    import DateEditor from './DateEditor.svelte';
    import Dependency from './Dependency.svelte';
    import { EditableTask } from './EditableTask';
    import { labelContentWithAccessKey } from './EditTaskHelpers';
    import RecurrenceEditor from './RecurrenceEditor.svelte';
    import StatusEditor from './StatusEditor.svelte';

    // These exported variables are passed in as props by TaskModal.onOpen():
    export let task: Task;
    export let onSubmit: (updatedTasks: Task[]) => void | Promise<void>;
    export let statusOptions: Status[];
    export let allTasks: Task[];

    const {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        prioritySymbols,
        startDateSymbol,
        scheduledDateSymbol,
        dueDateSymbol,
        cancelledDateSymbol,
        createdDateSymbol,
        doneDateSymbol,
    } = TASK_FORMATS.tasksPluginEmoji.taskSerializer.symbols;

    let descriptionInput: HTMLTextAreaElement;

    let editableTask = EditableTask.fromTask(task, allTasks);

    let isDescriptionValid: boolean = true;

    let isCancelledDateValid: boolean = true;
    let isCreatedDateValid: boolean = true;
    let isDoneDateValid: boolean = true;
    let isDueDateValid: boolean = true;
    let isScheduledDateValid: boolean = true;
    let isStartDateValid: boolean = true;

    let isRecurrenceValid: boolean = true;

    let withAccessKeys: boolean = true;
    let formIsValid: boolean = true;

    let mountComplete = false;

    const priorityOptions: {
        value: typeof editableTask.priority;
        label: string;
        symbol: string;
        accessKey: string;
        accessKeyIndex: number;
    }[] = [
        {
            value: 'lowest',
            label: 'Lowest',
            symbol: prioritySymbols.Lowest,
            accessKey: 'o',
            accessKeyIndex: 1,
        },
        {
            value: 'low',
            label: 'Low',
            symbol: prioritySymbols.Low,
            accessKey: 'l',
            accessKeyIndex: 0,
        },
        {
            value: 'none',
            label: 'Normal',
            symbol: prioritySymbols.None,
            accessKey: 'n',
            accessKeyIndex: 0,
        },
        {
            value: 'medium',
            label: 'Medium',
            symbol: prioritySymbols.Medium,
            accessKey: 'm',
            accessKeyIndex: 0,
        },
        {
            value: 'high',
            label: 'High',
            symbol: prioritySymbols.High,
            accessKey: 'h',
            accessKeyIndex: 0,
        },
        {
            value: 'highest',
            label: 'Highest',
            symbol: prioritySymbols.Highest,
            accessKey: 'i',
            accessKeyIndex: 1,
        },
    ];

    $: accesskey = (key: string) => (withAccessKeys ? key : null);
    $: formIsValid =
        isDueDateValid &&
        isRecurrenceValid &&
        isScheduledDateValid &&
        isStartDateValid &&
        isDescriptionValid &&
        isCancelledDateValid &&
        isCreatedDateValid &&
        isDoneDateValid;
    $: isDescriptionValid = editableTask.description.trim() !== '';

    onMount(() => {
        const { provideAccessKeys } = getSettings();
        withAccessKeys = provideAccessKeys;

        mountComplete = true;

        setTimeout(() => {
            descriptionInput.focus();
        }, 10);
    });

    const _onClose = () => {
        onSubmit([]);
    };

    const _onDescriptionKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            if (formIsValid) _onSubmit();
        }
    };

    // this is called, when text is pasted or dropped into
    // the description field, to remove any linebreaks
    const _removeLinebreaksFromDescription = () => {
        // wrapped into a timer to run after the paste/drop event
        setTimeout(() => {
            editableTask.description = editableTask.description.replace(/[\r\n]+/g, ' ');
        }, 0);
    };

    const _onSubmit = async () => {
        const newTasks = await editableTask.applyEdits(task, allTasks);
        onSubmit(newTasks);
    };
</script>

<!--
Availability of access keys:
- A: Start
- B: Before this
- C: Created
- D: Due
- E: After this
- F: Only future dates
- G:
- H: High
- I: Highest
- J:
- K:
- L: Low
- M: Medium
- N: Normal
- O: Lowest
- P:
- Q:
- R: Recurs
- S: Scheduled
- T: Description
- U: Status
- V:
- W:
- X: Done
- Y:
- Z:
- -: Cancelled
-->

<form class="tasks-modal" on:submit|preventDefault={_onSubmit}>
    <!-- NEW_TASK_FIELD_EDIT_REQUIRED -->

    <!-- --------------------------------------------------------------------------- -->
    <!--  Description  -->
    <!-- --------------------------------------------------------------------------- -->
    <section class="tasks-modal-description-section">
        <label for="description">{@html labelContentWithAccessKey('Description', accesskey('t'))}</label>
        <!-- svelte-ignore a11y-accesskey -->
        <textarea
            bind:value={editableTask.description}
            bind:this={descriptionInput}
            id="description"
            class="tasks-modal-description"
            placeholder="Take out the trash"
            accesskey={accesskey('t')}
            on:keydown={_onDescriptionKeyDown}
            on:paste={_removeLinebreaksFromDescription}
            on:drop={_removeLinebreaksFromDescription}
        />
    </section>

    <!-- --------------------------------------------------------------------------- -->
    <!--  Priority  -->
    <!-- --------------------------------------------------------------------------- -->
    <section class="tasks-modal-priority-section">
        <label for="priority-{editableTask.priority}">Priority</label>
        {#each priorityOptions as { value, label, symbol, accessKey, accessKeyIndex }}
            <div class="task-modal-priority-option-container">
                <!-- svelte-ignore a11y-accesskey -->
                <input
                    type="radio"
                    id="priority-{value}"
                    {value}
                    bind:group={editableTask.priority}
                    accesskey={accesskey(accessKey)}
                />
                <label for="priority-{value}">
                    <!-- These is no need to extract this behaviour to something like labelContentWithAccessKey(),
                    since this whole section will just go in a separate Svelte component and
                    will not be reused elsewhere like labelContentWithAccessKey(). -->
                    {#if withAccessKeys}
                        <span>{label.substring(0, accessKeyIndex)}</span><span class="accesskey"
                            >{label.substring(accessKeyIndex, accessKeyIndex + 1)}</span
                        ><span>{label.substring(accessKeyIndex + 1)}</span>
                    {:else}
                        <span>{label}</span>
                    {/if}
                    {#if symbol && symbol.charCodeAt(0) >= 0x100}
                        <span>{symbol}</span>
                    {/if}
                </label>
            </div>
        {/each}
    </section>

    <!-- --------------------------------------------------------------------------- -->
    <!--  Dates  -->
    <!-- --------------------------------------------------------------------------- -->
    <hr />
    <section class="tasks-modal-dates-section">
        <!-- --------------------------------------------------------------------------- -->
        <!--  Recurrence  -->
        <!-- --------------------------------------------------------------------------- -->
        <RecurrenceEditor {editableTask} bind:isRecurrenceValid accesskey={accesskey('r')} />
        <!-- --------------------------------------------------------------------------- -->
        <!--  Due Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="due"
            dateSymbol={dueDateSymbol}
            bind:date={editableTask.dueDate}
            bind:isDateValid={isDueDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('d')}
        />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Scheduled Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="scheduled"
            dateSymbol={scheduledDateSymbol}
            bind:date={editableTask.scheduledDate}
            bind:isDateValid={isScheduledDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('s')}
        />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Start Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="start"
            dateSymbol={startDateSymbol}
            bind:date={editableTask.startDate}
            bind:isDateValid={isStartDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('a')}
        />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Only future dates  -->
        <!-- --------------------------------------------------------------------------- -->
        <div class="future-dates-only">
            <label for="forwardOnly">{@html labelContentWithAccessKey('Only future dates:', accesskey('f'))}</label>
            <!-- svelte-ignore a11y-accesskey -->
            <input
                bind:checked={editableTask.forwardOnly}
                id="forwardOnly"
                type="checkbox"
                class="task-list-item-checkbox tasks-modal-checkbox"
                accesskey={accesskey('f')}
            />
        </div>
    </section>

    <!-- --------------------------------------------------------------------------- -->
    <!--  Dependencies  -->
    <!-- --------------------------------------------------------------------------- -->
    <hr />
    <section class="tasks-modal-dependencies-section">
        {#if allTasks.length > 0 && mountComplete}
            <!-- --------------------------------------------------------------------------- -->
            <!--  Blocked By Tasks  -->
            <!-- --------------------------------------------------------------------------- -->
            <Dependency
                type="blockedBy"
                labelText="Before this"
                {task}
                {editableTask}
                {allTasks}
                {_onDescriptionKeyDown}
                accesskey={accesskey('b')}
                placeholder="Search for tasks that the task being edited depends on..."
            />

            <!-- --------------------------------------------------------------------------- -->
            <!--  Blocking Tasks  -->
            <!-- --------------------------------------------------------------------------- -->
            <Dependency
                type="blocking"
                labelText="After this"
                {task}
                {editableTask}
                {allTasks}
                {_onDescriptionKeyDown}
                accesskey={accesskey('e')}
                placeholder="Search for tasks that depend on this task being done..."
            />
        {:else}
            <div><i>Blocking and blocked by fields are disabled when vault tasks is empty</i></div>
        {/if}
    </section>

    <hr />
    <section class="tasks-modal-dates-section">
        <!-- --------------------------------------------------------------------------- -->
        <!--  Status  -->
        <!-- --------------------------------------------------------------------------- -->
        <StatusEditor {task} bind:editableTask {statusOptions} accesskey={accesskey('u')} />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Created Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="created"
            dateSymbol={createdDateSymbol}
            bind:date={editableTask.createdDate}
            bind:isDateValid={isCreatedDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('c')}
        />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Done Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="done"
            dateSymbol={doneDateSymbol}
            bind:date={editableTask.doneDate}
            bind:isDateValid={isDoneDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('x')}
        />

        <!-- --------------------------------------------------------------------------- -->
        <!--  Cancelled Date  -->
        <!-- --------------------------------------------------------------------------- -->
        <DateEditor
            id="cancelled"
            dateSymbol={cancelledDateSymbol}
            bind:date={editableTask.cancelledDate}
            bind:isDateValid={isCancelledDateValid}
            forwardOnly={editableTask.forwardOnly}
            accesskey={accesskey('-')}
        />
    </section>

    <section class="tasks-modal-button-section">
        <button disabled={!formIsValid} type="submit" class="mod-cta">Apply </button>
        <button type="button" on:click={_onClose}>Cancel</button>
    </section>
</form>
