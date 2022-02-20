export interface HttpResponseModel {
    id: string;
    url: string;
    timestamp: number;
    type: string;
    tab?: string;
    method: string;
    status: number;
    statusText: string;
    fromCache: boolean;
}

export interface HttpResponseTableModel {
    id: string;
    url: string;
    date: Date;
    type: string;
    tab?: string;
}
