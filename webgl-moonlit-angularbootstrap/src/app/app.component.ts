import { Component } from '@angular/core';
import {ColorPickerService} from 'angular2-color-picker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  private color: string = '#127dbc';
  title = 'app';
}
