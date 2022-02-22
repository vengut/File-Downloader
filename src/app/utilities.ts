export function distinct<T>(list: T[]): T[] {
    return Array.from(new Set([... list]));
}

export function getPathName(url: string): string {
    return new URL(url).pathname;
}

export function getExtension(url: string): string {
    const pathName = getPathName(url);
    const extension = pathName.split('.').pop();

    if (extension === undefined || extension.length === pathName.length){
        return "";
    }

    return extension;
}

export function containedInList(value: string, filters: string[]): boolean {
    return filters.some(filter => value.toLowerCase().includes(filter.toLowerCase()));
}