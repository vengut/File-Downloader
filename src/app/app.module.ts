import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ButtonModule} from 'primeng/button';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TableModule} from 'primeng/table';
import {ToolbarModule} from "primeng/toolbar";
import {InputTextModule} from "primeng/inputtext";
import {MatCardModule} from "@angular/material/card";
import {CardModule} from "primeng/card";
import {DropdownModule} from "primeng/dropdown";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MultiSelectModule} from "primeng/multiselect";
import {RippleModule} from "primeng/ripple";
import {BadgeModule} from "primeng/badge";
import {ToastrModule} from 'ngx-toastr';
import {ResponsesTableComponent} from './responses-table/responses-table.component';
import {InputNumberModule} from "primeng/inputnumber";
import {MatMenuModule} from "@angular/material/menu";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import { SettingsComponent } from './settings/settings.component';
import {SliderModule} from "primeng/slider";


@NgModule({
    declarations: [
        AppComponent,
        ResponsesTableComponent,
        SettingsComponent
    ],
    imports: [
        MatIconModule,
        MatButtonModule,
        ToggleButtonModule,
        ButtonModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        AppRoutingModule,
        TableModule,
        ToolbarModule,
        InputTextModule,
        MatCardModule,
        CardModule,
        DropdownModule,
        MatToolbarModule,
        MultiSelectModule,
        RippleModule,
        BadgeModule,
        ToastrModule.forRoot(),
        InputNumberModule,
        MatMenuModule,
        MatSidenavModule,
        MatListModule,
        SliderModule,
        ReactiveFormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
