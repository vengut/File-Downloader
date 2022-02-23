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
    mergeAll
} from 'rxjs';
import {ChromeSettingsKey, ChromeSettingsModel} from './chrome-settings.model';
import {StorageNamespace} from "./chrome-storage.model";
import {isEqual} from "lodash";

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    public static readonly DEFAULT_POLLING_RATE: number = 10;
    constructor() { }

    public getEventStream() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler),
            (changes: { [key: string]: chrome.storage.StorageChange }, namespace: StorageNamespace) => {
                const settings: ChromeSettingsModel = {};

                if (namespace === 'sync') {
                    if (changes.hasOwnProperty(ChromeSettingsKey.PollingRate)) {
                        settings.pollingRate = changes[ChromeSettingsKey.PollingRate].newValue ?? ChromeSettingsService.DEFAULT_POLLING_RATE;
                    }

                    if (changes.hasOwnProperty(ChromeSettingsKey.UrlFilter)) {
                        settings.urlFilter = changes[ChromeSettingsKey.UrlFilter].newValue ?? [];
                    }
                }

                return settings;
            }
        )
        .pipe(map(settings => settings.urlFilter !== undefined || settings.pollingRate !== undefined));
    }

    public getAll() {
        return concat(
            from(this.getSyncStorage()),
            this.getEventStream().pipe(mergeMap(() => this.getSyncStorage())),
        ).pipe(
            windowTime(3000),
            mergeAll()
        );
    }

    public setPollingRate(newPollingRate: number): Observable<number> {
        return this.getPollingRate().pipe(
            switchMap(oldPollingRate => {
                if (oldPollingRate === newPollingRate) {
                    return of(oldPollingRate);
                }

                return this.setSetting<number>(ChromeSettingsKey.PollingRate, newPollingRate === undefined || newPollingRate === null ? ChromeSettingsService.DEFAULT_POLLING_RATE : newPollingRate);
            })
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

    private getPollingRate(): Observable<number> {
        return this.getSetting<number>(ChromeSettingsKey.PollingRate).pipe(
            map(pollingRate => pollingRate === null || pollingRate === undefined ? ChromeSettingsService.DEFAULT_POLLING_RATE : pollingRate)
        );
    }

    private getUrlFilter(): Observable<string[]> {
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
