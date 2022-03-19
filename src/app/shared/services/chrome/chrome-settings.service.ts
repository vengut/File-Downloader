import { Injectable } from '@angular/core';
import {
    Observable,
    from,
    map,
    fromEventPattern,
    of,
    mergeMap,
    concat,
    bufferTime, 
    concatMap
} from 'rxjs';
import {ChromeSettingsKey, ChromeSettingsModel} from './chrome-settings.model';
import {isEqual} from "lodash";
import {SelectItemList} from "../../../settings/settings.model";

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    public static readonly INPUT_DEBOUNCE: number = 500;
    public static readonly DEFAULT_REFRESH_RATE: number = 3000;
    public static readonly MIN_REFRESH_RATE: number = 3000;
    public static readonly MAX_REFRESH_RATE: number = 30000;
    public static readonly STEP_REFRESH_RATE: number = 500;
    public static readonly DEFAULT_URL_FILTER_OPTIONS: SelectItemList = [
        { value: '.mp3', label: 'MP3', isSelected: true },
        { value: '.m3u8', label: 'HLS' },
        { value: '.mp4', label: 'MP4' }
    ];

    constructor() { }

    public getSettings(optionalRefreshRate?: number) {
        let refreshRateSubscription = this.getRefreshRate();

        if (optionalRefreshRate) {
            refreshRateSubscription = of(optionalRefreshRate);
        }

        return refreshRateSubscription
            .pipe(
                concatMap((refreshRate) => {
                    return concat(
                        from(getSyncStorage()),
                        this.getSettingsChanges(refreshRate)
                    );
                })
            );
    }

    public setUrlFilterOptions(newUrlFilterOptions: SelectItemList): Observable<SelectItemList> {
        return from(setUrlFilterOptions(newUrlFilterOptions));
    }

    public setRefreshRate(newRefreshRate: number): Observable<number> {
        return from(setRefreshRate(newRefreshRate));
    }

    public getUrlFilterOptions(): Observable<SelectItemList> {
        return from(getUrlFilterOptions());
    }

    public getRefreshRate(): Observable<number> {
        return from(getRefreshRate());
    }

    private getSettingsChanges(refreshRate: number) {
        return this.getStorageEventStream()
            .pipe(
                mergeMap(() => getSyncStorage()),
                bufferTime(refreshRate),
                map((changes) => changes.pop())
            );
    }

    private getStorageEventStream() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler)
        );
    }
}

export async function getSyncStorage(): Promise<ChromeSettingsModel> {
    const sync = await chrome.storage.sync.get();

    let urlFilterOptions = ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS;
    let refreshRate = ChromeSettingsService.DEFAULT_REFRESH_RATE;

    if (sync) {
        urlFilterOptions = sync[ChromeSettingsKey.UrlFilterOptions] ?? urlFilterOptions;
        refreshRate = sync[ChromeSettingsKey.RefreshRate] ?? refreshRate;
    }

    return {
        urlFilterOptions,
        refreshRate
    };
}

export async function getRefreshRate(): Promise<number> {
    const refreshRate = await getSyncStorageValue<number>(ChromeSettingsKey.RefreshRate);

    return refreshRate === null || refreshRate === undefined ? ChromeSettingsService.DEFAULT_REFRESH_RATE : refreshRate;
}

export async function getUrlFilterOptions(): Promise<SelectItemList> {
    const urlFilterOptions = await getSyncStorageValue<SelectItemList>(ChromeSettingsKey.UrlFilterOptions);

    return urlFilterOptions === null || urlFilterOptions === undefined ? ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS : urlFilterOptions;
}

export async function setRefreshRate(newRefreshRate: number): Promise<number> {
    const oldRefreshRate = await getRefreshRate();

    if (oldRefreshRate === newRefreshRate) {
        return newRefreshRate;
    }

    return setSyncStorageValue(ChromeSettingsKey.RefreshRate, newRefreshRate);
}

export async function setUrlFilterOptions(newUrlFilterOptions: SelectItemList): Promise<SelectItemList> {
    const oldUrlFilterOptions = await getUrlFilterOptions();

    if (isEqual(oldUrlFilterOptions, newUrlFilterOptions)) {
        return newUrlFilterOptions;
    }

    return setSyncStorageValue(ChromeSettingsKey.UrlFilterOptions, newUrlFilterOptions);
}

async function getSyncStorageValue<T>(key: ChromeSettingsKey): Promise<T> {
    const sync = await chrome.storage.sync.get(key);
    return sync[key];
}

async function setSyncStorageValue<T>(key: ChromeSettingsKey, value: T): Promise<T> {
    console.log(`Updated Setting ${key} on ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`);

    await chrome.storage.sync.set({ [key]: value });

    return value;
}