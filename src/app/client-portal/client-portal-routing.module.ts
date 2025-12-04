import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientLoginComponent } from './components/client-login/client-login.component';
import { ClientLayoutComponent } from './components/layout/client-layout.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { LoanDetailsComponent } from './components/loan-details/loan-details.component';
import { RepaymentScheduleComponent } from './components/repayment-schedule/repayment-schedule.component';
import { TransactionsComponent } from './components/transactions/transactions.component';

const routes: Routes = [
  { path: '', component: ClientLoginComponent },
  {
    path: 'portal/:clientId',
    component: ClientLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'loans', loadComponent: () => import('./components/client-loans/client-loans.component').then(m => m.ClientLoansComponent) },
      { path: 'loan/:loanId', component: LoanDetailsComponent },
      { path: 'loan/:loanId/repayments', component: RepaymentScheduleComponent },
      { path: 'loan/:loanId/transactions', component: TransactionsComponent },
      { path: 'transactions', loadComponent: () => import('./components/client-transactions/client-transactions.component').then(m => m.ClientTransactionsComponent) },
      { path: 'notifications', loadComponent: () => import('./components/client-notifications/client-notifications.component').then(m => m.ClientNotificationsComponent) },
      { path: 'support', loadComponent: () => import('./components/client-support/client-support.component').then(m => m.ClientSupportComponent) },
    ]
  },
  // Legacy routes for backward compatibility
  { path: 'client-dashboard/:clientId', redirectTo: 'portal/:clientId/dashboard', pathMatch: 'full' },
  { path: 'client-loan/:loanId', component: LoanDetailsComponent },
  { path: 'client-loan/:loanId/repayments', component: RepaymentScheduleComponent },
  { path: 'client-loan/:loanId/transactions', component: TransactionsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientPortalRoutingModule { }

