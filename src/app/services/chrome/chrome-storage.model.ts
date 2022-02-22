import {HttpResponseModel} from "./chrome-web-request.model";

export interface ChromeStorageModel {
    isListening: boolean;
    responses: HttpResponseModel;
}

export enum ChromeStorageKey {
    IsListening = 'isListening',
    Responses = 'responses'
}

export type StorageNamespace = 'sync' | 'local' | 'managed';

export interface ChromeStorageChangesModel {
    isListeningChange?: boolean;
    responsesChange?: HttpResponseModel[];
    namespace:  StorageNamespace;
}