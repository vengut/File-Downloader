export interface HttpResponseModel {
    id: string;
    url: string;
    date: Date;
    type: string;
    tabId: number;
    method: string;
    status: number;
    statusText: string;
    fromCache: boolean;
}
