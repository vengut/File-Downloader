import sanitize from "sanitize-filename";
import {FormControl, FormControlStatus} from "@angular/forms";
import {combineLatest, debounceTime, distinctUntilChanged, Observable} from "rxjs";
import {isEqual} from "lodash";
import {ChromeSettingsService} from "./chrome/chrome-settings.service";
import {Table} from "primeng/table";

export function prettyPrintObject<T>(obj: T){
    return JSON.stringify(obj, null, 4)
}

export function prettyPrintJson(json: string) {
    return prettyPrintObject(JSON.parse(json));
}

export function distinct<T>(list: T[]): T[] {
    return Array.from(new Set([... list]));
}

export function isTableFiltered(table: Table): boolean {
    return Object.values(table.filters).map(filter => {
        let filters: any[];

        if (Array.isArray(filter)) {
            filters = [...filter.map(f => f.value)];
        }
        else {
            filters = [ filter.value ];
        }

        return filters.some(f => f !== null && f !== undefined);
    }).some(isFiltered => isFiltered);
}

export function getFormControlChanges<T>(formControl: FormControl, debounceTimeMs: number = ChromeSettingsService.INPUT_DEBOUNCE): Observable<[T,  FormControlStatus]> {
    return  combineLatest([
        formControl.valueChanges,
        formControl.statusChanges,
    ]).pipe(
        debounceTime(debounceTimeMs),
        distinctUntilChanged((_old, _new) => isEqual(_old, _new))
    );
}

export function getPathName(url: string): string {
    try {
        return new URL(url).pathname;
    }
    catch (e) {
        return url;
    }
}

export function containedInList(value: string, filters: string[]): boolean {
    if (filters === undefined) {
        return true;
    }

    return filters.some(filter => value.toLowerCase().includes(filter.toLowerCase()));
}

export class FileName {
    public readonly name: string;
    public readonly extension: string | undefined;
    public readonly createdDate: Date;
    public readonly url: string;

    constructor(url: string, optionalName?: string, createdDate?: Date) {
        this.url = url;

        let {
            name,
            extension
        } = FileName.getFileNameAndExtension(url);

        if (optionalName !== undefined) {
            name = optionalName;
        }

        this.name = sanitize(name);
        this.extension = extension;
        this.createdDate = createdDate ?? new Date();
    }

    public toString() {
        if (this.extension === undefined || this.name === undefined) {
            return undefined;
        }

        return `${this.name}.${this.extension}`;
    }

    private static getFileNameAndExtension(url: string): { name: string, extension: string | undefined } {
        const pathName = getPathName(url);
        const fileParts = pathName.split('.');

        const name = fileParts.join("");
        const extension = fileParts.pop();

        return {
            name,
            extension
        };
    }
}
