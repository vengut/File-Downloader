export interface HttpResponseModel {
    id: string;
    url: string;
    timestamp: number;
    type: string;
    tab: string;
    method: string;
    status: number;
    statusText: string;
    fromCache: boolean;
}

export var ResourceTypes = [
    'main_frame',
    'sub_frame',
    'stylesheet',
    'script',
    'image',
    'font',
    'object',
    'xmlhttprequest',
    'ping',
    'csp_report',
    'media',
    'websocket',
    'other'
];
