/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { toHaveExplanation } from '../../CustomMatchers/CustomMatchersForFilters';
import { StartDateField } from '../../../src/Query/Filter/StartDateField';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { expectTaskComparesAfter, expectTaskComparesBefore } from '../../CustomMatchers/CustomMatchersForSorting';
import { currentPeriodsTestArray, testFilter } from '../../TestingTools/FilterTestHelpers';

window.moment = moment;

expect.extend({
    toHaveExplanation,
});

describe('explain start date queries', () => {
    it('should explain explicit date', () => {
        const filterOrMessage = new StartDateField().createFilterOrErrorMessage('starts before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation(
            'start date is before 2023-01-02 (Monday 2nd January 2023) OR no start date',
        );
    });

    it('implicit "on" gets added to explanation, and it is clear that start date is optional', () => {
        const filterOrMessage = new StartDateField().createFilterOrErrorMessage('starts 2023-01-02');
        expect(filterOrMessage).toHaveExplanation(
            'start date is on 2023-01-02 (Monday 2nd January 2023) OR no start date',
        );
    });
});

describe('sorting by start', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new StartDateField();
        expect(field.supportsSorting()).toEqual(true);
    });

    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is done in DueDateField.test.ts.

    const date1 = new TaskBuilder().startDate('2021-01-12').build();
    const date2 = new TaskBuilder().startDate('2022-12-23').build();

    it('sort by start', () => {
        expectTaskComparesBefore(new StartDateField().createNormalSorter(), date1, date2);
    });

    it('sort by start reverse', () => {
        expectTaskComparesAfter(new StartDateField().createReverseSorter(), date1, date2);
    });
});

describe('start date', () => {
    it('in current week/month/year', () => {
        currentPeriodsTestArray.forEach((p) => {
            const filter = new StartDateField().createFilterOrErrorMessage('starts in current ' + p);

            // reference: https://obsidian-tasks-group.github.io/obsidian-tasks/queries/filters/#start-date
            testFilter(filter, new TaskBuilder().startDate(null), true);

            testFilter(filter, new TaskBuilder().startDate(moment().format('YYYY-MM-DD')), true);
            testFilter(filter, new TaskBuilder().startDate(moment().startOf(p).format('YYYY-MM-DD')), true);
            testFilter(filter, new TaskBuilder().startDate(moment().endOf(p).format('YYYY-MM-DD')), true);
            testFilter(
                filter,
                new TaskBuilder().startDate(moment().startOf(p).subtract(1, 'second').format('YYYY-MM-DD')),
                false,
            );
            testFilter(
                filter,
                new TaskBuilder().startDate(moment().endOf(p).add(1, 'second').format('YYYY-MM-DD')),
                false,
            );
        });
    });
});
