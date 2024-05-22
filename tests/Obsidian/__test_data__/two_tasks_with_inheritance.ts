export const two_tasks_with_inheritance = {
    filePath: 'Test Data/two_tasks_with_inheritance.md',
    fileContents: '- [ ] #task parent task\n    - [ ] #task child task\n\n',
    cachedMetadata: {
        tags: [
            {
                position: {
                    start: {
                        line: 0,
                        col: 6,
                        offset: 6,
                    },
                    end: {
                        line: 0,
                        col: 11,
                        offset: 11,
                    },
                },
                tag: '#task',
            },
            {
                position: {
                    start: {
                        line: 1,
                        col: 10,
                        offset: 34,
                    },
                    end: {
                        line: 1,
                        col: 15,
                        offset: 39,
                    },
                },
                tag: '#task',
            },
        ],
        sections: [
            {
                type: 'list',
                position: {
                    start: {
                        line: 0,
                        col: 0,
                        offset: 0,
                    },
                    end: {
                        line: 1,
                        col: 26,
                        offset: 50,
                    },
                },
            },
        ],
        listItems: [
            {
                position: {
                    start: {
                        line: 0,
                        col: 0,
                        offset: 0,
                    },
                    end: {
                        line: 0,
                        col: 23,
                        offset: 23,
                    },
                },
                parent: -1,
                task: ' ',
            },
            {
                position: {
                    start: {
                        line: 1,
                        col: 2,
                        offset: 26,
                    },
                    end: {
                        line: 1,
                        col: 26,
                        offset: 50,
                    },
                },
                parent: 0,
                task: ' ',
            },
        ],
    },
};
