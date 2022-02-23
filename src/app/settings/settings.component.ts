import {Component, OnInit} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import { ChromeSettingsService } from '../services/chrome/chrome-settings.service';
import {concatMap} from "rxjs";

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public readonly MIN_POLLING_RATE = 10;
    public readonly MAX_POLLING_RATE = 100;
    public pollingRateFormControl: FormControl;

    constructor(
        private chromeSettingsService: ChromeSettingsService
    ) {
        this.pollingRateFormControl = new FormControl(
            ChromeSettingsService.DEFAULT_POLLING_RATE,
            [ Validators.min(this.MIN_POLLING_RATE), Validators.max(this.MAX_POLLING_RATE) ]
        );
    }

    ngOnInit() {
        this.chromeSettingsService.getAll().subscribe(settings => {
            if (settings.pollingRate) {
                this.pollingRateFormControl.setValue(settings.pollingRate);
            }
        });

       this.pollingRateFormControl.valueChanges.pipe(
           concatMap((newPollingRate: number) => this.chromeSettingsService.setPollingRate(newPollingRate))
       ).subscribe();
    }
}
