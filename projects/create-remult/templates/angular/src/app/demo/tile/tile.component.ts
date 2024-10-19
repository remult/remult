import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styles: [':host { display: contents; }'],
  imports: [CommonModule],
  standalone: true,
})
export class TileComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() status?: TileStatus;
  @Input() width: 'full' | 'half' | 'third' | 'fourth' = 'full';
  @Input() icon?: string = '';
  @Input() className: string = '';
}
export type TileStatus = 'Success' | 'Error' | 'Warning' | 'Info' | 'Loading';
