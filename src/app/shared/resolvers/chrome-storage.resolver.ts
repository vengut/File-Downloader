import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { from, map, Observable } from 'rxjs';
import { ChromeStorageModel } from '../services/chrome/chrome-storage.model';
import { getLocalStorage } from '../services/chrome/chrome-storage.service';

@Injectable({ providedIn: 'root' })
export class ChromeStorageResolver implements Resolve<ChromeStorageModel> {

    resolve(_route: ActivatedRouteSnapshot): Observable<ChromeStorageModel> | Promise<ChromeStorageModel> | ChromeStorageModel {
        return from(getLocalStorage());
    }
}