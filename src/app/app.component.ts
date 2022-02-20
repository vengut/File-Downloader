import {Component, OnInit} from '@angular/core';
import {forkJoin, interval, switchMap} from 'rxjs';
import {ChromeRuntimeService} from './services/chrome-runtime.service';
import {ChromeStorageService} from './services/chrome-storage.service';
import {HttpResponseModel, HttpResponseTableModel} from "./services/http-response.model";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public isListening: boolean = false;
    public responses: HttpResponseTableModel[] = [];
    public selectedResponses: HttpResponseTableModel[] = [];

    constructor(
        private chromeRuntimeService: ChromeRuntimeService,
        private chromeStorageService: ChromeStorageService
    ) {
    }

    ngOnInit() {
        interval(100)
            .pipe(switchMap(() => this.chromeStorageService.getIsListening()))
            .subscribe((isListening) => {
                this.isListening = isListening;
            });
    }

    public toggleListener() {
        this.chromeRuntimeService.toggleListener();
        this.chromeStorageService.getResponses()
            .subscribe(responses => {
                this.responses = responses.map(r => ({
                    id: r.id,
                    url: r.url,
                    type: r.type,
                    date: new Date(r.timestamp),
                    tab: r.tab
                }));
            });
    }

    public clearResponses() {
        this.chromeStorageService.clearResponses();
    }
}
