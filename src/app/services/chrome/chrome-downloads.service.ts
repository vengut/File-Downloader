import { Injectable } from '@angular/core';
import {Observable, of, switchMap} from 'rxjs';

@Injectable({providedIn: 'root'})
export class ChromeDownloadsService {
    constructor() { }

    public downloadFile(url: string, filename?: string, saveAs: boolean = false, isFirstAttempt = true): Observable<number | undefined> {
        return new Observable<number | undefined>((observer) => {
            chrome.downloads.download({filename, url, saveAs}, downloadId => {
                if (downloadId === undefined) {
                    const error = chrome.runtime.lastError?.message;
                    if (isFirstAttempt) {
                        observer.next(undefined);
                    }
                    else {
                        observer.error(`Failed to download ${filename}: ${error} `);
                    }
                }
                else {
                    observer.next(downloadId);
                }

                observer.complete();
            });
        }).pipe(
            switchMap((downloadId) => {
                if (downloadId === undefined) {
                   return this.downloadFile(url, undefined, saveAs, false);
                }

                return of(downloadId);
            })
        );
    }
}
