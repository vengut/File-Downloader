import { Injectable } from '@angular/core';
import { from, map, Observable, share } from 'rxjs';

//Performance Issues

@Injectable({providedIn: 'root'})
export class ChromeBadgeService {
    private _filteredCount: number | undefined;

    public get filteredCount(): number | undefined {
        return this._filteredCount;
    }

    public set filteredCount(filteredCount: number | undefined) {
        this._filteredCount = filteredCount;
        this.setBadgeText().subscribe();
    }
    
    constructor() {
        this._filteredCount = undefined;
    }
    
    public setBadgeText(text?: string): Observable<string | undefined> {
        let badgeText: string | undefined = undefined;
        
        if (text) {
            if (text.length > 3) {
                text =  `${text.slice(0, 4)}+`; 
            }

            badgeText = text;
        }
        else {
            let count = this.filteredCount ?? 0;

            if (count > 999){
                badgeText = `999+`
            }
            else {
                badgeText = count.toString();
            }
        }

        return from(chrome.action.setBadgeText({ text: badgeText }))
            .pipe(
                map(() => badgeText),
                share()
            );
    }

    public resetBadge(): Observable<string | undefined> {
        return this.setBadgeText(``);
    }
}