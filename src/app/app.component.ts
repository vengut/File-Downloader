import {Component, OnInit} from '@angular/core';
import {ChromeStorageService} from './services/chrome/chrome-storage.service';
import {HttpResponseModel} from "./services/chrome/chrome-web-request.model";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public isLoading: boolean = false;
    public isListening: boolean = false;
    public defaultURLFilter: string[] = [];

    public responses: HttpResponseModel[] = [];

    constructor(
        private chromeStorageService: ChromeStorageService
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

            if (changes.responsesChange) {
                this.responses = changes.responsesChange;
            }
        });
    }

    public toggleListener() {
        this.isLoading = true;
        this.chromeStorageService.toggleListener().subscribe(() => this.isLoading = false);
    }

    public clearResponses() {
        this.isLoading = true;
        this.chromeStorageService.clearResponses().subscribe(() => this.isLoading = false);;
    }
}
