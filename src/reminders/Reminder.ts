import type { Moment } from 'moment';
import { getSettings } from '../Config/Settings';

export class ReminderSettings {
    notificationTitle: string = 'Task Reminders';
    dateTimeFormat: string = 'YYYY-MM-DD h:mm a';
    dateFormat: string = 'YYYY-MM-DD';
    dailyReminderTime: string = '09:00 am';
    refreshInterval: number = 10 * 1000; // Miliseconds (> 60 seconds is not recommended)

    constructor() {}
}

export class ReminderList {
    public reminders: Reminder[];

    constructor(times: Reminder[] | null) {
        this.reminders = times ?? [];
    }

    public toString(): string {
        return this.reminders.map((reminder) => `${reminder.toString()}`).join(', ');
    }

    // TODO only used in ReminderDateField need way to teal with modal multiple reminders
    public peek(): Moment | null {
        if (this.reminders.length === 0) {
            return null;
        }
        return this.reminders[0].time;
    }
}

enum ReminderType {
    Date,
    DateTime,
}

export class Reminder {
    public time: Moment;
    public type: ReminderType;

    constructor(time: Moment, type?: ReminderType) {
        this.time = time;
        this.type = type ?? ReminderType.Date;
    }

    public toString(): string {
        const reminderSettings = getSettings().reminderSettings;
        if (this.type === ReminderType.Date) {
            return this.time.format(reminderSettings.dateFormat);
        }
        return this.time.format(reminderSettings.dateTimeFormat);
    }
}

export function parseDateTime(dateTime: string): Reminder {
    const reminderSettings = getSettings().reminderSettings;
    const reminder = window.moment(dateTime, reminderSettings.dateTimeFormat);
    if (reminder.format('h:mm a') === '12:00 am') {
        //aka .startOf(day) which is the default time for reminders
        return new Reminder(reminder, ReminderType.Date);
    } else {
        return new Reminder(reminder, ReminderType.DateTime);
    }
}
