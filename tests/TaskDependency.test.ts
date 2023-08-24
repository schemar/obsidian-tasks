import { Task } from '../src/Task';
import { TaskBuilder } from './TestingTools/TaskBuilder';

function ensureTaskHasId(childTask: Task) {
    let newChild = childTask;
    if (childTask.id === '') {
        const id = 'abcdef';
        newChild = new Task({ ...childTask, id });
    }
    return newChild;
}

function setDependenciesOnTasksWithIds(parentTask: Task, childTasksWithIds: Task[]): Task {
    const newDependsOn = childTasksWithIds.map((task) => {
        return task.id;
    });
    let newParent = parentTask;
    if (parentTask.dependsOn.toString() !== newDependsOn.toString()) {
        newParent = new Task({ ...parentTask, dependsOn: newDependsOn });
    }

    return newParent;
}

function addDependency(parentTask: Task, childTask: Task) {
    const newChild = ensureTaskHasId(childTask);

    let newParent = parentTask;
    if (!parentTask.dependsOn.includes(newChild.id)) {
        const newDependsOn = [...parentTask.dependsOn, newChild.id];
        newParent = new Task({ ...parentTask, dependsOn: newDependsOn });
    }

    return [newParent, newChild];
}

function removeDependency(parentTask: Task, childTask: Task) {
    let newParent = parentTask;
    if (parentTask.dependsOn.includes(childTask.id)) {
        const newDependsOn = parentTask.dependsOn.filter((dependsOn) => dependsOn !== childTask.id);
        newParent = new Task({ ...parentTask, dependsOn: newDependsOn });
    }

    return [newParent, childTask];
}

describe('TaskDependency', () => {
    it('Should add id to task without id', () => {
        const task = new TaskBuilder().build();

        const newTask = ensureTaskHasId(task);

        expect(newTask.id).not.toEqual('');
    });

    it('Should return original task if it already has id', () => {
        const task = new TaskBuilder().id('abc123').build();

        const newTask = ensureTaskHasId(task);

        expect(newTask === task).toEqual(true);
    });

    it('Should add dependency on existing id', () => {
        const childTask = new TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder().description('parent task').build();

        const [newParent, newChild] = addDependency(parentTask, childTask);

        expect(parentTask.dependsOn).toEqual([]);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newChild.id).toEqual('123456');
        expect(newChild === childTask).toEqual(true);
    });

    it('Should not create a duplicate dependency', () => {
        const childTask = new TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder().dependsOn(['123456']).description('parent task').build();

        const [newParent, newChild] = addDependency(parentTask, childTask);

        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newChild.id).toEqual('123456');
        expect(newChild === childTask).toEqual(true);
        expect(newParent === parentTask).toEqual(true);
    });

    it('Should add an id to a child task with no id', () => {
        const childTask = new TaskBuilder().build();
        const parentTask = new TaskBuilder().description('parent task').build();

        const [newParent, newChild] = addDependency(parentTask, childTask);

        expect(newChild.id).not.toEqual('');
        expect(newParent.dependsOn).toEqual([newChild.id]);
    });

    it('Should remove a dependency', () => {
        const childTask = new TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder().dependsOn(['123456']).description('parent task').build();

        const [newParent, newChild] = removeDependency(parentTask, childTask);

        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual([]);
        expect(childTask.id).toEqual('123456');
        expect(newChild.id).toEqual('123456');
        expect(newChild === childTask).toEqual(true);
    });

    it('Should make task depend on 3 child tasks', () => {
        const childTask1 = new TaskBuilder().id('123456').build();
        const childTask2 = new TaskBuilder().id('234567').build();
        const childTask3 = new TaskBuilder().id('345678').build();
        const parentTask = new TaskBuilder().description('parent task').dependsOn(['012345']).build();

        const newParent = setDependenciesOnTasksWithIds(parentTask, [childTask1, childTask2, childTask3]);

        expect(parentTask.dependsOn).toEqual(['012345']);
        expect(newParent.dependsOn).toEqual(['123456', '234567', '345678']);
    });

    it('Should not create a duplicate dependency', () => {
        const childTask = new TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder().dependsOn(['123456']).description('parent task').build();

        const newParent = setDependenciesOnTasksWithIds(parentTask, [childTask]);

        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newParent === parentTask).toEqual(true);
    });
});
