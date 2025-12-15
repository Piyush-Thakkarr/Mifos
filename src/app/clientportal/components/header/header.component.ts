/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'mifosx-clientportal-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class ClientportalHeaderComponent {
  @Input() userName: string = 'User';
  @Input() showSidebarToggle: boolean = false;

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }
}
