import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { from, map, Observable } from 'rxjs';
import { ChromeSettingsModel } from '../services/chrome/chrome-settings.model';
import { ChromeSettingsService } from '../services/chrome/chrome-settings.service';

@Injectable({ providedIn: 'root' })
export class ChromeSettingsResolver implements Resolve<ChromeSettingsModel> {
    constructor(private chromeSettingsService: ChromeSettingsService) {}

    resolve(_route: ActivatedRouteSnapshot): Observable<ChromeSettingsModel> | Promise<ChromeSettingsModel> | ChromeSettingsModel {
        return from(this.chromeSettingsService.getSyncStorage()).pipe(
            map((sync) => (<ChromeSettingsModel>{
                urlFilterOptions: sync.urlFilterOptions ?? ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS,
                refreshRate: sync.refreshRate ?? ChromeSettingsService.DEFAULT_REFRESH_RATE
            }))
        );
    }
}
