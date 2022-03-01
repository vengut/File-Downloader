import { Injectable } from '@angular/core';
import {
    Observable,
    from,
    map,
    fromEventPattern,
    switchMap,
    of,
    mergeMap,
    concat,
    filter,
    bufferTime,
    distinctUntilChanged
} from 'rxjs';
import {ChromeSettingsKey, ChromeSettingsModel} from './chrome-settings.model';
import {StorageNamespace} from "./chrome-storage.model";
import {isEqual} from "lodash";
import {SelectItemList} from "../../../settings/settings.model";

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    public static readonly DEFAULT_URL_FILTER_OPTIONS: SelectItemList = [
        { value: '.mp3', label: 'MP3', isSelected: true },
        { value: '.m3u8', label: 'HLS' },
        { value: '.mp4', label: 'MP4' }
    ];
    public static readonly DEFAULT_REFRESH_RATE: number = 5000;
    public static readonly MIN_REFRESH_RATE: number = 3000;
    public static readonly MAX_REFRESH_RATE: number = 30000;
    public static readonly STEP_REFRESH_RATE: number = 500;

    constructor() { }

    public getSyncStorage(): Promise<ChromeSettingsModel> {
        return chrome.storage.sync.get();
    }

    public getSettings(refreshRate: number = ChromeSettingsService.DEFAULT_REFRESH_RATE) {
        return concat(
            from(this.getSettingsChanges(refreshRate)),
            this.getSettingsChanges(refreshRate)
        );
    }

    public setUrlFilterOptions(newUrlFilterOptions: SelectItemList): Observable<SelectItemList> {
        return this.getUrlFilterOptions().pipe(
            switchMap(oldUrlFilterOptions => {
                if (isEqual(oldUrlFilterOptions, newUrlFilterOptions)) {
                    return of(oldUrlFilterOptions);
                }

                return this.setSetting<SelectItemList>(ChromeSettingsKey.UrlFilterOptions, newUrlFilterOptions === undefined || newUrlFilterOptions === null ? ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS : newUrlFilterOptions);
            })
        );
    }

    public setRefreshRate(newRefreshRate: number): Observable<number> {
        return this.getRefreshRate().pipe(
            switchMap((oldRefreshRate) => {
                if (oldRefreshRate === newRefreshRate) {
                    return of(newRefreshRate);
                }

                return this.setSetting<number>(ChromeSettingsKey.RefreshRate, newRefreshRate);
            })
        );
    }

    public getUrlFilterOptions(): Observable<SelectItemList> {
        return this.getSetting<SelectItemList>(ChromeSettingsKey.UrlFilterOptions).pipe(
            map(urlFilterOptions => urlFilterOptions === null || urlFilterOptions === undefined ? ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS : urlFilterOptions)
        );
    }

    public getRefreshRate(): Observable<number> {
        return this.getSetting<number>(ChromeSettingsKey.RefreshRate)
            .pipe(
                map((refreshRate) => refreshRate === null || refreshRate === undefined ? ChromeSettingsService.DEFAULT_REFRESH_RATE : refreshRate)
            );
    }


    private getSetting<T>(key: ChromeSettingsKey): Observable<T> {
        return from(chrome.storage.sync.get(key)).pipe(
            map(sync => sync[key])
        );
    }

    private setSetting<T>(key: ChromeSettingsKey, value: T): Observable<T> {
        console.log(`Updated Setting ${key} on ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`);
        return from(chrome.storage.sync.set({ [key]: value })).pipe(
            map(() => value)
        );
    }

    private getSettingsChanges(refreshRate: number) {
        return this.getStorageEventStream()
            .pipe(
                mergeMap(() => this.getSyncStorage()),
                bufferTime(refreshRate),
                map((changes) => changes.pop() ?? {})
            );
    }

    private getStorageEventStream() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler),
            (changes: { [key: string]: chrome.storage.StorageChange }, namespace: StorageNamespace) => {
                const settings: ChromeSettingsModel = {};

                if (namespace === 'sync') {
                    if (changes.hasOwnProperty(ChromeSettingsKey.UrlFilterOptions)) {
                        settings.urlFilterOptions = changes[ChromeSettingsKey.UrlFilterOptions].newValue ?? [];
                    }
                }

                return settings;
            }
        );
    }
}
