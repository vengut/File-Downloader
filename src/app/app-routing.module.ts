import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { ResponsesTableComponent } from './responses-table/responses-table.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
    {
        path: '',
        component: ResponsesTableComponent
    },
    {
        path: 'settings',
        component: SettingsComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
