import sanitize from "sanitize-filename";

export function distinct<T>(list: T[]): T[] {
    return Array.from(new Set([... list]));
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
