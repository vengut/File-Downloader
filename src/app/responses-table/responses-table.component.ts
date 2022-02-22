import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {HttpResponseModel, ResourceTypes} from "../services/chrome/chrome-web-request.model";
import {SelectItem} from "primeng/api/selectitem";
import {distinct, getExtension, getPathName} from "../utilities";
import {HttpResponseTableColumn, HttpResponseTableModel} from "./responses-table.model";
import {Table} from "primeng/table";
import {FilterService} from "primeng/api";
import sanitize from "sanitize-filename";
import {DatePipe} from "@angular/common";
import {groupBy, orderBy} from "lodash"
import {concatMap, delay, finalize, from, of} from "rxjs";
import {ToastService, ToastType} from "../services/toast.service";
import { ChromeDownloadsService } from '../services/chrome/chrome-downloads.service';

@Component({
    selector: 'responses-table',
    templateUrl: 'responses-table.component.html'
})

export class ResponsesTableComponent implements AfterViewInit {
    public readonly MAX_CHARACTER_COUNT: number = 69;
    public readonly DATE_FORMAT: string = 'medium';
    public readonly DEFAULT_URL_FILTER: string = '.mp3';
    public readonly DOWNLOAD_DELAY: number = 2000;

    @Input() public isListening: boolean = false;
    @Input() public isLoading: boolean = false;
    @Output() public isLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>(false);
    @Input() public responseData: HttpResponseModel[] = [];

    @ViewChild('dt', {static: false}) public table!: Table;

    public columns: HttpResponseTableColumn[] = [];
    public globalFilter: string = "";
    public urlFilter: string[] = [this.DEFAULT_URL_FILTER];
    public selectedResponses: HttpResponseTableModel[] = [];

    public get responses(): HttpResponseTableModel[] {
        return this.responseData.map(r => ({
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
        private filterService: FilterService,
        private chromeDownloadsService: ChromeDownloadsService,
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

    ngAfterViewInit() {
        this.filterUrls();
    }

    public filterUrls() {
        this.table.filter(this.urlFilter, 'url', 'incontains');
    }

    public downloadUrl(response: HttpResponseTableModel, saveAs: boolean = true) {
        const fileName = sanitize(response.tab);
        const extension = getExtension(response.url);
        const fullFileName = `${fileName}.${extension}`;

        this.chromeDownloadsService.downloadFile(response.url, fullFileName, saveAs).subscribe({
            next: (downloadId) => {
                console.log(`Download Started: ${downloadId}`);
                if (!saveAs) {
                    this.toastService.toast(ToastType.Success, "Download Started", `File Name: ${fileName.substring(0, 50)}.${extension}<br/>Date: ${response.dateDisplay}`);
                }
            },
            error: (err: string) =>{
                console.log(`Download Failed: ${err}`);
                this.toastService.toast(ToastType.Error, "Failed to Start Download", `File Name: ${fileName.substring(0, 50)}.${extension}<br/>Date: ${response.dateDisplay}<br/>Error: ${err}`);
            }
        });
    }

    public downloadUrls() {
        this.updateIsLoading(true);

        const groupedResponses = groupBy(this.selectedResponses, a => a.urlDisplay);

        let uniqueResponses: HttpResponseTableModel[] = [];
        Object.entries(groupedResponses).forEach(([_key, value])=>{
            const mostRecentResponse = orderBy(value, 'date', 'desc')[0];
            uniqueResponses.push(mostRecentResponse);
        });
        uniqueResponses = orderBy(uniqueResponses, 'date', 'asc');

        from(uniqueResponses).pipe(
            concatMap(response => of(response).pipe(delay(this.DOWNLOAD_DELAY))),
            finalize(() => this.updateIsLoading(false))
        ).subscribe(response =>{
            this.downloadUrl(response, false);
        });

        this.selectedResponses = [];
    }

    private updateIsLoading(isLoading: boolean) {
        this.isLoading = isLoading;
        this.isLoadingChange.emit(isLoading);
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
