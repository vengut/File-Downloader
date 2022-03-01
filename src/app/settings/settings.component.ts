import {Component, OnInit } from '@angular/core';
import { ChromeSettingsService } from '../shared/services/chrome/chrome-settings.service';
import {FormControl, FormControlStatus, Validators} from "@angular/forms";
import { SelectItemList, SelectItemListSchema } from './settings.model';
import { JsonTypeValidator } from '../shared/services/zod-extensions';
import {combineLatest, concatMap, debounceTime, distinctUntilChanged, forkJoin, Observable, of} from "rxjs";
import {prettyPrintJson, prettyPrintObject} from "../shared/services/utilities";
import {isEqual} from "lodash";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'settings',
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public readonly DEFAULT_REFRESH_RATE: number = ChromeSettingsService.DEFAULT_REFRESH_RATE;
    public readonly MIN_REFRESH_RATE: number = ChromeSettingsService.MIN_REFRESH_RATE;
    public readonly MAX_REFRESH_RATE: number = ChromeSettingsService.MAX_REFRESH_RATE;
    public readonly STEP_REFRESH_RATE: number = ChromeSettingsService.STEP_REFRESH_RATE;

    public urlFilterOptionsFormControl: FormControl;
    public refreshRateFormControl: FormControl;

    public get urlFilterOptionsFormControlErrors(): string {
        const errors = this.urlFilterOptionsFormControl.errors;
        if (errors) {
            return Object.values(errors).join("; ");
        }

        return "";
    }

    constructor(
        private chromeSettingsService: ChromeSettingsService,
        private activatedRoute: ActivatedRoute
    ) {
        this.refreshRateFormControl = new FormControl(
            this.DEFAULT_REFRESH_RATE,
            [Validators.min(this.MIN_REFRESH_RATE), Validators.max(this.MAX_REFRESH_RATE)]
        );

        this.urlFilterOptionsFormControl = new FormControl(
            JSON.stringify(ChromeSettingsService.DEFAULT_URL_FILTER_OPTIONS, null, 2),
            JsonTypeValidator(SelectItemListSchema)
        );
    }

    ngOnInit() {
        console.log("Settings Route: ", this.activatedRoute.snapshot.data);

        forkJoin([this.chromeSettingsService.getRefreshRate(), this.chromeSettingsService.getUrlFilterOptions() ])
            .subscribe(([refreshRate, urlFilterOptions]) => {
                if (refreshRate) {
                    this.refreshRateFormControl.setValue(refreshRate);
                }

                if (urlFilterOptions) {
                    this.urlFilterOptionsFormControl.setValue(prettyPrintObject(urlFilterOptions));
                }
            });

        this.getFormControlChanges<number>(this.refreshRateFormControl)
            .pipe(
                concatMap(([refreshRate, status]: [number, FormControlStatus]) => {
                    if (status === 'VALID') {
                        this.refreshRateFormControl.setValue(refreshRate);

                        return this.chromeSettingsService.setRefreshRate(refreshRate);
                    }
                    else {
                        return of(undefined);
                    }
                })
            )
            .subscribe();

        this.getFormControlChanges<string>(this.urlFilterOptionsFormControl)
            .pipe(
                concatMap(([json, status]: [string, FormControlStatus]) => {
                    if (status === 'VALID') {
                        this.urlFilterOptionsFormControl.setValue(prettyPrintJson(json));

                        return this.chromeSettingsService.setUrlFilterOptions(JSON.parse(json));
                    }
                    else {
                        return of(undefined);
                    }
                })
            )
            .subscribe();
    }

    private getFormControlChanges<T>(formControl: FormControl): Observable<[T,  FormControlStatus]> {
        return  combineLatest([
            formControl.valueChanges,
            formControl.statusChanges,
        ]).pipe(
            debounceTime(1000),
            distinctUntilChanged((_old, _new) => isEqual(_old, _new))
        );
    }

}
