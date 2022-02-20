export function distinct<T>(list: T[]) {
    return Array.from(new Set([... list]));
}

export function getPathName(url: string) {
    return new URL(url).pathname;
}

export function getExtension(url: string) {
    const pathName = getPathName(url);
    const extension = pathName.split('.').pop();

    if (extension === undefined || extension.length === pathName.length){
        return "";
    }

    return extension;
}
