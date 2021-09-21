import { Editor, MarkdownView, View } from 'obsidian';

import { Task } from '../Task';

export const toggleDone = (checking: boolean, editor: Editor, view: View) => {
    if (checking) {
        if (!(view instanceof MarkdownView)) {
            // If we are not in a markdown view, the command shouldn't be shown.
            return false;
        }

        // The command should always trigger in a markdown view:
        // - Convert lines to list items.
        // - Convert list items to tasks.
        // - Toggle tasks' status.
        return true;
    }

    if (!(view instanceof MarkdownView)) {
        // Should never happen due to check above.
        return;
    }

    // We are certain we are in the editor due to the check above.
    const path = view.file?.path;
    if (path === undefined) {
        return;
    }

    const cursorPosition = editor.getCursor();
    const lineNumber = cursorPosition.line;
    const line = editor.getLine(lineNumber);

    const toggledLine = toggleLine({ line, path });
    editor.setLine(lineNumber, toggledLine);

    // The cursor is moved to the end of the line by default.
    // If there is text on the line, put the cursor back where it was on the line.
    if (/[^ [\]*-]/.test(toggledLine)) {
        editor.setCursor({
            line: cursorPosition.line,
            // Need to move the cursor by the distance we added to the beginning.
            ch: cursorPosition.ch + toggledLine.length - line.length,
        });
    }
};

const toggleLine = ({ line, path }: { line: string; path: string }): string => {
    let toggledLine: string = line;

    const task = Task.fromLine({
        line,
        path,
        sectionStart: 0, // We don't need this to toggle it here in the editor.
        sectionIndex: 0, // We don't need this to toggle it here in the editor.
        precedingHeader: null, // We don't need this to toggle it here in the editor.
        headings: [],
    });
    if (task !== null) {
        toggledLine = toggleTask({ task });
    } else {
        // If the task is null this means that we have one of:
        // 1. a regular checklist item
        // 2. a list item
        // 3. a simple text line

        // The task regex will match checklist items.
        const regexMatch = line.match(Task.taskRegex);
        if (regexMatch !== null) {
            toggledLine = toggleChecklistItem({ regexMatch });
        } else {
            // This is not a checklist item. It is one of:
            // 1. a list item
            // 2. a simple text line

            const listItemRegex = /^([\s\t]*)([-*])/;
            if (listItemRegex.test(line)) {
                // Let's convert the list item to a checklist item.
                toggledLine = line.replace(listItemRegex, '$1$2 [ ]');
            } else {
                // Let's convert the line to a list item.
                toggledLine = line.replace(/^([\s\t]*)/, '$1- ');
            }
        }
    }

    return toggledLine;
};

const toggleTask = ({ task }: { task: Task }): string => {
    // Toggle a regular task.
    const toggledTasks = task.toggle();
    const serialized = toggledTasks
        .map((task: Task) => task.toFileLineString())
        .join('\n');

    return serialized;
};

const toggleChecklistItem = ({
    regexMatch,
}: {
    regexMatch: RegExpMatchArray;
}): string => {
    // It's a checklist item, let's toggle it.
    const indentation = regexMatch[1];
    const statusString = regexMatch[2].toLowerCase();
    const body = regexMatch[3];

    const toggledStatusString = statusString === ' ' ? 'x' : ' ';

    const toggledLine = `${indentation}- [${toggledStatusString}] ${body}`;

    return toggledLine;
};
