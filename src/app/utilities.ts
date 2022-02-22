import sanitize from "sanitize-filename";

export function distinct<T>(list: T[]): T[] {
    return Array.from(new Set([... list]));
}

export function getPathName(url: string): string {
    return new URL(url).pathname;
}

export function containedInList(value: string, filters: string[]): boolean {
    return filters.some(filter => value.toLowerCase().includes(filter.toLowerCase()));
}

export class FileName {
    public name: string;
    public extension: string;
    public createdDate: Date;
    private url: string;

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
        this.createdDate = new Date();
    }

    public toString() {
        return `${this.name}.${this.extension}`;
    }

    public shortenedString() {
        return `${this.name.substring(0, 50)}.${this.extension}`;
    }

    private static getFileNameAndExtension(url: string): { name: string, extension: string } {
        const pathName = getPathName(url);
        const fileParts = pathName.split('.');

        const name = fileParts.join("");
        const extension = fileParts.pop();
        if (extension === undefined || extension.length === pathName.length) {
            return {
                name,
                extension: ""
            };
        }

        return {
            name,
            extension
        };
    }
}
