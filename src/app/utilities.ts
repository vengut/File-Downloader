export function distinct<T>(list: T[]) {
    return Array.from(new Set([... list]));
}
