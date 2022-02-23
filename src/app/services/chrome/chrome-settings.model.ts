export interface ChromeSettingsModel {
    pollingRate?: number;
    urlFilter?: string[];
}

export enum ChromeSettingsKey {
    PollingRate ='pollingRate',
    UrlFilter = 'urlFilter'
}
