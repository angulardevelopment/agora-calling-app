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

  ngOnInit() {
    this.common.getAppDetails();
  this.init();
  }

  open(value: number) {
    localStorage.setItem('app', value.toString());
    this.setApp(value);
    if (value == 3) {
      this.router.navigate([`/live`]);
    } else {
      this.router.navigate([`/staging/${value}`]);
    }
  }

  init(){
    const detail = localStorage.getItem('app');
    if(detail)
    this.setApp(parseInt(detail));
  }

  setApp(value: number) {
    if (value == 3) {
      this.hide = false;
    } else {
      this.hide = false;
    }
  }
}
