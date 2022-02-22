import {Injectable} from '@angular/core';
import {from, fromEventPattern, map, Observable, switchMap} from 'rxjs';
import {HttpResponseModel} from './chrome-web-request.model';
import {ChromeStorageChangesModel, ChromeStorageKey, StorageNamespace} from "./chrome-storage.model";

@Injectable({providedIn: 'root'})
export class ChromeStorageService {
    constructor() {
    }

    public getStorageUpdates() {
        return fromEventPattern(
            (addHandler)=> chrome.storage.onChanged.addListener(addHandler),
            (removeHandler) => chrome.storage.onChanged.removeListener(removeHandler),
            (changes: { [key: string]: chrome.storage.StorageChange }, namespace: StorageNamespace) => {
                const storageChanges: ChromeStorageChangesModel = { namespace };

                if (changes.hasOwnProperty(ChromeStorageKey.IsListening)) {
                    storageChanges.isListeningChange = changes[ChromeStorageKey.IsListening].newValue ?? false;
                }

                if (changes.hasOwnProperty(ChromeStorageKey.Responses)) {
                    storageChanges.responsesChange = changes[ChromeStorageKey.Responses].newValue ?? [];
                }

                return storageChanges;
            }
        );
    }

    public getIsListening(): Observable<boolean> {
        return this.getValue<boolean>(ChromeStorageKey.IsListening)
            .pipe(
                map((isListening) => isListening === null || isListening === undefined ? false : isListening)
            );
    }

    public getResponses(): Observable<HttpResponseModel[]> {
        return this.getValue<HttpResponseModel[]>(ChromeStorageKey.Responses).pipe(
            map(responses => responses === null || responses === undefined ? [] : responses)
        );
    }

    public toggleListener(): Observable<boolean> {
        return this.getIsListening().pipe(
            switchMap((isListening) => this.setValue(ChromeStorageKey.IsListening, !isListening))
        );
    }

    public clearResponses(): Observable<HttpResponseModel[]> {
        return this.setValue(ChromeStorageKey.Responses, []);
    }

    private getValue<T>(key: ChromeStorageKey): Observable<T> {
        return from(chrome.storage.local.get(key)).pipe(
            map(local => local[key])
        );
    }

    private setValue<T>(key: ChromeStorageKey, value: T): Observable<T> {
        console.log(`Updated ${key}.`);
        return from(chrome.storage.local.set({ [key]: value })).pipe(
            map(() => value)
        );
    }
}
