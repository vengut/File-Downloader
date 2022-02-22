import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { ChromeSettingsKey } from './chrome-settings.model';

@Injectable({providedIn: 'root'})
export class ChromeSettingsService {
    constructor() { }
    
    public getUrlFilter(): Observable<string[]> {
        return this.getSetting<string[]>(ChromeSettingsKey.UrlFilter).pipe(
            map(urlFilter => urlFilter === null || urlFilter === undefined ? [] : urlFilter)
        );
    }

    public setUrlFilterSetting(urlFilter: string[]): Observable<string[]> {
        return this.setSetting<string[]>(ChromeSettingsKey.UrlFilter, urlFilter === undefined || urlFilter === null ? [] : urlFilter);
    }

    private getSetting<T>(key: ChromeSettingsKey): Observable<T> {
        return from(chrome.storage.sync.get(key)).pipe(
            map(sync => sync[key])
        );
    }

    private setSetting<T>(key: ChromeSettingsKey, value: T): Observable<T> {
        console.log(`Updated Setting ${key}.`);
        return from(chrome.storage.sync.set({ [key]: value })).pipe(
            map(() => value)
        );
    }
}