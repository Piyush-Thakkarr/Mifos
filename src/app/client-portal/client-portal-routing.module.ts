import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientLoginComponent } from './components/client-login/client-login.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { LoanDetailsComponent } from './components/loan-details/loan-details.component';
import { RepaymentScheduleComponent } from './components/repayment-schedule/repayment-schedule.component';
import { TransactionsComponent } from './components/transactions/transactions.component';

// TODO: Add future routes:
// /client-login
// /client-dashboard/:clientId
// /client-loan/:loanId
// /client-loan/:loanId/repayments
// /client-loan/:loanId/transactions

// CLIENT-PORTAL: Minimal internal route mapping '' to ClientLoginComponent
const routes: Routes = [
  { path: '', component: ClientLoginComponent },
  // CLIENT-PORTAL: client-dashboard route
  { path: 'client-dashboard/:clientId', component: ClientDashboardComponent },
  // CLIENT-PORTAL: loan details route
  { path: 'client-loan/:loanId', component: LoanDetailsComponent },
  // CLIENT-PORTAL: repayment schedule route
  { path: 'client-loan/:loanId/repayments', component: RepaymentScheduleComponent },
  // CLIENT-PORTAL: transactions route
  { path: 'client-loan/:loanId/transactions', component: TransactionsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientPortalRoutingModule {}
