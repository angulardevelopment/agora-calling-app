import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'streaming';
  hide = true;
  constructor(private router: Router){

  }
  open(value){
    this.router.navigate([`/user/${value}`]);
    this.hide = false;

  }
}
