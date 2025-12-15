/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, Input } from '@angular/core';

@Component({
  selector: 'mifosx-clientportal-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false
})
export class ClientportalLayoutComponent {
  @Input() userName: string = 'User';
}
