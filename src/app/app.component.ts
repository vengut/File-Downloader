import { Component } from '@angular/core';
import { ChromeStorageService } from './services/chrome-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private chromeStorageService: ChromeStorageService) {}
  
  public getLinks() {
    this.chromeStorageService.getLinks().subscribe(links => console.log(links));
  }

  public clearLinks() {
    this.chromeStorageService.setLinks([]);
  }
}
