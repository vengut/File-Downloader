import {AfterViewInit, Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {ChromeStorageService} from './services/chrome-storage.service';
import {HttpResponseModel, ResourceTypes} from "./services/http-response.model";
import {SelectItem} from "primeng/api/selectitem";
import {distinct, getExtension, getPathName} from "./utilities";
import {HttpResponseTableColumn, HttpResponseTableModel} from "./app.model";
import {Table} from "primeng/table";
import {FilterService, MessageService} from "primeng/api";
import sanitize from "sanitize-filename";
import {DatePipe} from "@angular/common";
import {groupBy, orderBy} from "lodash"
import {concatMap, delay, finalize, forkJoin, from, of, tap} from "rxjs";
import {ToastService, ToastType} from "./services/toast.service";


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    public readonly MAX_CHARACTER_COUNT: number = 69;
    public readonly DATE_FORMAT: string = 'medium';
    public readonly DEFAULT_URL_FILTER: string = '.mp3';
    public readonly DOWNLOAD_DELAY: number = 2000;

    @ViewChild('dt', {static: false}) public table!: Table;
    public isLoading: boolean = false;
    public isListening: boolean = false;

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
        private chromeStorageService: ChromeStorageService,
        private filterService: FilterService,
        private toastService: ToastService
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
        this.chromeStorageService.getIsListening().subscribe((isListening) => {
            this.isListening = isListening;
        });

        this.chromeStorageService.getResponses().subscribe((responses) => {
            this.responses = this.mapResponsesToTableModel(responses);
        });

        this.chromeStorageService.getStorageUpdates().subscribe((changes) => {
            console.log(`Changes: ${JSON.stringify(changes)}`);

            if (changes.isListeningChange) {
                this.isListening = changes.isListeningChange;
            }

            if (changes.responsesChange) {
                this.responses = this.mapResponsesToTableModel(changes.responsesChange);
            }
        });
    }

    ngAfterViewInit() {
        this.filterUrls();
    }

    public filterUrls() {
        this.table.filter(this.urlFilter, 'url', 'incontains');
    }

    public toggleListener() {
        this.isLoading = true;
        this.chromeStorageService.toggleListener().subscribe(() => this.isLoading = false);
    }

    public clearResponses() {
        this.isLoading = true;
        this.chromeStorageService.clearResponses().subscribe(() => this.isLoading = false);;
    }

    public downloadUrl(response: HttpResponseTableModel) {
        const fileName = sanitize(response.tab);
        const extension = getExtension(response.url);

        const fullFileName = `${fileName}.${extension}`;
        try {
            chrome.downloads.download({
                filename: fullFileName,
                url: response.url
            }, (downloadId) => {
                console.log(downloadId);
            });

            this.toastService.toast(ToastType.Success, "Download Started", `File Name: ${fileName.substring(0, 50)}.${extension}\n Date: ${response.dateDisplay}`);
        }
        catch(e) {
            this.toastService.toast(ToastType.Error, "Failed to Start Download", `File Name: ${fileName.substring(0, 50)}.${extension}\n Date: ${response.dateDisplay}\n Error: ${e}`);
        }
    }

    public downloadUrls() {
        this.isLoading = true;

        const groupedResponses = groupBy(this.selectedResponses, a => a.urlDisplay);

        let uniqueResponses: HttpResponseTableModel[] = [];
        Object.entries(groupedResponses).forEach(([_key, value])=>{
            const mostRecentResponse = orderBy(value, 'date', 'desc')[0];
            uniqueResponses.push(mostRecentResponse);
        });
        uniqueResponses = orderBy(uniqueResponses, 'date', 'asc');

        from(uniqueResponses).pipe(
            concatMap(response => of(response).pipe(delay(this.DOWNLOAD_DELAY))),
            finalize(() => this.isLoading = false)
        ).subscribe(response =>{
            this.downloadUrl(response);
        });

        this.selectedResponses = [];
    }

    private mapResponsesToTableModel(responses: HttpResponseModel[]): HttpResponseTableModel[] {
        return responses.map(r => ({
            id: r.id,
            url: r.url,
            urlDisplay: this.getURLDisplay(r.url),
            type: r.type,
            date: new Date(r.timestamp),
            dateDisplay: this.getDateDisplay(r.timestamp),
            tab: r.tab,
            tabDisplay: this.getTabDisplay(r.tab)
        }));
    }

    private getDateDisplay(timestamp: number, format: string = this.DATE_FORMAT): string {
        const date = new Date(timestamp);
        const dateDisplay = new DatePipe('en-US').transform(date, format);
        return dateDisplay === null || dateDisplay === undefined ? "" : dateDisplay;
    }

    private getURLDisplay(url: string, length: number = this.MAX_CHARACTER_COUNT) {
        const pathName = getPathName(url);
        return pathName.substring(pathName.length - length);
    }

    private getTabDisplay(tab: string, length: number = this.MAX_CHARACTER_COUNT) {
        return tab.substring(0, length);
    }
}
