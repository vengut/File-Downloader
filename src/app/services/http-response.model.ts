export class HttpResponseModel {
    id!: string;
    url!: string;
    timestamp!: number;
    type!: string;
    tabId!: number;
    method!: string;
    status!: number;
    statusText!: string;
    fromCache!: boolean;
}
