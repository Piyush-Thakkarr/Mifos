/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'mifosx-clientportal-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class ClientportalSidebarComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  private subscription?: Subscription;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.subscription = this.sidebarService.sidebarOpen$.subscribe((open) => {
      this.sidebarOpen = open;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  closeSidebar(): void {
    this.sidebarService.close();
  }
}
