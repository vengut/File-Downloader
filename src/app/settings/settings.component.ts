import {Component, OnInit} from '@angular/core';
import { ChromeSettingsService } from '../services/chrome/chrome-settings.service';

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public urlFilter!: string[];

    public get urlFilterJson(): string {
        return JSON.stringify(this.urlFilter);
    }

    constructor(
        private chromeSettingsService: ChromeSettingsService
    ) {
    }

    ngOnInit() {
        this.chromeSettingsService.getSettingsChanges().subscribe(settings => {
            if (settings.urlFilter) {
                this.urlFilter = settings.urlFilter;
            }
        });
    }
}
