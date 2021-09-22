export interface Settings {
    globalFilter: string;
    removeGlobalFilter: boolean;
    makeDatesBacklinks: boolean;
    dueDateMarker: string;
    doneDateMarker: string;
    recurrenceMarker: string;
}

export const defaultSettings: Settings = {
    globalFilter: '',
    removeGlobalFilter: false,
    makeDatesBacklinks: false,
    dueDateMarker: '📅',
    doneDateMarker: '✅',
    recurrenceMarker: '🔁',
};

export const dueDateMarkerDefaultAlternatives = '📅📆🗓';

let settings: Settings = { ...defaultSettings };

export const getSettings = (): Settings => {
    return { ...settings };
};

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
    settings = { ...settings, ...newSettings };

    return getSettings();
};
