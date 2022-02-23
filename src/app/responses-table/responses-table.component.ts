import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpResponseModel, ResourceTypes} from "../services/chrome/chrome-web-request.model";
import {SelectItem} from "primeng/api/selectitem";
import {containedInList, distinct, FileName, getPathName} from "../utilities";
import {HttpResponseTableColumn, HttpResponseTableModel} from "./responses-table.model";
import {Table} from "primeng/table";
import {FilterService} from "primeng/api";
import {DatePipe} from "@angular/common";
import {groupBy, orderBy} from "lodash"
import {concatMap, delay, finalize, from, mergeMap, of} from "rxjs";
import {ToastService, ToastType} from "../services/toast.service";
import {ChromeDownloadsService} from '../services/chrome/chrome-downloads.service';
import {ChromeSettingsService} from '../services/chrome/chrome-settings.service';
import {Clipboard} from "@angular/cdk/clipboard";
import {ChromeStorageService} from "../services/chrome/chrome-storage.service";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'responses-table',
    templateUrl: 'responses-table.component.html'
})
export class ResponsesTableComponent implements OnInit {
    public readonly MAX_CHARACTER_COUNT: number = 69;
    public readonly DATE_FORMAT: string = 'medium';
    public readonly DOWNLOAD_DELAY: number = 2000;

    public isLoading: boolean = false;
    public responses: HttpResponseTableModel[] = [];

    @ViewChild('dt', {static: false}) public table!: Table;

    public columns: HttpResponseTableColumn[] = [];
    public globalFilter: string = "";
    public urlFilterFormControl: FormControl = new FormControl(undefined);
    public selectedResponses: HttpResponseTableModel[] = [];

    public get urlFilter(): string[] {
        return this.urlFilterFormControl.value ?? [];
    }

    public get urlFilterOptions(): SelectItem[] {
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
        private chromeSettingsService: ChromeSettingsService,
        private filterService: FilterService,
        private chromeDownloadsService: ChromeDownloadsService,
        private toastService: ToastService,
        private clipboard: Clipboard
    ) {
        this.columns = [
            { field: 'url', header: 'URL', sortable: true },
            { field: 'date', header: 'Date', sortable: true },
            { field: 'type', header: 'Type', sortable: false },
            { field: 'tab', header: 'Tab', sortable: true },
        ];

        this.filterService.register('containedInList', (value: string, filters: string[]): boolean => containedInList(value, filters));
    }

    ngOnInit() {
        this.chromeStorageService.getAll()
            .subscribe(storage => {
                if (storage.responses) {
                    this.responses = this.mapResponsesToTableModel(storage.responses);
                }
            });

        this.chromeSettingsService.getAll().subscribe(settings => {
            if (settings.urlFilter) {
                this.urlFilterFormControl.setValue(settings.urlFilter);
            }
        });

        this.urlFilterFormControl.valueChanges.pipe(
            mergeMap((urlFilter: string[]) => this.chromeSettingsService.setUrlFilter(urlFilter))
        ).subscribe((urlFilter) => {
            this.filterUrls(urlFilter);
        });
    }

    public downloadUrl(response: HttpResponseTableModel, saveAs: boolean = true) {
        const fileName = new FileName(response.url, response.tab);

        this.chromeDownloadsService.downloadFile(response.url, fileName.toString(), saveAs).subscribe({
            next: (downloadId) => {
                if (!saveAs) {
                    console.log(`Download Started: ${downloadId}`);
                    this.toastService.toast(ToastType.Success, "Download Started", `File Name: ${fileName.shortenedString()}<br/>Date: ${response.dateDisplay}`);
                }
            },
            error: (err: string) =>{
                this.toastService.toast(ToastType.Error, "Failed to Start Download", err);
            }
        });
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
            this.downloadUrl(response, false);
        });

        this.selectedResponses = [];
    }

    public streamUrl(response: HttpResponseTableModel) {
        const file = new FileName(response.url, response.tab);

        const command = `streamlink "hlsvariant://${response.url} name_key=bitrate" best -o "${file.name}.ts"`;

        const isCopied = this.clipboard.copy(command);
        if (isCopied) {
            this.toastService.toast(ToastType.Success, "Copied Command Successfully")
        }
        else {
            this.toastService.toast(ToastType.Warn, "Command", command, 30000, false);
        }
    }

    public filterUrls(urlFilter: string[]) {
        this.table.filter(urlFilter, 'url', 'containedInList');
    }

    private mapResponsesToTableModel(responseData: HttpResponseModel[]): HttpResponseTableModel[] {
        return responseData.map(r => ({
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
