import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChromeRuntimeService {
    constructor() {}

    public startListener() {
        return chrome.runtime.sendMessage(true);
    }

    public stopListener() {
        return chrome.runtime.sendMessage(false);
    }
}