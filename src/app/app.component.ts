import { Component } from '@angular/core';
import { ChromeRuntimeService } from './services/chrome-runtime.service';
import { ChromeStorageService } from './services/chrome-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private chromeRuntimeService: ChromeRuntimeService,
    private chromeStorageService: ChromeStorageService) {
  }

  public startListener() {
    this.chromeRuntimeService.startListener();
  }

  public stopListener() {
    this.chromeRuntimeService.stopListener();
  }

  public getResponses() {
    this.chromeStorageService.getResponses().subscribe(responses => console.log(responses));
  }

  public clearResponses() {
    this.chromeStorageService.clearResponses();
  }
}
