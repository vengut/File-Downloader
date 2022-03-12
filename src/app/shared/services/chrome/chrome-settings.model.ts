import {SelectItemList} from "../../../settings/settings.model";

export interface ChromeSettingsModel {
    urlFilterOptions: SelectItemList;
    refreshRate: number;
}

export enum ChromeSettingsKey {
    UrlFilterOptions = 'urlFilterOptions',
    RefreshRate = 'refreshRate'
}
