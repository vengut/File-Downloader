import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { HttpResponseModel } from './http-response.model';

@Injectable({ providedIn: 'root' })
export class ChromeStorageService {
    constructor() {}

    public getIsListening(): Observable<boolean> {
        return this.getValue('isListening');
    }

    public getResponses(): Observable<HttpResponseModel[]> {
        return this.getValue('responses');
    }

    public getValue<T>(key: string): Observable<T> {
        return from(chrome.storage.local.get(key)).pipe(
            map(local => local[key])
        );
    }
    
    public clearResponses() {
        return from(chrome.storage.local.set({ responses: [] }));
    }
}