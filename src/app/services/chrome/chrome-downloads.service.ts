import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class ChromeDownloadsService {
    constructor() { }
    
    public downloadFile(url: string, filename?: string, saveAs: boolean = false): Observable<number> {
        return new Observable((observer) => {
            chrome.downloads.download({filename, url, saveAs}, downloadId => {
                if (downloadId === undefined) {
                    observer.error(`Failed to download ${filename}: ${chrome.runtime.lastError?.message} `);
                }
                else {
                    observer.next(downloadId);
                }
                observer.complete();
            });
        });
        
    }
}