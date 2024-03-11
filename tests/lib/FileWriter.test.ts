const newLineChar = '\n';
function appendToEndOfFile(initialContent: string, textToAppend: string) {
    if (textToAppend.length === 0) {
        return initialContent;
    }
    let result = initialContent;
    if (result.length > 0 && !result.endsWith(newLineChar)) {
        result += newLineChar;
    }
    result += textToAppend + newLineChar;
    return result;
}

describe('FileWriter', () => {
    it('should be able to append to an empty file', () => {
        const initialContent = '';
        const textToAppend = '- [ ] a sample task';
        const newFile = appendToEndOfFile(initialContent, textToAppend);
        expect(newFile).toEqual(textToAppend + '\n');
    });

    it('should be able to append to a non-empty file', () => {
        const initialContent = '- [ ] an existing task\n';
        const textToAppend = '- [ ] a new sample task';
        const newFile = appendToEndOfFile(initialContent, textToAppend);
        const expectedOutput = `- [ ] an existing task
- [ ] a new sample task
`;
        expect(newFile).toEqual(expectedOutput);
    });

    it('should append a newline to initial content if needed', () => {
        const initialContent = '- [ ] an existing task';
        const textToAppend = '- [ ] a new sample task';
        const newFile = appendToEndOfFile(initialContent, textToAppend);
        const expectedOutput = `- [ ] an existing task
- [ ] a new sample task
`;
        expect(newFile).toEqual(expectedOutput);
    });

    it('should not modify file if appending an empty string', () => {
        const initialContent = '- [ ] an existing task';
        const textToAppend = '';
        const newFile = appendToEndOfFile(initialContent, textToAppend);
        expect(newFile).toEqual(initialContent);
    });
});

// the above code and tests were written while pairing with Clare 2024-03-11
// I wrote following afterward

describe('ListWriter', () => {
    it('should be able to append to an existing list', () => {
        const initialContent = `
## Lorem ipsum
Lorem ipsum dolor sit amet, consectetur adipisci elit, sed
eiusmod tempor incidunt ut labore et dolore magna aliqua.
## Tasks ToBeDone
- [ ] a sample task
## Completed tasks
- [-] a sample completed task
## Another heading
Sed ipsam libero qui consequuntur quaerat non atque quia ab praesentium explicabo.
`;
        const expectedContent = `
## Lorem ipsum
Lorem ipsum dolor sit amet, consectetur adipisci elit, sed
eiusmod tempor incidunt ut labore et dolore magna aliqua.
## Tasks ToBeDone
- [ ] a sample task
## Completed tasks
- [-] a completed task to move to named list
- [-] a sample completed task
## Another heading
Sed ipsam libero qui consequuntur quaerat non atque quia ab praesentium explicabo.
`;
        const targetListHeading = '## Completed tasks';
        const textToAppend = '- [-] a completed task to move to named list';
        const newFile = appendToListWithinFile(initialContent, targetListHeading, textToAppend);
        expect(newFile).toEqual(expectedContent);
    });

    it('it should create new list (if one does not exist) with text at bottom of note', () => {
        const initialContent = `
## Lorem ipsum
Lorem ipsum dolor sit amet, consectetur adipisci elit, sed
eiusmod tempor incidunt ut labore et dolore magna aliqua.
## Tasks ToBeDone
- [ ] a sample task
## Another heading
Sed ipsam libero qui consequuntur quaerat non atque quia ab praesentium explicabo.
`;
        const expectedContent = `
## Lorem ipsum
Lorem ipsum dolor sit amet, consectetur adipisci elit, sed
eiusmod tempor incidunt ut labore et dolore magna aliqua.
## Tasks ToBeDone
- [ ] a sample task
## Another heading
Sed ipsam libero qui consequuntur quaerat non atque quia ab praesentium explicabo.
## Completed tasks
- [-] a completed task to move to named list
`;
        const targetListHeading = '## Completed tasks';
        const textToAppend = '- [-] a completed task to move to named list';
        const newFile = appendToListWithinFile(initialContent, targetListHeading, textToAppend);
        expect(newFile).toEqual(expectedContent);
    });
});

function appendToListWithinFile(initialContent: string, targetListHeading: string, textToAppend: string) {
    if (textToAppend.length === 0) {
        return initialContent;
    }
    let result = initialContent;
    if (result.length > 0 && !result.endsWith(newLineChar)) {
        result += newLineChar;
    }
    const linesArray = initialContent.split('\n');
    const headingLine = linesArray.indexOf(targetListHeading);
    if (headingLine === -1) {
        result += targetListHeading + newLineChar + textToAppend + newLineChar;
    } else {
        let newLines = linesArray.slice(0, headingLine + 1);
        newLines.push(textToAppend);
        newLines = newLines.concat(linesArray.slice(headingLine + 1, -1));
        result = newLines.join(newLineChar) + newLineChar;
    }
    return result;
}