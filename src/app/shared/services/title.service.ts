import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({providedIn: 'root'})
export class TitleService {
    private titleRegex: RegExp;
    
    constructor(private title: Title) {
        this.titleRegex = /(Sniffer)(\.\.\.)?( )?(\d+)?( )?(\((\d+)\))?/
    }

    public getTitle(): ExtensionTitle {
        const matches = this.title.getTitle().match(this.titleRegex);

        if (matches === null || matches === undefined) {
            return <ExtensionTitle> {
                default: "Sniffer"
            };
        }
        else {
            return <ExtensionTitle> {
                default: matches[ExtensionTitleParts.Default],
                isLoading: matches[ExtensionTitleParts.IsLoading],
                totalCount: matches[ExtensionTitleParts.TotalCount],
                filteredCount: matches[ExtensionTitleParts.FilteredCount]
            }
        }
    }

    public updateIsLoading(isLoading: boolean) {
        let replacer = ``;
        for (const titlePart of ExtensionTitlePartsIterator()) {
            if (titlePart === ExtensionTitleParts.IsLoading) {
                if (isLoading) {
                    replacer += "...";
                }
            }
            else {
                replacer += `$${titlePart}`
            }
        }

        this.updateTitle(replacer);
    }

    public updateTotalCount(totalCount: number) {
        let replacer = ``;
        for (const titlePart of ExtensionTitlePartsIterator()) {
            if (titlePart === ExtensionTitleParts.TotalCount) {
                replacer += totalCount;
            }
            else if (titlePart === ExtensionTitleParts.SpaceBetweenLoadingAndTotalCount) {
                replacer += ` `;
            }
            else {
                replacer += `$${titlePart}`
            }
        }

        this.updateTitle(replacer);
    }

    public updateFilteredCount(filteredCount: number) {
        let replacer = ``;
        for (const titlePart of ExtensionTitlePartsIterator()) {
            if (titlePart === ExtensionTitleParts.FilteredCount) {
                replacer += `(${filteredCount})`;
            }
            else if (titlePart === ExtensionTitleParts.SpaceBetweenTotalCountAndFilteredCount) {
                replacer += ` `;
            }
            else {
                replacer += `$${titlePart}`
            }
        }

        this.updateTitle(replacer);
    }

    private updateTitle(replacer: string) {
        const startTime = new Date().getTime();

        const currentTitle = this.title.getTitle();
        const matches = currentTitle.match(this.titleRegex)?.slice();
        const newTitle = currentTitle
            .replace(this.titleRegex, replacer)
            .replace(/  /g, " ");
        this.title.setTitle(newTitle);
        
        const endTime = new Date().getTime();

        console.log(currentTitle, matches, replacer, newTitle, startTime, endTime - startTime);
    }
}

export interface ExtensionTitle {
    default: string;
    isLoading?: string;
    totalCount?: string;
    filteredCount?: string;
}

export enum ExtensionTitleParts {
    Default = 1,
    IsLoading,
    SpaceBetweenLoadingAndTotalCount,
    TotalCount,
    SpaceBetweenTotalCountAndFilteredCount,
    FilteredCount
}

export function* ExtensionTitlePartsIterator() {
    for (const titlePart in ExtensionTitleParts) {
        if (!isNaN(Number(titlePart))) {
            const e: ExtensionTitleParts = Number(titlePart);
            yield e;
        }
    }
}