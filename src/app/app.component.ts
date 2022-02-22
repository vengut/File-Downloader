import {Component, OnDestroy, OnInit} from '@angular/core';
import {forkJoin, mergeMap, Observable, Subscription, switchMap, timer} from 'rxjs';
import {ChromeStorageService} from './services/chrome/chrome-storage.service';
import {HttpResponseModel} from "./services/chrome/chrome-web-request.model";
import {ChromeSettingsService} from "./services/chrome/chrome-settings.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    public isLoading: boolean = false;
    public isListening: boolean = false;
    public defaultURLFilter: string[] = [];
    public pollingRate: number = 10;
    public responses: HttpResponseModel[] = [];

    private responseTableSubscription$?: Subscription;

    public get responsesLength(): number {
        if (this.responses) {
            return this.responses.length;
        }

        return 0;
    }

    public get offListeningLabel(): string {
        if (this.responsesLength > 0) {
            return `Listen (${this.responsesLength})`;
        }

        return `Listen`;
    }

    public get onListeningLabel(): string {
        return `Listening (${this.responsesLength})`;
    }

    constructor(
        private chromeStorageService: ChromeStorageService,
        private chromeSettingsService: ChromeSettingsService
    ) { }

    ngOnInit() {
        this.chromeStorageService.getIsListening().subscribe((isListening) => {
            this.isListening = isListening;
        });

        this.chromeStorageService.getResponses().subscribe((responses) => {
            this.responses = responses;
        });

        this.chromeStorageService.getStorageUpdates().subscribe((changes) => {
            console.log(`UI Storage Update.`);

            if (changes.isListeningChange) {
                this.isListening = changes.isListeningChange;
            }
        });

        this.chromeSettingsService.getPollingRate().subscribe(pollingRate => {
            this.pollingRate = pollingRate;
            this.updateResponseTableSubscription();
        });
    }

    ngOnDestroy() {
        if (this.responseTableSubscription$ !== undefined) {
            this.responseTableSubscription$.unsubscribe();
        }
    }

    public updatePollingRate(_pollingRate: number) {
        this.chromeSettingsService.setPollingRate(this.pollingRate);
        this.updateResponseTableSubscription();
    }

    public updateResponseTableSubscription() {
        if (this.responseTableSubscription$ !== undefined) {
            this.responseTableSubscription$.unsubscribe();
        }

        this.responseTableSubscription$ = timer(1000, this.pollingRate * 1000).pipe(
            switchMap((_n) => this.chromeStorageService.getResponses())
        ).subscribe(
            (responses) => {
                this.responses = responses;
            }
        );
    }

    public refreshTable() {
        this.chromeStorageService.getResponses()
            .subscribe(
                (responses) => {
                    this.responses = responses;
                }
            );
    }

    public toggleListener() {
        this.isLoading = true;
        this.chromeStorageService.toggleListener().subscribe(() => this.isLoading = false);
    }

    public clearResponses() {
        this.isLoading = true;
        this.chromeStorageService.clearResponses().subscribe(() => this.isLoading = false);
        this.refreshTable();
    }
}
