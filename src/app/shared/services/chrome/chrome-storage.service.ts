import {Injectable} from '@angular/core';
import {
    bufferTime,
    concat, 
    concatMap,
    from,
    fromEventPattern,
    map,
    mergeMap,
    Observable,
    of
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
        return from(setIsListening(newIsListening));
    }

    public getIsListening(): Observable<boolean> {
        return from(getIsListening());
    }

    public getResponses(): Observable<HttpResponseModel[]> {
        return from(getResponses());
    }

    public clearResponses(): Observable<HttpResponseModel[]> {
        return from(setResponses([]));
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

export async function getLocalStorage(): Promise<ChromeStorageModel> {
    const result = await chrome.storage.local.get();

    let isListening = false;
    let responses: HttpResponseModel[] = [];

    if (result) {
        isListening = result[ChromeStorageKey.IsListening] ?? isListening;
        responses = result[ChromeStorageKey.Responses] ?? responses;
    }
    
    return {
        isListening,
        responses
    };
}

export async function getIsListening(): Promise<boolean> {
    const isListening = await getLocalStorageValue<boolean>(ChromeStorageKey.IsListening);

    return isListening === null || isListening === undefined ? false : isListening;
}

export async function getResponses(): Promise<HttpResponseModel[]> {
    const responses = await getLocalStorageValue<HttpResponseModel[]>(ChromeStorageKey.Responses);

    return responses === null || responses === undefined ? [] : responses;
}

export async function setIsListening(newIsListening: boolean): Promise<boolean> {
    const oldIsListening = await getIsListening();

    if (oldIsListening === newIsListening) {
        return newIsListening;
    }

    return setLocalStorageValue<boolean>(ChromeStorageKey.IsListening, newIsListening);
}

export async function setResponses(responses: HttpResponseModel[]): Promise<HttpResponseModel[]> {
    return setLocalStorageValue<HttpResponseModel[]>(ChromeStorageKey.Responses, responses);
}

async function getLocalStorageValue<T>(key: ChromeStorageKey): Promise<T> {
    const local = await chrome.storage.local.get(key);
    return local[key];
}

async function setLocalStorageValue<T>(key: ChromeStorageKey, value: T): Promise<T> {
    console.log(`Updated ${key} on ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`);

    await chrome.storage.local.set({ [key]: value });

    return value;
}