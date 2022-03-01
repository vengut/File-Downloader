import {Component, OnInit } from '@angular/core';
import { ChromeSettingsService } from '../shared/services/chrome/chrome-settings.service';
import {FormControl, FormControlStatus} from "@angular/forms";
import { SelectItemList, SelectItemListSchema } from './settings.model';
import { JsonTypeValidator } from '../shared/services/zod-extensions';
import {combineLatest, concatMap, debounceTime, distinctUntilChanged, of} from "rxjs";
import {prettyPrintJson, prettyPrintObject} from "../utilities";
import {isEqual} from "lodash";

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public urlFilterOptions: SelectItemList = [

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
        this.chromeSettingsService.getUrlFilterOptions().subscribe(urlFilterOptions => {
            if (urlFilterOptions) {
                this.urlFilterOptionsFormControl.setValue(prettyPrintObject(urlFilterOptions));
            }
        });

        combineLatest([
            this.urlFilterOptionsFormControl.valueChanges,
            this.urlFilterOptionsFormControl.statusChanges,
        ]).pipe(
            debounceTime(1000),
            distinctUntilChanged((_old, _new) => isEqual(_old, _new)),
            concatMap(([json, status]: [string, FormControlStatus]) => {
                if (status === 'VALID') {
                    this.urlFilterOptionsFormControl.setValue(prettyPrintJson(json));

                    return this.chromeSettingsService.setUrlFilterOptions(JSON.parse(json));
                }
                else {
                    return of(undefined);
                }
            })
        ).subscribe();
    }

}
