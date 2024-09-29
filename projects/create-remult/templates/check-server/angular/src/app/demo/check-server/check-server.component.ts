import { Component, signal, type OnInit } from '@angular/core';
import { remult } from 'remult';

@Component({
  selector: 'app-check-server',
  standalone: true,
  imports: [],
  providers: [],
  templateUrl: './check-server.component.html',
})
export class CheckServerComponent implements OnInit {
  status = signal<'⌛' | '✅' | '❌'>('⌛');

  constructor() {}

  async ngOnInit() {
    try {
      await remult.initUser();
      this.status.set('✅');
    } catch {
      this.status.set('❌');
    }
  }
}
