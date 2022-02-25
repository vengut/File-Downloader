import {Component, OnInit} from '@angular/core';
import {concatMap} from 'rxjs';
import {ChromeStorageService} from './services/chrome/chrome-storage.service';
import {HttpResponseModel} from "./services/chrome/chrome-web-request.model";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public isListeningFormControl: FormControl = new FormControl(false);
    public responses: HttpResponseModel[] = [];

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
        private chromeStorageService: ChromeStorageService
    ) { }

    ngOnInit() {
        this.chromeStorageService.getStorageChanges()
            .subscribe(storage => {
                if (storage.isListening) {
                    this.isListeningFormControl.setValue(storage.isListening);
                }

                if (storage.responses) {
                    this.responses = storage.responses;
                }
            });

        this.isListeningFormControl.valueChanges.pipe(
            concatMap((isListening) => this.chromeStorageService.setIsListening(isListening))
        ).subscribe();
    }

    public clearResponses() {
        this.chromeStorageService.clearResponses().subscribe();
    }
}
