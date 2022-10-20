/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { DoneDateField } from '../../../src/Query/Filter/DoneDateField';
import type { FilterOrErrorMessage } from '../../../src/Query/Filter/Filter';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { testFilter } from '../../TestingTools/FilterTestHelpers';
import { toHaveExplanation } from '../../CustomMatchers/CustomMatchersForFilters';

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
    it('should explain date before', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is before 2023-01-02');
    });

    it('should explain date with explicit on', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done on 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is 2024-01-02');
    });

    it('should explain date with implicit on', () => {
        const filterOrMessage = new DoneDateField().createFilterOrErrorMessage('done 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is 2024-01-02');
    });
});
