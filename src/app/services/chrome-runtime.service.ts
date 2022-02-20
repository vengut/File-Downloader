import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class ChromeRuntimeService {
    constructor() {
    }

    public toggleListener() {
        return chrome.runtime.sendMessage(null);
    }
}
