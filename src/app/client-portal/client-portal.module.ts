import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientPortalRoutingModule } from './client-portal-routing.module';
import { ClientLoginComponent } from './components/client-login/client-login.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { ClientApiService } from './services/client-api.service';
import { LoanDetailsComponent } from './components/loan-details/loan-details.component';
import { LoanApiService } from './services/loan-api.service';
import { RepaymentScheduleComponent } from './components/repayment-schedule/repayment-schedule.component';
import { TransactionsComponent } from './components/transactions/transactions.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ClientPortalRoutingModule,
    HttpClientModule,
    // CLIENT-PORTAL: Import standalone components
    ClientLoginComponent,
    ClientDashboardComponent,
    LoanDetailsComponent,
    RepaymentScheduleComponent,
    TransactionsComponent
  ],
  // CLIENT-PORTAL: No declarations needed for standalone components
  declarations: [],
  // CLIENT-PORTAL: Provide services within feature scope only
  providers: [
    ClientApiService,
    LoanApiService
  ]
  // TODO: Additional Client Portal components will be declared in later steps.
})
export class ClientPortalModule {}
