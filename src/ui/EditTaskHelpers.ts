import { capitalizeFirstLetter } from '../lib/StringHelpers';
import { Recurrence } from '../Task/Recurrence';
import type { EditableTask } from './EditableTask';

/**
 * Returns contents for a `<label>` HTML element.
 *
 * If the {@link accessKey} is found in the label text (case-insensitive), it will be given `accesskey` class
 * within a `<span>` HTML element. Else the access key will be added at the end of the label text,
 * surrounded with round brackets.
 *
 * The first letter of the label will be capitalised.
 *
 * @param labelText to be displayed in the <label> HTML element.
 * @param accessKey optional access key. Set to null if not needed.
 */
export function labelContentWithAccessKey(labelText: string, accessKey: string | null) {
    if (accessKey === null) {
        return capitalizeFirstLetter(labelText);
    }

    const accessKeyIndex = labelText.toLowerCase().indexOf(accessKey.toLowerCase());
    if (accessKeyIndex === -1) {
        return `${capitalizeFirstLetter(labelText)} (<span class="accesskey">${accessKey.toLowerCase()}</span>)`;
    }

    let labelContent = labelText.substring(0, accessKeyIndex);
    labelContent += '<span class="accesskey">';

    if (accessKeyIndex === 0) {
        labelContent += labelText.substring(accessKeyIndex, accessKeyIndex + 1).toUpperCase();
    } else {
        labelContent += labelText.substring(accessKeyIndex, accessKeyIndex + 1);
    }

    labelContent += '</span>';
    labelContent += labelText.substring(accessKeyIndex + 1);
    labelContent = capitalizeFirstLetter(labelContent);
    return labelContent;
}

export function parseAndValidateRecurrence(editableTask: EditableTask) {
    // NEW_TASK_FIELD_EDIT_REQUIRED
    if (!editableTask.recurrenceRule) {
        return { parsedRecurrence: '<i>not recurring</>', isRecurrenceValid: true };
    }

    const recurrenceFromText = Recurrence.fromText({
        recurrenceRuleText: editableTask.recurrenceRule,
        // Only for representation in the modal, no dates required.
        startDate: null,
        scheduledDate: null,
        dueDate: null,
        reminderDate: null,
    })?.toText();

    if (!recurrenceFromText) {
        return { parsedRecurrence: '<i>invalid recurrence rule</i>', isRecurrenceValid: false };
    }

    if (editableTask.startDate || editableTask.scheduledDate || editableTask.dueDate || editableTask.reminderDate) {
        return { parsedRecurrence: recurrenceFromText, isRecurrenceValid: true };
    }

    return { parsedRecurrence: '<i>due, scheduled, reminder or start date required</i>', isRecurrenceValid: false };
}
