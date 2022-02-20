import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ChromeRuntimeService} from './services/chrome-runtime.service';
import {ChromeStorageService} from './services/chrome-storage.service';
import {ResourceTypes} from "./services/http-response.model";
import {SelectItem} from "primeng/api/selectitem";
import {distinct} from "./utilities";
import {HttpResponseTableColumn, HttpResponseTableModel} from "./app.model";
import {Table} from "primeng/table";
import {FilterService} from "primeng/api";
import sanitize from "sanitize-filename";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    public readonly MAX_CHARACTER_COUNT: number = 69;
    public readonly DEFAULT_URL_FILTER: string = '.mp3';
    public isListening: boolean = false;
    @ViewChild('dt', {static: false}) public table!: Table;

    public columns: HttpResponseTableColumn[] = [];
    public globalFilter: string = "";
    public urlFilter: string[] = [this.DEFAULT_URL_FILTER];
    public responses: HttpResponseTableModel[] = [];
    public selectedResponses: HttpResponseTableModel[] = [];

    public get urlOptions(): SelectItem[] {
        return [
            { value: '.mp3', label: 'MP3'},
            { value: '.m3u8', label: 'HLS' },
            { value: '.mp4', label: 'MP4' },
        ];
    }

    public get types(): SelectItem[] {
        return ResourceTypes.map(type => (<SelectItem> { label: type, value: type }));
    }

    public get tabs(): SelectItem[] {
        if (this.responses) {
            const tabNames = distinct(this.responses.map(r => r.tab));
            return tabNames.map(tab => (<SelectItem> { label: this.getTabDisplay(tab, 20), value: tab }));
        }
        return [];
    }

    public get selectedResponsesLength(): number {
        if (this.selectedResponses) {
            return this.selectedResponses.length;
        }
        return 0;
    }

    public get isDownloadsEnabled(): boolean {
        return this.selectedResponsesLength > 0;
    }

    constructor(
        private chromeRuntimeService: ChromeRuntimeService,
        private chromeStorageService: ChromeStorageService,
        private filterService: FilterService
    ) {
        this.columns = [
            { field: 'url', header: 'URL', sortable: true },
            { field: 'date', header: 'Date', sortable: true },
            { field: 'type', header: 'Type', sortable: false },
            { field: 'tab', header: 'Tab', sortable: true },
        ];

        this.filterService.register('incontains',(value: string, filter: string[]): boolean => {
            return filter.some(f => value.toLowerCase().includes(f.toLowerCase()));
        });
    }

    ngOnInit() {
        this.setIsListening();
        this.setResponses();
        chrome.runtime.onMessage.addListener(() =>{
            this.setIsListening();
        });
    }

    ngAfterViewInit() {
        this.filterUrls();
    }

    public filterUrls() {
        this.table.filter(this.urlFilter, 'url', 'incontains');
    }

    public toggleListener() {
        this.chromeRuntimeService.toggleListener();
        this.setResponses();
    }

    public clearResponses() {
        this.chromeStorageService.clearResponses();
        this.setResponses();
    }

    public getURLDisplay(url: string, length: number = this.MAX_CHARACTER_COUNT) {
        const pathName = new URL(url).pathname;
        return pathName.substring(pathName.length - length);
    }

    public getTabDisplay(tab: string, length: number = this.MAX_CHARACTER_COUNT) {
        return tab.substring(0, length);
    }

    public setIsListening() {
        this.chromeStorageService.getIsListening().subscribe((isListening) => {
            this.isListening = isListening;
        });
    }

    public setResponses() {
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

    public downloadUrl(response: HttpResponseTableModel) {
        const extension = new URL(response.url).pathname.split('.').pop();
        chrome.downloads.download({
            filename: `${sanitize(response.tab)}.${extension}`,
            url: response.url
        });
    }

    public downloadUrls() {
        console.log(this.selectedResponses);
        this.selectedResponses = [];
    }
}
