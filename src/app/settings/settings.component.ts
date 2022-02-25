import {Component, OnInit } from '@angular/core';
import { ChromeSettingsService } from '../services/chrome/chrome-settings.service';
import {FormControl} from "@angular/forms";
import { SelectItemList, SelectItemListSchema } from './settings.model';
import { JsonTypeValidator } from '../services/zod-extensions';

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public urlFilterOptions: SelectItemList = [
        { value: '.mp3', label: 'MP3', isSelected: true },
        { value: '.m3u8', label: 'HLS' },
        { value: '.mp4', label: 'MP4' },
    ];

    public urlFilterOptionsFormControl: FormControl;

    public get urlFilterOptionsFormControlErrors(): string {
        const errors = this.urlFilterOptionsFormControl.errors;
        if (errors) {
            return Object.values(errors).join("; ");
        }

        return "";
    }

    constructor(
        private chromeSettingsService: ChromeSettingsService
    ) {
        this.urlFilterOptionsFormControl = new FormControl(
            JSON.stringify(this.urlFilterOptions, null, 2),
            JsonTypeValidator(SelectItemListSchema)
        );
    }

    ngOnInit() {
        this.chromeSettingsService.getSettingsChanges().subscribe(settings => {
            if (settings.urlFilter) {
                console.log(settings.urlFilter);
            }
        });
    }

}
