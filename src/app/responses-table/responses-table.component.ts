import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpResponseModel, ResourceTypes} from "../shared/services/chrome/chrome-web-request.model";
import {SelectItem} from "primeng/api/selectitem";
import {distinct, FileName, getFormControlChanges, getPathName, isTableFiltered} from "../shared/services/utilities";
import {HttpResponseTableColumn, HttpResponseTableModel, SortOrder} from "./responses-table.model";
import {Table} from "primeng/table";
import {FilterService, MenuItem} from "primeng/api";
import {DatePipe} from "@angular/common";
import {groupBy, orderBy} from "lodash"
import {concatMap, delay, finalize, forkJoin, from, of} from "rxjs";
import {ToastService, ToastType} from "../shared/services/toast.service";
import {ChromeDownloadsService} from '../shared/services/chrome/chrome-downloads.service';
import {ChromeSettingsService} from '../shared/services/chrome/chrome-settings.service';
import {Clipboard} from "@angular/cdk/clipboard";
import {ChromeStorageService} from "../shared/services/chrome/chrome-storage.service";
import {FormControl} from "@angular/forms";
import {SelectItemList} from "../settings/settings.model";
import { ActivatedRoute } from '@angular/router';
import { TitleService } from '../shared/services/title.service';

@Component({
    selector: 'responses-table',
    templateUrl: 'responses-table.component.html'
})
export class ResponsesTableComponent implements OnInit {
    public readonly MAX_CHARACTER_COUNT: number = 69;
    public readonly DATE_FORMAT: string = 'medium';
    public readonly DOWNLOAD_DELAY: number = 2000;

    @ViewChild('dt', {static: false}) public table!: Table;

    public allResponses: HttpResponseTableModel[];
    public selectedResponses: HttpResponseTableModel[];
    public isLoading: boolean;

    public columns: HttpResponseTableColumn[];
    public refreshRate: number;
    public lastRefresh: Date;

    public allUrlFilterOptions: SelectItemList;
    public urlFilterFormControl: FormControl;
    public globalFilterFormControl: FormControl;

    public get selectedUrlFilter(): SelectItemList {
        return this.urlFilterFormControl.value ?? [];
    }

    public get types(): SelectItem[] {
        return ResourceTypes.map(type => (<SelectItem> { label: type, value: type }));
    }

    public get tabs(): SelectItem[] {
        if (this.allResponses) {
            const tabNames = distinct(this.allResponses.map(r => r.tab));
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

    public get lastRefreshLabel(): string {
        const lastRefresh: string = new DatePipe('en-US').transform(this.lastRefresh, 'HH:mm:ss') ?? "Never";

        return `Last Refresh: ${lastRefresh}`;
    }

    public get refreshRateLabel(): string {
        return `${ (this.refreshRate / 1000).toFixed(1) }s`;
    }

    public get isDownloadsEnabled(): boolean {
        return this.selectedResponsesLength > 0;
    }

    public get responseActions(): { [id: string]: MenuItem[] } {
        return this.allResponses.reduce((buttonActions, response) => {
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
        private clipboard: Clipboard,
        private activatedRoute: ActivatedRoute,
        private titleService: TitleService
    ) {
        this.allResponses = [];
        this.isLoading = false;
        this.selectedResponses = [];

        this.columns = [
            { field: 'url', header: 'URL', sortable: true },
            { field: 'date', header: 'Date', sortable: true },
            { field: 'type', header: 'Type', sortable: false },
            { field: 'tab', header: 'Tab', sortable: true },
        ];
        this.refreshRate = 100000;
        this.lastRefresh = new Date("1970");

        this.allUrlFilterOptions = [];
        this.urlFilterFormControl = new FormControl([]);
        this.globalFilterFormControl = new FormControl("");

        this.filterService.register('containedInList', (value: string, filters: SelectItemList): boolean => {
            if (filters === undefined) {
                return true;
            }

            return filters.some(filter => value.toLowerCase().includes(filter.value.toLowerCase()));
        });
    }

    ngOnInit() {
        console.log("Responses Route:", this.activatedRoute.snapshot.data);

        forkJoin([
            this.chromeSettingsService.getRefreshRate(),
            this.chromeSettingsService.getUrlFilterOptions()
        ])
            .subscribe(([refreshRate, allUrlFilterOptions]) => {
                this.refreshRate = refreshRate;

                this.allUrlFilterOptions = allUrlFilterOptions;
                this.urlFilterFormControl.setValue(this.allUrlFilterOptions.filter(u => u.isSelected));
                this.filterUrls();
            });

        this.chromeStorageService.getStorage()
            .subscribe(storage => {
                if (storage && storage.responses) {
                    const allResponses = this.mapResponsesToTableModel(storage.responses);
                    this.allResponses = this.filterDuplicateResponses(allResponses);

                    const filteredCount = this.getFilteredResponsesCount();
                    this.titleService.updateFilteredCount(filteredCount);
                }
                this.lastRefresh = new Date();
            });

        getFormControlChanges<SelectItemList>(this.urlFilterFormControl, 250)
            .pipe(
                concatMap(([selectedUrlFilterOptions, _formState]) => {
                    const urlFilterOptions = this.allUrlFilterOptions
                        .map(option => ({
                            isSelected: selectedUrlFilterOptions.some(s => s.value === option.value),
                            label: option.label,
                            value: option.value
                        }))
                        .slice();
                    return this.chromeSettingsService.setUrlFilterOptions(urlFilterOptions);
                })
            )
            .subscribe(() => {
                this.filterUrls();
            });

        getFormControlChanges<string>(this.globalFilterFormControl, 1000)
            .subscribe(([globalFilter, _status]) => {
                this.table.filterGlobal(globalFilter, 'contains');
            });
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
            error: (err: string) => {
                this.toastService.toast(ToastType.Error, "Failed to Start Download", err);
            }
        });
    }

    public downloadUrls() {
        this.isLoading = true;

        let selectedResponses = this.selectedResponses.slice();
        selectedResponses = this.sortResponses(selectedResponses)

        from(selectedResponses).pipe(
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

    public refreshResponses() {
        this.isLoading = true;
        this.chromeStorageService.getResponses()
            .pipe(
                finalize(() => this.isLoading = false)
            )
            .subscribe(responses => {
                this.allResponses = this.mapResponsesToTableModel(responses);
                this.lastRefresh = new Date();
            });
    }

    public clearResponses() {
        this.chromeStorageService.clearResponses()
            .subscribe(() => {
                this.refreshResponses();
                this.selectedResponses = [];
            });
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

    private getFilteredResponsesCount(): number {
        const filteredResponses = isTableFiltered(this.table) ? this.table.filteredValue ?? [] : this.allResponses;
        return filteredResponses.length;
    }

    private filterDuplicateResponses(responses: HttpResponseTableModel[]): HttpResponseTableModel[] {
        const groupedResponses = groupBy(responses, a => getPathName(a.url));

        let uniqueResponses: HttpResponseTableModel[] = [];
        Object.entries(groupedResponses).forEach(([_key, value])=>{
            const mostRecentResponse = orderBy(value, 'date', 'desc')[0];
            uniqueResponses.push(mostRecentResponse);
        });

        return uniqueResponses;
    }

    private sortResponses(responses: HttpResponseTableModel[]): HttpResponseTableModel[] {
        const sortOrder = this.table.sortOrder === SortOrder.Ascending ? "asc": "desc";
        return orderBy(responses, this.table.sortField, sortOrder);
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
