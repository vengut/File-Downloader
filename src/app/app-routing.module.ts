import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { AppComponent } from './app.component';
import { ResponsesTableComponent } from './responses-table/responses-table.component';
import { SettingsComponent } from './settings/settings.component';
import { ChromeSettingsResolver } from './shared/resolvers/chrome-settings.resolver';
import { ChromeStorageResolver } from './shared/resolvers/chrome-storage.resolver';

const routes: Routes = [
    { 
        path: '', 
        component: ResponsesTableComponent,
        resolve: {
            settings: ChromeSettingsResolver,
            storage: ChromeStorageResolver
        }
    },
    {
        path: 'settings',
        component: SettingsComponent,
        resolve: {
            settings: ChromeSettingsResolver
        }
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
