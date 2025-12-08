import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientportalLoginComponent } from './pages/login/login.component';
import { ClientportalDashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientportalLoansComponent } from './pages/loans/loans.component';
import { ClientportalLoanDetailsComponent } from './pages/loans/loan-details/loan-details.component';
import { ClientportalTransactionsComponent } from './pages/transactions/transactions.component';
import { ClientportalNotificationsComponent } from './pages/notifications/notifications.component';
import { ClientportalSupportComponent } from './pages/support/support.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: ClientportalLoginComponent
  },
  {
    path: 'dashboard',
    component: ClientportalDashboardComponent
  },
  {
    path: 'loans',
    component: ClientportalLoansComponent
  },
  {
    path: 'loans/:id',
    component: ClientportalLoanDetailsComponent
  },
  {
    path: 'transactions',
    component: ClientportalTransactionsComponent
  },
  {
    path: 'notifications',
    component: ClientportalNotificationsComponent
  },
  {
    path: 'support',
    component: ClientportalSupportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientportalRoutingModule {}
