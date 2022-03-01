import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { from, map, Observable } from 'rxjs';
import { ChromeStorageModel } from '../services/chrome/chrome-storage.model';
import { ChromeStorageService } from '../services/chrome/chrome-storage.service';

@Injectable({ providedIn: 'root' })
export class ChromeStorageResolver implements Resolve<ChromeStorageModel> {
    constructor(private chromeStorageService: ChromeStorageService) {}
    
    resolve(_route: ActivatedRouteSnapshot): Observable<ChromeStorageModel> | Promise<ChromeStorageModel> | ChromeStorageModel {
        return from(this.chromeStorageService.getLocalStorage()).pipe(
            map((storage) =>({
                isListening: storage.isListening ?? false,
                responses: storage.responses ?? []
            }))
        );
    }
}