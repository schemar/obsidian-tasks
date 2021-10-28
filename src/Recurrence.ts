import type { Moment } from 'moment';
import { RRule } from 'rrule';

export class Recurrence {
    private readonly rrule: RRule;
    private readonly startDate: Moment | null;
    private readonly scheduledDate: Moment | null;
    private readonly dueDate: Moment | null;

    /**
     * The reference date is used to calculate future occurences.
     *
     * Future occurences will recur based on the reference date.
     * The reference date is the due date, if it is given.
     * Otherwise the scheduled date, if it is given. And so on.
     *
     * Recurrence of all dates will be kept relative to the reference date.
     * For example: if the due date and the start date are given, the due date
     * is the reference date. Future occurrences will have a start date with the
     * same relative distance to the due date as the original task. For example
     * "starts one week before it is due".
     */
    private readonly referenceDate: Moment | null;

    constructor({
        rrule,
        referenceDate,
        startDate,
        scheduledDate,
        dueDate,
    }: {
        rrule: RRule;
        referenceDate: Moment | null;
        startDate: Moment | null;
        scheduledDate: Moment | null;
        dueDate: Moment | null;
    }) {
        this.rrule = rrule;
        this.referenceDate = referenceDate;
        this.startDate = startDate;
        this.scheduledDate = scheduledDate;
        this.dueDate = dueDate;
    }

    public static fromText({
        recurrenceRuleText,
        startDate,
        scheduledDate,
        dueDate,
    }: {
        recurrenceRuleText: string;
        startDate: Moment | null;
        scheduledDate: Moment | null;
        dueDate: Moment | null;
    }): Recurrence | null {
        try {
            const options = RRule.parseText(recurrenceRuleText);
            if (options !== null) {
                // Pick the reference date for recurrence based on importance.
                // Assuming due date has the highest priority.
                let referenceDate: Moment | null = null;
                // Clone the moment objects.
                if (dueDate) {
                    referenceDate = window.moment(dueDate);
                } else if (scheduledDate) {
                    referenceDate = window.moment(scheduledDate);
                } else if (startDate) {
                    referenceDate = window.moment(startDate);
                }

                if (referenceDate !== null) {
                    options.dtstart = window
                        .moment(referenceDate)
                        .startOf('day')
                        .utc(true)
                        .toDate();
                }

                const rrule = new RRule(options);
                return new Recurrence({
                    rrule,
                    referenceDate,
                    startDate,
                    scheduledDate,
                    dueDate,
                });
            }
        } catch (error) {
            // Could not read recurrence rule. User possibly not done typing.
        }

        return null;
    }

    public toText(): string {
        return this.rrule.toText();
    }

    /**
     * Returns the dates of the next occurrence or null if there is no next occurrence.
     */
    public next(): {
        startDate: Moment | null;
        scheduledDate: Moment | null;
        dueDate: Moment | null;
    } | null {
        // The next occurrence should happen based on the original reference
        // date if possible. Otherwise, base it on today.
        let after: Moment;
        if (this.referenceDate !== null) {
            // Clone to not alter the original reference date.
            after = window.moment(this.referenceDate);
        } else {
            after = window.moment();
        }

        after.endOf('day');
        after.utc(true);

        const next = this.rrule.after(after.toDate());

        if (next !== null) {
            // Re-add the timezone that RRule disregarded:
            const localTimeZone = window.moment.utc(next).local(true);
            const nextOccurrence = localTimeZone.startOf('day');

            // Keep the relative difference between the reference date and
            // start/scheduled/due.
            let startDate: Moment | null = null;
            let scheduledDate: Moment | null = null;
            let dueDate: Moment | null = null;

            // Only if a reference date is given. A reference date will exist if at
            // least one of the other dates is set.
            if (this.referenceDate) {
                if (this.startDate) {
                    const originalDifference = window.moment.duration(
                        this.startDate.diff(this.referenceDate),
                    );

                    // Cloning so that original won't be manipulated:
                    startDate = window.moment(nextOccurrence);
                    // Rounding days to handle cross daylight-savings-time recurrences.
                    startDate.add(
                        Math.round(originalDifference.asDays()),
                        'days',
                    );
                }
                if (this.scheduledDate) {
                    const originalDifference = window.moment.duration(
                        this.scheduledDate.diff(this.referenceDate),
                    );

                    // Cloning so that original won't be manipulated:
                    scheduledDate = window.moment(nextOccurrence);
                    // Rounding days to handle cross daylight-savings-time recurrences.
                    scheduledDate.add(
                        Math.round(originalDifference.asDays()),
                        'days',
                    );
                }
                if (this.dueDate) {
                    const originalDifference = window.moment.duration(
                        this.dueDate.diff(this.referenceDate),
                    );

                    // Cloning so that original won't be manipulated:
                    dueDate = window.moment(nextOccurrence);
                    // Rounding days to handle cross daylight-savings-time recurrences.
                    dueDate.add(
                        Math.round(originalDifference.asDays()),
                        'days',
                    );
                }
            }

            return {
                startDate,
                scheduledDate,
                dueDate,
            };
        }

        return null;
    }
}
