import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ButtonModule} from 'primeng/button';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TableModule} from 'primeng/table';
import {ToolbarModule} from "primeng/toolbar";
import {InputTextModule} from "primeng/inputtext";
import {MatCardModule} from "@angular/material/card";
import {CardModule} from "primeng/card";


@NgModule({
    declarations: [
        AppComponent
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
        CardModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
