<script lang='ts'>
    import chrono from 'chrono-node';
    import { RRule } from 'rrule';
    import { onMount } from 'svelte';
    import { getSettings } from '../Settings';
    import { Status, Task } from '../Task';


    export let task: Task;
    export let onSubmit: (updatedTasks: Task[]) => void | Promise<void>;

    let descriptionInput: HTMLInputElement;
    let editableTask: {
        description: string;
        status: Status;
        recurrenceRule: string;
        dueDate: string;
        doneDate: string;
    } = {
        description: '',
        status: Status.Todo,
        recurrenceRule: '',
        dueDate: '',
        doneDate: '',
    };

    let parsedDueDate: string = '';
    let parsedRRule: string = '';
    let parsedDone: string = '';

    const { 
        doneDateMarker,
        dueDateMarker,
        recurrenceMarker,
    } = getSettings();

    $: {
        if (!editableTask.dueDate) {
            parsedDueDate = '<i>no due date</>'
        } else {
            const parsed = chrono.parseDate(editableTask.dueDate, new Date(), { forwardDate: true });
            if (parsed !== null) {
                parsedDueDate = window.moment(parsed).format('YYYY-MM-DD');
            } else {
                parsedDueDate = '<i>invalid due date</i>'
            }
        }
    }

    $: {
        if (!editableTask.recurrenceRule) {
            parsedRRule = '<i>not recurring</>'
        } else {
            try {
                parsedRRule = RRule.fromText(editableTask.recurrenceRule).toText();
            } catch {
                parsedRRule = '<i>invalid recurrence rule</i>'
            }
        }
    }

    $: {
        if (!editableTask.doneDate) {
            parsedDone = '<i>no done date</i>'
        } else {
            const parsed = chrono.parseDate(editableTask.doneDate);
            if (parsed !== null) {
                parsedDone = window.moment(parsed).format('YYYY-MM-DD');
            } else {
                parsedDone = '<i>invalid done date</i>'
            }
        }
    }

    onMount(() => {
        const { globalFilter } = getSettings();
        const description = task.description.replace(globalFilter, '').replace('  ', ' ').trim();
        editableTask = {
            description,
            status: task.status,
            recurrenceRule: task.recurrenceRule ? task.recurrenceRule.toText() : '',
            dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : '',
            doneDate: task.doneDate ? task.doneDate.format('YYYY-MM-DD') : '',
         };
        setTimeout(() => {descriptionInput.focus();}, 10);
    });

    const _onSubmit = () => {
        const { globalFilter, makeDatesBacklinks } = getSettings();
        let description = editableTask.description.trim();
        if (!description.includes(globalFilter)) {
            description = globalFilter + ' ' + description;
        }

        let recurrenceRule: RRule | null = null;
        try {
            if (editableTask.recurrenceRule) {
                recurrenceRule = RRule.fromText(editableTask.recurrenceRule);
            }
        } catch {/*nothing to do*/}

        let dueDate: moment.Moment | null = null;
        const parsedDueDate = chrono.parseDate(editableTask.dueDate, new Date(), { forwardDate: true });
        if (parsedDueDate !== null) {
            dueDate = window.moment(parsedDueDate);
        }

        const updatedTask = new Task({
            ...task,
            description,
            status: editableTask.status,
            recurrenceRule,
            dueDate,
            dueDateBacklink: makeDatesBacklinks,
            doneDate: window.moment(editableTask.doneDate, 'YYYY-MM-DD').isValid() ? window.moment(editableTask.doneDate, 'YYYY-MM-DD') : null,
            doneDateBacklink: makeDatesBacklinks,
        });

        onSubmit([updatedTask]);
    };
</script>

<div class="tasks-modal">
    <form on:submit|preventDefault={_onSubmit}>
        <div class="tasks-modal-section">
            <label for="description">Description</label>
            <input bind:value={editableTask.description} bind:this={descriptionInput} id="description" type="text" class="tasks-modal-description" placeholder="Take out the trash" />
        </div>
        <hr />
        <div class="tasks-modal-section">
            <label for="due">Due</label>
            <input bind:value={editableTask.dueDate} id="due" type="text" placeholder="Try 'Monday' or 'tomorrow'." />
            <code>{@html dueDateMarker} {@html parsedDueDate}</code>
        </div>
        <hr />
        <div class="tasks-modal-section">
            <label for="recurrence">Recurrence</label>
            <input bind:value={editableTask.recurrenceRule} id="description" type="text" placeholder="Try 'every 2 weeks on Thursday'." />
            <code>{@html recurrenceMarker} {@html parsedRRule }</code>
        </div>
        <hr />
        <div class="tasks-modal-section">
            <div>
                Status:
                <input type="checkbox" class="task-list-item-checkbox tasks-modal-checkbox" checked={editableTask.status === Status.Done} disabled />
                <code>{editableTask.status}</code>
            </div>
            <div>
                Done on:
                <code>{@html parsedDone}</code>
            </div>
        </div>
        <hr />
        <div class="tasks-modal-section" />
        <div class="tasks-modal-section">
            <button type="submit" class="mod-cta">Apply</button>
        </div>
    </form>
</div>
