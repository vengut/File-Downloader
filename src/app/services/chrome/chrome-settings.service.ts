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
    mergeAll, filter, distinctUntilChanged
} from 'rxjs';
import {ChromeSettingsKey, ChromeSettingsModel} from './chrome-settings.model';
import {StorageNamespace} from "./chrome-storage.model";
import {isEqual} from "lodash";

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    constructor() { }

    public getEventStream() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler),
            (changes: { [key: string]: chrome.storage.StorageChange }, namespace: StorageNamespace) => {
                const settings: ChromeSettingsModel = {};

                if (namespace === 'sync') {

                    if (changes.hasOwnProperty(ChromeSettingsKey.UrlFilter)) {
                        settings.urlFilter = changes[ChromeSettingsKey.UrlFilter].newValue ?? [];
                    }
                }

                return settings;
            }
        )
        .pipe(filter(settings => settings.urlFilter !== undefined));
    }

    public getAll() {
        return concat(
            from(this.getSyncStorage()),
            this.getEventStream().pipe(mergeMap(() => this.getSyncStorage())),
        ).pipe(
            distinctUntilChanged((a, b) => isEqual(a, b)),
            windowTime(3000),
            mergeAll()
        );
    }

    public setUrlFilter(newUrlFilter: string[]): Observable<string[]> {
        return this.getUrlFilter().pipe(
            switchMap(oldUrlFilter => {
                if (isEqual(oldUrlFilter, newUrlFilter)) {
                    return of(oldUrlFilter);
                }

                return this.setSetting<string[]>(ChromeSettingsKey.UrlFilter, newUrlFilter === undefined || newUrlFilter === null ? [] : newUrlFilter);
            })
        )

    }

    public getUrlFilter(): Observable<string[]> {
        return this.getSetting<string[]>(ChromeSettingsKey.UrlFilter).pipe(
            map(urlFilter => urlFilter === null || urlFilter === undefined ? [] : urlFilter)
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
}
