import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {HttpResponseModel, ResourceTypes} from "../services/chrome/chrome-web-request.model";
import {SelectItem} from "primeng/api/selectitem";
import {containedInList, distinct, FileName, getPathName, prettyPrintJson} from "../utilities";
import {HttpResponseTableColumn, HttpResponseTableModel} from "./responses-table.model";
import {Table} from "primeng/table";
import {FilterService, MenuItem} from "primeng/api";
import {DatePipe} from "@angular/common";
import {groupBy, isEqual, orderBy} from "lodash"
import {concatMap, debounceTime, delay, distinctUntilChanged, finalize, from, mergeMap, of} from "rxjs";
import {ToastService, ToastType} from "../services/toast.service";
import {ChromeDownloadsService} from '../services/chrome/chrome-downloads.service';
import {ChromeSettingsService} from '../services/chrome/chrome-settings.service';
import {Clipboard} from "@angular/cdk/clipboard";
import {ChromeStorageService} from "../services/chrome/chrome-storage.service";
import {FormControl, FormControlStatus} from "@angular/forms";
import {SelectItemList} from "../settings/settings.model";

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
    public selectedResponses: HttpResponseTableModel[] = [];
    public allUrlFilterOptions: SelectItemList = [];
    public urlFilterFormControl: FormControl = new FormControl([]);

    public get selectedUrlFilter(): SelectItemList {
        return this.urlFilterFormControl.value ?? [];
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

    public get responseActions(): { [id: string]: MenuItem[] } {
        return this.responses.reduce((buttonActions, response) => {
            buttonActions[response.id] = [
                {
                    label: "Save As",
                    icon: "pi pi-save",
                    command: () => {
                        this.downloadUrl(response, true);
                    }
                },
                {
                    label: "Download",
                    icon: "pi pi-download",
                    command: () => {
                        this.downloadUrl(response, false);
                    }
                },
                {
                    separator: true
                },
                {
                    label: "Stream",
                    icon: "pi pi-video",
                    command: () => {
                        this.streamUrl(response);
                    }
                },
            ];

            return buttonActions;
        }, <{ [id: string]: MenuItem[] }> {});
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

        this.filterService.register('containedInList', (value: string, filters: SelectItemList): boolean => {
            if (filters === undefined) {
                return true;
            }

            return filters.some(filter => value.toLowerCase().includes(filter.value.toLowerCase()));
        });
    }

    ngOnInit() {
        this.chromeSettingsService.getUrlFilterOptions().subscribe((allUrlFilterOptions)=> {
            this.allUrlFilterOptions = allUrlFilterOptions;
            this.urlFilterFormControl.setValue(this.allUrlFilterOptions.filter(u => u.isSelected));
            this.filterUrls();
        });

        this.chromeStorageService.getStorageChanges()
            .subscribe(storage => {
                if (storage.responses) {
                    this.responses = this.mapResponsesToTableModel(storage.responses);
                }
            });

        this.urlFilterFormControl.valueChanges.pipe(
            distinctUntilChanged((a, b) => isEqual(a, b)),
            concatMap((selectedUrlFilterOptions: SelectItemList) => {
                selectedUrlFilterOptions.forEach(s => {
                    const option = this.allUrlFilterOptions.find(o => o.value === s.value);

                    if (option) {
                        option.isSelected = true;
                    }
                });

                this.filterUrls();

                return this.chromeSettingsService.setUrlFilterOptions(this.allUrlFilterOptions);
            })
        )
        .subscribe();
    }

    public filterUrls() {
        this.table.filter(this.selectedUrlFilter, 'url', 'containedInList');
    }

    public downloadUrl(response: HttpResponseTableModel, saveAs: boolean = true) {
        const fileName: FileName = new FileName(response.url, response.tab);

        this.chromeDownloadsService.downloadFile(response.url, fileName.toString(), saveAs).subscribe({
            next: (downloadId) => {
                console.log(downloadId);
                if (!saveAs) {
                    let message = `Date: ${response.dateDisplay}`;

                    if (fileName.toString() !== undefined) {
                        message += ` <br/> Filename: ${fileName.toString()}`;
                    }

                    this.toastService.toast(ToastType.Success, "Download Started", message);
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
