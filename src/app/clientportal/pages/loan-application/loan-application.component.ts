/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-loan-application',
  templateUrl: './loan-application.component.html',
  styleUrls: ['./loan-application.component.scss'],
  standalone: false
})
export class ClientportalLoanApplicationComponent implements OnInit {
  currentStep = 1;
  loading = false;
  error: string | null = null;

  // Form groups for each step
  step1Form: FormGroup;
  step2Form: FormGroup;

  // Data
  loanProducts: any[] = [];
  selectedProduct: any = null;
  productTemplate: any = null;
  repaymentSchedule: any[] = [];
  calculatedEMI: number = 0;
  totalInterest: number = 0;
  totalAmount: number = 0;

  // Options
  termFrequencyTypes: any[] = [
    { id: 0, value: 'Days' },
    { id: 1, value: 'Weeks' },
    { id: 2, value: 'Months' },
    { id: 3, value: 'Years' }
  ];

  interestTypes: any[] = [
    { id: 0, value: 'Flat' },
    { id: 1, value: 'Declining Balance' }
  ];

  amortizationTypes: any[] = [
    { id: 0, value: 'Equal Principal Payments' },
    { id: 1, value: 'Equal Installments' }
  ];

  interestCalculationPeriodTypes: any[] = [
    { id: 0, value: 'Daily' },
    { id: 1, value: 'Same as repayment period' }
  ];

  transactionProcessingStrategies: any[] = [];

  clientProfile: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.step1Form = this.fb.group({
      productId: [
        '',
        Validators.required
      ],
      submittedOnDate: [
        new Date(),
        Validators.required
      ],
      expectedDisbursementDate: [
        '',
        Validators.required
      ],
      externalId: [''],
      loanOfficerId: [''],
      loanPurposeId: [''],
      fundId: [''],
      linkAccountId: [''],
      createStandingInstructionAtDisbursement: [false]
    });

    this.step2Form = this.fb.group({
      principalAmount: [
        '',
        [
          Validators.required,
          Validators.min(1)]
      ],
      numberOfRepayments: [
        '',
        [
          Validators.required,
          Validators.min(1)]
      ],
      repaymentEvery: [
        '',
        [
          Validators.required,
          Validators.min(1)]
      ],
      repaymentFrequencyType: [
        '',
        Validators.required
      ],
      loanTermFrequency: [
        { value: '', disabled: true },
        Validators.required
      ],
      loanTermFrequencyType: [
        '',
        Validators.required
      ],
      interestRatePerPeriod: [{ value: '', disabled: true }], // READ-ONLY
      interestRateFrequencyType: [''],
      interestType: [
        '',
        Validators.required
      ],
      amortizationType: [
        '',
        Validators.required
      ],
      interestCalculationPeriodType: [
        '',
        Validators.required
      ],
      transactionProcessingStrategyCode: [
        '',
        Validators.required
      ],
      repaymentsStartingFromDate: [''],
      interestChargedFromDate: [''],
      graceOnPrincipalPayment: [''],
      graceOnInterestPayment: [''],
      graceOnInterestCharged: [''],
      inArrearsTolerance: [''],
      allowPartialPeriodInterestCalculation: [false]
    });
  }

  ngOnInit(): void {
    this.loadLoanProducts();
    this.loadClientProfile();

    // Set default submitted date to today
    const today = new Date();
    this.step1Form.patchValue({
      submittedOnDate: today.toISOString().split('T')[0]
    });

    // Watch for product selection changes
    this.step1Form.get('productId')?.valueChanges.subscribe((productId) => {
      if (productId) {
        this.loadProductTemplate(Number(productId));
      }
    });

    // Auto-calculate loan term when repayments change
    this.step2Form.get('numberOfRepayments')?.valueChanges.subscribe(() => {
      this.calculateLoanTerm();
    });

    this.step2Form.get('repaymentEvery')?.valueChanges.subscribe(() => {
      this.calculateLoanTerm();
    });
  }

  loadClientProfile(): void {
    this.authService.client().subscribe({
      next: (result: any) => {
        this.clientProfile = result.profile || null;
      },
      error: () => {
        // Silently fail
      }
    });
  }

  loadLoanProducts(): void {
    this.loading = true;
    this.error = null;
    this.authService.loanProducts().subscribe({
      next: (result: any) => {
        this.loading = false;
        this.loanProducts = result.products || [];
        console.log('Loaded loan products:', this.loanProducts.length, this.loanProducts);
        if (this.loanProducts.length === 0) {
          this.error = 'No loan products available. Please contact support.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load loan products. Please try again later.';
        console.error('Error loading loan products:', err);
      }
    });
  }

  loadProductTemplate(productId: number): void {
    this.loading = true;
    this.authService.loanProductTemplate(productId).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.productTemplate = result;
        this.selectedProduct = this.loanProducts.find((p) => p.id === productId);

        // Auto-fill form with product defaults
        if (result) {
          this.step2Form.patchValue({
            principalAmount: result.principal || '',
            numberOfRepayments: result.numberOfRepayments || '',
            repaymentEvery: result.repaymentEvery || '',
            repaymentFrequencyType: result.repaymentFrequencyType?.id || '',
            loanTermFrequencyType: result.termPeriodFrequencyType?.id || '',
            interestRatePerPeriod: result.interestRatePerPeriod || '', // Auto-filled, read-only
            interestRateFrequencyType: result.interestRateFrequencyType?.id || '',
            interestType: result.interestType?.id || '',
            amortizationType: result.amortizationType?.id || '',
            interestCalculationPeriodType: result.interestCalculationPeriodType?.id || '',
            transactionProcessingStrategyCode: result.transactionProcessingStrategyCode || ''
          });

          // Disable fields that can't be overridden
          if (result.product?.allowAttributeOverrides) {
            const overrides = result.product.allowAttributeOverrides;
            if (!overrides.interestType) {
              this.step2Form.get('interestType')?.disable();
            }
            if (!overrides.amortizationType) {
              this.step2Form.get('amortizationType')?.disable();
            }
            if (!overrides.interestCalculationPeriodType) {
              this.step2Form.get('interestCalculationPeriodType')?.disable();
            }
            if (!overrides.transactionProcessingStrategyCode) {
              this.step2Form.get('transactionProcessingStrategyCode')?.disable();
            }
            if (!overrides.repaymentEvery) {
              this.step2Form.get('repaymentEvery')?.disable();
              this.step2Form.get('repaymentFrequencyType')?.disable();
            }
          }

          // Set transaction processing strategies
          if (result.transactionProcessingStrategyOptions) {
            this.transactionProcessingStrategies = result.transactionProcessingStrategyOptions;
          }

          this.calculateLoanTerm();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load product details.';
        console.error('Error loading product template:', err);
      }
    });
  }

  calculateLoanTerm(): void {
    const numberOfRepayments = this.step2Form.get('numberOfRepayments')?.value;
    const repaymentEvery = this.step2Form.get('repaymentEvery')?.value;

    if (numberOfRepayments && repaymentEvery) {
      const loanTerm = numberOfRepayments * repaymentEvery;
      this.step2Form.patchValue({ loanTermFrequency: loanTerm });
    }
  }

  calculateSchedule(): void {
    if (!this.step1Form.valid || !this.step2Form.valid) {
      return;
    }

    this.loading = true;

    // Prepare form data with proper date formatting
    const step1Data = this.step1Form.getRawValue();
    const step2Data = this.step2Form.getRawValue();

    const formData: any = {
      ...step1Data,
      ...step2Data,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en'
    };

    // Convert dates to ISO format strings
    if (formData.submittedOnDate) {
      formData.submittedOnDate = new Date(formData.submittedOnDate).toISOString().split('T')[0];
    }
    if (formData.expectedDisbursementDate) {
      formData.expectedDisbursementDate = new Date(formData.expectedDisbursementDate).toISOString().split('T')[0];
    }

    // Convert empty strings to null for optional fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
        delete formData[key];
      }
    });

    this.authService.calculateLoanSchedule(formData).subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result.repaymentSchedule && result.repaymentSchedule.periods) {
          this.repaymentSchedule = result.repaymentSchedule.periods;
          this.calculateTotals();
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error calculating schedule:', err);
        this.error = err?.error?.details || 'Failed to calculate repayment schedule.';
      }
    });
  }

  calculateTotals(): void {
    if (this.repaymentSchedule.length > 0) {
      const principal = this.step2Form.get('principalAmount')?.value || 0;
      this.totalInterest = this.repaymentSchedule.reduce((sum: number, period: any) => {
        return sum + (period.interestCharged || 0);
      }, 0);
      this.totalAmount = principal + this.totalInterest;
      this.calculatedEMI = this.repaymentSchedule[0]?.totalDueForPeriod || 0;
    }
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.step1Form.valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.step2Form.valid) {
      this.calculateSchedule();
      this.currentStep = 3;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitApplication(): void {
    if (!this.step1Form.valid || !this.step2Form.valid) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Prepare form data with proper date formatting
    const step1Data = this.step1Form.getRawValue();
    const step2Data = this.step2Form.getRawValue();

    const formData: any = {
      ...step1Data,
      ...step2Data,
      loanType: 'individual',
      dateFormat: 'yyyy-MM-dd',
      locale: 'en'
    };

    // Convert dates to ISO format strings
    if (formData.submittedOnDate) {
      formData.submittedOnDate = new Date(formData.submittedOnDate).toISOString().split('T')[0];
    }
    if (formData.expectedDisbursementDate) {
      formData.expectedDisbursementDate = new Date(formData.expectedDisbursementDate).toISOString().split('T')[0];
    }
    if (formData.repaymentsStartingFromDate) {
      formData.repaymentsStartingFromDate = new Date(formData.repaymentsStartingFromDate).toISOString().split('T')[0];
    }
    if (formData.interestChargedFromDate) {
      formData.interestChargedFromDate = new Date(formData.interestChargedFromDate).toISOString().split('T')[0];
    }

    // Convert empty strings to null for optional fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
        delete formData[key];
      }
    });

    this.authService.submitLoanApplication(formData).subscribe({
      next: (result: any) => {
        this.loading = false;
        // Navigate to application status page or loans list
        if (result.resourceId || result.loanId) {
          this.router.navigate(['/clientportal/loans']);
        } else {
          this.router.navigate(['/clientportal/loans']);
        }
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.error?.details) {
          this.error = err.error.details;
        } else if (err?.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Failed to submit loan application. Please try again.';
        }
        console.error('Error submitting application:', err);
      }
    });
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }

  getFrequencyLabel(frequencyTypeId: number): string {
    const type = this.termFrequencyTypes.find((t) => t.id === frequencyTypeId);
    return type ? type.value : '';
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '—';
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (Array.isArray(dateValue) && dateValue.length === 3) {
      const [
        year,
        month,
        day
      ] = dateValue;
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return '—';
  }

  showAdditionalDetails = false;
  showOptionalSettings = false;
}
