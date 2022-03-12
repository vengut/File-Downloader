export interface HttpResponseTableColumn {
    field: string;
    header: string;
    sortable: boolean;
    filterable?: boolean;
}

export interface HttpResponseTableModel {
    id: string;
    url: string;
    urlDisplay: string;
    date: Date;
    dateDisplay: string;
    type: string;
    tab: string;
    tabDisplay: string;
}

export enum SortOrder {
    Descending = -1,
    Ascending = 1
}