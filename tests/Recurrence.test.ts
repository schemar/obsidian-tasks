/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { parseMoment } from '../src/Reminders/Reminder';
import { Recurrence } from '../src/Recurrence';
import { TIME_FORMATS } from '../src/Config/Settings';
import { RecurrenceBuilder } from './TestingTools/RecurrenceBuilder';

jest.mock('obsidian');
window.moment = moment;

describe('Recurrence', () => {
    it('creates a recurring instance even if no date is given', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every week',
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next).toStrictEqual({
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            reminder: null,
        });
    });

    it('creates a recurrence the next month, even on the 31st', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every month',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2022-01-31').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2022-02-28'))).toStrictEqual(true);
    });

    it('creates a recurrence 3 months in', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every 3 months',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2022-01-31').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2022-04-30'))).toStrictEqual(true);
    });

    it('creates a recurrence the next month, even across years', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every 2 months',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2023-12-31').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2024-02-29'))).toStrictEqual(true);
    });

    it('creates a recurrence in 2 years, even on Feb 29th', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every 2 years',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2024-02-29').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2026-02-28'))).toStrictEqual(true);
    });

    it('creates a recurrence in 11 months, even on March 31', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every 11 months',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2020-03-31').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2021-02-28'))).toStrictEqual(true);
    });

    it('creates a recurrence in 13 months, even on Jan 31', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every 13 months',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2020-01-31').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        expect(next!.scheduledDate).toBeNull();
        expect(next!.dueDate!.isSame(moment('2021-02-28'))).toStrictEqual(true);
    });
});

// Test cases where a task has a non-existent due, scheduled or start date.
// Tests for invalid dates in the recurrence rules should go in a different section.
describe('Recurrence - with invalid dates in tasks', () => {
    it('does not create a recurrence if highest priority date is invalid', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every day',
            startDate: null,
            scheduledDate: null,
            dueDate: moment('2022-02-30').startOf('day'), // 30th February: invalid date
            reminder: null,
        });

        // Assert

        // Because the highest priority (reference) date in the task (due), was invalid,
        // it cannot construct the Recurrence instance.
        //
        // What this means in practice for users is that if they had an invalid
        // reference date on a recurring task, when the task is completed,
        // there will be no new instance, and the recurrence rule will be lost.
        expect(recurrence).toBeNull(); // Cannot calculated next date
    });

    it('creates a recurrence if a lower priority date is invalid', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every day',
            startDate: null,
            scheduledDate: moment('2022-02-30').startOf('day'), // 30th February: invalid date
            dueDate: moment('2022-02-27').startOf('day'),
            reminder: null,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(next!.startDate).toBeNull();
        // The original scheduled date was an illegal/invalid date.
        // So it is simply given the new value of the same date as the reference date,
        // which here is the due date.
        expect(next!.scheduledDate!.isSame(moment('2022-02-28'))).toStrictEqual(true); // date was invalid, so is given the value of highst oriority supplied date
        expect(next!.dueDate!.isSame(moment('2022-02-28'))).toStrictEqual(true);
    });
});

describe('identicalTo', () => {
    it('differing only in rule text', () => {
        const weekly = new RecurrenceBuilder().rule('every week').build();
        const daily = new RecurrenceBuilder().rule('every day').build();
        expect(weekly.identicalTo(daily)).toBe(false);
    });

    it('differing only in "when done"', () => {
        const weekly = new RecurrenceBuilder().rule('every week').build();
        const weeklyWhenDone = new RecurrenceBuilder().rule('every week when done').build();
        expect(weekly?.identicalTo(weeklyWhenDone)).toBe(false);
    });

    it('differing only in startDate', () => {
        // Two different dates
        const date1Recurrence = new RecurrenceBuilder().startDate('2021-10-21').build();

        const date2Recurrence = new RecurrenceBuilder().startDate('1998-03-13').build();

        const nullRecurrence = new RecurrenceBuilder().startDate(null).build();

        expect(date1Recurrence?.identicalTo(date1Recurrence)).toBe(true);
        expect(date1Recurrence?.identicalTo(date2Recurrence)).toBe(false);
        expect(date1Recurrence?.identicalTo(nullRecurrence)).toBe(false);
        expect(nullRecurrence?.identicalTo(date1Recurrence)).toBe(false);
    });

    it('differing only in scheduledDate', () => {
        // Two different dates
        // No need to replicate the null checks in startDate
        const date1Recurrence = new RecurrenceBuilder().scheduledDate('2021-10-21').build();

        const date2Recurrence = new RecurrenceBuilder().scheduledDate('1998-03-13').build();

        expect(date1Recurrence?.identicalTo(date1Recurrence)).toBe(true);
        expect(date1Recurrence?.identicalTo(date2Recurrence)).toBe(false);
    });

    it('differing only in dueDate', () => {
        // Two different dates
        // No need to replicate the null checks in startDate
        const date1Recurrence = new RecurrenceBuilder().dueDate('2021-10-21').build();

        const date2Recurrence = new RecurrenceBuilder().dueDate('1998-03-13').build();

        expect(date1Recurrence?.identicalTo(date1Recurrence)).toBe(true);
        expect(date1Recurrence?.identicalTo(date2Recurrence)).toBe(false);
    });

    it('differing only in reminder', () => {
        const date1Recurrence = new RecurrenceBuilder().reminders('2021-10-21').build();

        const date2Recurrence = new RecurrenceBuilder().reminders('1998-03-13').build();

        const nullRecurrence = new RecurrenceBuilder().reminders('').build();

        expect(date1Recurrence?.identicalTo(date1Recurrence)).toBe(true);
        expect(date1Recurrence?.identicalTo(date2Recurrence)).toBe(false);
        expect(date1Recurrence?.identicalTo(nullRecurrence)).toBe(false);
        expect(nullRecurrence?.identicalTo(date1Recurrence)).toBe(false);
    });
});

describe('Recurrence - with reminders', () => {
    it('creates a recurring instance with single 12h reminders', () => {
        // Arrange
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every week',
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            reminder: parseMoment(moment('2021-06-20 10:00 am', TIME_FORMATS.twelveHour)),
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(
            next!.reminder!.isSame(parseMoment(moment('2021-06-27 10:00 am', TIME_FORMATS.twelveHour))),
        ).toStrictEqual(true);
    });

    it('creates a recurring instance with single 24h reminders', () => {
        // Arrange
        const originalReminder = parseMoment(moment('2021-06-20 13:00', TIME_FORMATS.twentyFourHour));
        const originalReminderAsString = originalReminder.toString();
        const recurrence = Recurrence.fromText({
            recurrenceRuleText: 'every week',
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            reminder: originalReminder,
        });

        // Act
        const next = recurrence!.next();

        // Assert
        expect(
            next!.reminder!.isSame(parseMoment(moment('2021-06-27 13:00', TIME_FORMATS.twentyFourHour))),
        ).toStrictEqual(true);
        expect(next!.reminder!.toString()).toStrictEqual('2021-06-27 1:00 pm');

        // Confirm that the original date has not been modified
        expect(originalReminder.toString()).toStrictEqual(originalReminderAsString);
    });
});
