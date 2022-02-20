export interface HttpResponseTableColumn {
    field: string;
    header: string;
    sortable: boolean;
    filterable?: boolean;
}

export interface HttpResponseTableModel {
    id: string;
    url: string;
    date: Date;
    type: string;
    tab: string;
}
