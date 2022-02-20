import { Component, OnInit } from '@angular/core';
import { interval, switchMap } from 'rxjs';
import { ChromeRuntimeService } from './services/chrome-runtime.service';
import { ChromeStorageService } from './services/chrome-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public isListening: boolean = false;
  
  constructor(
    private chromeRuntimeService: ChromeRuntimeService,
    private chromeStorageService: ChromeStorageService
  ) { }

  ngOnInit() {
    interval(100)
      .pipe(switchMap(() => this.chromeStorageService.getIsListening()))
      .subscribe((isListening) => {
        this.isListening = isListening;
      });
  }

  public toggleListener() {
    this.chromeRuntimeService.toggleListener();
  }

  public getResponses() {
    this.chromeStorageService.getResponses().subscribe(responses => console.log(responses));
  }

  public clearResponses() {
    this.chromeStorageService.clearResponses();
  }
}
