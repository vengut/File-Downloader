import { Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChromeStorageService {
    constructor() { }

    public getLinks(): Observable<string[]> {
        return from(chrome.storage.sync.get('links')).pipe(
            map(sync => {
                let links: string[] = sync['links'];
                return links;
            })
        );
    }
    
    public setLinks(newLinks: string[]) {
        return from(chrome.storage.sync.set({ links: newLinks })).pipe( switchMap(() => of(newLinks)));
    }
}