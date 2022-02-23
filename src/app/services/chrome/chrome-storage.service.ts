import {Injectable} from '@angular/core';
import {
    concat, filter,
    from,
    fromEventPattern,
    map, mergeAll, mergeMap,
    Observable, of,
    switchMap,
    windowTime
} from 'rxjs';
import {HttpResponseModel} from './chrome-web-request.model';
import {
    ChromeStorageKey,
    ChromeStorageModel,
    StorageNamespace
} from "./chrome-storage.model";
import {ChromeSettingsService} from "./chrome-settings.service";

@Injectable({providedIn: 'root'})
export class ChromeStorageService {
    constructor() {
    }

    public getEventStream() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler),
            (changes: { [key: string]: chrome.storage.StorageChange }, namespace: StorageNamespace) => {
                const storage: ChromeStorageModel = {};

                if (namespace === 'local') {
                    if (changes.hasOwnProperty(ChromeStorageKey.IsListening)) {
                        storage.isListening = changes[ChromeStorageKey.IsListening].newValue ?? false;
                    }

                    if (changes.hasOwnProperty(ChromeStorageKey.Responses)) {
                        storage.responses = changes[ChromeStorageKey.Responses].newValue ?? [];
                    }
                }

                return storage;
            }
        )
        .pipe(filter(storage => storage.isListening !== undefined || storage.responses !== undefined));
    }

    public getAll() {
        return concat(
            from(this.getLocalStorage()),
            this.getEventStream().pipe(mergeMap(() => this.getLocalStorage())),
        ).pipe(
            windowTime(3000),
            mergeAll()
        );
    }

    public setIsListening(newIsListening: boolean): Observable<boolean> {
        return this.getIsListening().pipe(
            switchMap((oldIsListening) => {
                if (oldIsListening === newIsListening) {
                    return of(newIsListening);
                }

                return this.setValue<boolean>(ChromeStorageKey.IsListening, newIsListening);
            })
        );
    }

    private getIsListening(): Observable<boolean> {
        return this.getValue<boolean>(ChromeStorageKey.IsListening)
            .pipe(
                map((isListening) => isListening === null || isListening === undefined ? false : isListening)
            );
    }

    public clearResponses(): Observable<HttpResponseModel[]> {
        return this.setValue<HttpResponseModel[]>(ChromeStorageKey.Responses, []);
    }

    private getValue<T>(key: ChromeStorageKey): Observable<T> {
        return from(chrome.storage.local.get(key)).pipe(
            map(local => local[key])
        );
    }

    private setValue<T>(key: ChromeStorageKey, value: T): Observable<T> {
        console.log(`Updated ${key} on ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`);
        return from(chrome.storage.local.set({ [key]: value })).pipe(
            map(() => value)
        );
    }

    private getLocalStorage(): Promise<ChromeStorageModel> {
        return chrome.storage.local.get();
    }
}
