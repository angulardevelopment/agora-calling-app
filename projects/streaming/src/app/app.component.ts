import { CommonService } from './services/common.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'streaming';
  hide = true;
  constructor(private router: Router, public common: CommonService) { }
  open(value: number) {
    if (value == 3) {
      this.router.navigate([`/live`]);
      this.hide = false;
    } else {
      this.router.navigate([`/staging/${value}`]);
      this.hide = false;
    }
  }
}
