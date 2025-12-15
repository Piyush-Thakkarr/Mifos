import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(true);
  sidebarOpen$: Observable<boolean> = this.sidebarOpenSubject.asObservable();

  constructor() {
    // On mobile, sidebar starts closed
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.sidebarOpenSubject.next(false);
    }
  }

  toggle(): void {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }

  open(): void {
    this.sidebarOpenSubject.next(true);
  }

  close(): void {
    // On mobile, allow closing. On desktop, keep it always open.
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.sidebarOpenSubject.next(false);
    }
  }

  get isOpen(): boolean {
    return this.sidebarOpenSubject.value;
  }
}
