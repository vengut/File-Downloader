import {Component, OnInit} from '@angular/core';
import {concatMap} from 'rxjs';
import {ChromeStorageService} from './shared/services/chrome/chrome-storage.service';
import {FormControl} from "@angular/forms";
import {PrimeNGConfig} from "primeng/api";
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public isListeningFormControl: FormControl;
    public responsesLength: number = 0;

    public get isListening(): boolean {
        return this.isListeningFormControl.value;
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
        private primengConfig: PrimeNGConfig,
        private titleService: Title
    ) {
        this.isListeningFormControl = new FormControl(false);
        this.responsesLength = 0;
    }

    ngOnInit() {
        this.primengConfig.ripple = true;

        this.chromeStorageService.getStorage(1000)
            .subscribe(storage => {

                if (storage && storage.isListening !== undefined) {
                    this.isListeningFormControl.setValue(storage.isListening);
                }

                if (storage && storage.responses !== undefined) {
                    this.responsesLength = storage.responses.length;
                }

                let title  = `Sniffer`;

                if (this.isListening) {
                    title = `Sniffer... (${this.responsesLength})`
                }
                else if (this.responsesLength > 0) {
                    title = `Sniffer (${this.responsesLength})`;
                }

                this.titleService.setTitle(title);
            });

        this.isListeningFormControl.valueChanges.pipe(
            concatMap((isListening) => this.chromeStorageService.setIsListening(isListening))
        ).subscribe();
    }
}
