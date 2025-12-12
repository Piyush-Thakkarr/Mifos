import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ClientportalRoutingModule } from './clientportal-routing.module';
import { ClientportalLoginComponent } from './pages/login/login.component';
import { ClientportalDashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientportalLoansComponent } from './pages/loans/loans.component';
import { ClientportalLoanDetailsComponent } from './pages/loans/loan-details/loan-details.component';
import { ClientportalTransactionsComponent } from './pages/transactions/transactions.component';
import { ClientportalNotificationsComponent } from './pages/notifications/notifications.component';
import { ClientportalSupportComponent } from './pages/support/support.component';
import { ClientportalLoanApplicationComponent } from './pages/loan-application/loan-application.component';
import { ClientportalCalculatorsComponent } from './pages/calculators/calculators.component';
import { ClientportalApplicationStatusComponent } from './pages/application-status/application-status.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    ClientportalLoginComponent,
    ClientportalDashboardComponent,
    ClientportalLoansComponent,
    ClientportalLoanDetailsComponent,
    ClientportalTransactionsComponent,
    ClientportalNotificationsComponent,
    ClientportalSupportComponent,
    ClientportalLoanApplicationComponent,
    ClientportalCalculatorsComponent,
    ClientportalApplicationStatusComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
    ClientportalRoutingModule
  ]
})
export class ClientportalModule {}
