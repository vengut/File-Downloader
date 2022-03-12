import {Injectable} from '@angular/core';
import {
    bufferTime,
    concat, concatMap,
    from,
    fromEventPattern,
    map,
    mergeMap,
    Observable,
    of,
    switchMap
} from 'rxjs';
import {HttpResponseModel} from './chrome-web-request.model';
import {
    ChromeStorageKey,
    ChromeStorageModel
} from "./chrome-storage.model";
import { ChromeSettingsService } from './chrome-settings.service';

@Injectable({providedIn: 'root'})
export class ChromeStorageService {
    constructor(private chromeSettingsService: ChromeSettingsService) {}

    public getStorage(optionalRefreshRate?: number) {
        let refreshRateSubscription = this.chromeSettingsService.getRefreshRate();

        if (optionalRefreshRate) {
            refreshRateSubscription = of(optionalRefreshRate);
        }

        return refreshRateSubscription
            .pipe(
                concatMap((refreshRate) => {
                    return concat(
                        from(getLocalStorage()),
                        this.getStorageChanges(refreshRate)
                    );
                })
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

    public getResponses(): Observable<HttpResponseModel[]> {
        return this.getValue<HttpResponseModel[]>(ChromeStorageKey.Responses)
            .pipe(
                map((responses) => responses === null || responses === undefined ? [] : responses)
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

    private getStorageChanges(refreshRate: number) {
        return this.getStorageEventStream()
            .pipe(
                mergeMap(() => getLocalStorage()),
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

export function getLocalStorage(): Promise<ChromeStorageModel> {
    return chrome.storage.local.get().then((result) => {
        let isListening = false;
        let responses: HttpResponseModel[] = [];

        if (result) {
            isListening = result[ChromeStorageKey.IsListening] ?? isListening;
            responses = result[ChromeStorageKey.Responses] ?? responses;
        }

        return {
            isListening,
            responses
        }
    });
}