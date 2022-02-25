import {SelectItemList} from "../../settings/settings.model";

export interface ChromeSettingsModel {
    urlFilterOptions?: SelectItemList;
}

export enum ChromeSettingsKey {
    UrlFilterOptions = 'urlFilterOptions'
}
