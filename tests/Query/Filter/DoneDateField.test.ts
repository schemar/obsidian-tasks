/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { DoneDateField } from '../../../src/Query/Filter/DoneDateField';
import type { FilterOrErrorMessage } from '../../../src/Query/Filter/Filter';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { testFilter } from '../../TestingTools/FilterTestHelpers';
import { toHaveExplanation } from '../../CustomMatchers/CustomMatchersForFilters';
import { expectTaskComparesAfter, expectTaskComparesBefore } from '../../CustomMatchers/CustomMatchersForSorting';
import { Sort } from '../../../src/Query/Sort';

window.moment = moment;

expect.extend({
    toHaveExplanation,
});

function testTaskFilterForTaskWithDoneDate(filter: FilterOrErrorMessage, doneDate: string | null, expected: boolean) {
    const builder = new TaskBuilder();
    testFilter(filter, builder.doneDate(doneDate), expected);
}

describe('done date', () => {
    it('by done date presence', () => {
        // Arrange
        const filter = new DoneDateField().createFilterOrErrorMessage('has done date');

        // Act, Assert
        testTaskFilterForTaskWithDoneDate(filter, null, false);
        testTaskFilterForTaskWithDoneDate(filter, '2022-04-15', true);
    });

    it('by done date absence', () => {
        // Arrange
        const filter = new DoneDateField().createFilterOrErrorMessage('no done date');

        // Act, Assert
        testTaskFilterForTaskWithDoneDate(filter, null, true);
        testTaskFilterForTaskWithDoneDate(filter, '2022-04-15', false);
    });
});

describe('explain done date queries', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2022, 0, 15)); // 2022-01-15
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should explain date before', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is before 2023-01-02 (Monday 2nd January 2023)');
    });

    it('should explain date with explicit on', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done on 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });

    it('should explain date with implicit on', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });

    it('should show value of relative dates', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done after today');
        expect(filterOrMessage).toHaveExplanation('done date is after 2022-01-15 (Saturday 15th January 2022)');
    });
});

describe('sorting by done', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new DoneDateField();
        expect(field.supportsSorting()).toEqual(true);
    });

    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is done in DueDateField.test.ts.

    const date1 = new TaskBuilder().doneDate('2021-01-12').build();
    const date2 = new TaskBuilder().doneDate('2022-12-23').build();

    it('sort by done', () => {
        expectTaskComparesBefore(Sort.makeLegacySorting(false, 1, 'done'), date1, date2);
    });

    it('sort by done reverse', () => {
        expectTaskComparesAfter(Sort.makeLegacySorting(true, 1, 'done'), date1, date2);
    });
});
