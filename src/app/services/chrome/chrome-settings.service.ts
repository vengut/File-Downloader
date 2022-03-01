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
    windowTime,
    mergeAll, filter, distinctUntilChanged, bufferTime
} from 'rxjs';
import {ChromeSettingsKey, ChromeSettingsModel} from './chrome-settings.model';
import {StorageNamespace} from "./chrome-storage.model";
import {isEqual} from "lodash";
import {SelectItemList} from "../../settings/settings.model";

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    public static readonly DEFAULT_URL_FILTER_OPTIONS: SelectItemList = [
        { value: '.mp3', label: 'MP3', isSelected: true },
        { value: '.m3u8', label: 'HLS' },
        { value: '.mp4', label: 'MP4' }
    ];

    constructor() { }

    public getSettingsChanges(refreshRate: number = 3000) {
        return concat(
            from(this.getSyncStorage()),
            this.getEventStream().pipe(mergeMap(() => this.getSyncStorage())),
        ).pipe(
            bufferTime(refreshRate),
            map((changes) => changes.pop() ?? {})
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

    public getUrlFilterOptions(): Observable<SelectItemList> {
        return this.getSetting<SelectItemList>(ChromeSettingsKey.UrlFilterOptions).pipe(
            map(urlFilterOptions => urlFilterOptions === null || urlFilterOptions === undefined ? ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS : urlFilterOptions)
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

    private getSyncStorage(): Promise<ChromeSettingsModel> {
        return chrome.storage.sync.get();
    }

    private getEventStream() {
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
        )
        .pipe(filter(settings => settings.urlFilterOptions !== undefined));
    }
}
