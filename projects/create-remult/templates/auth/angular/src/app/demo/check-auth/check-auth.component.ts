import { Component, type OnInit } from '@angular/core';
import { remult } from 'remult';

@Component({
  selector: 'app-check-auth',
  standalone: true,
  imports: [],
  templateUrl: './check-auth.component.html',
})
export class CheckAuthComponent implements OnInit {
  loaded = false;

  remult = remult;
  async ngOnInit() {
    try {
      await remult.initUser();
      this.loaded = true;
    } catch {}
  }
}
