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

  // Options - Microfinance typically uses Days and Weeks
  termFrequencyTypes: any[] = [
    { id: 0, value: 'Days' },
    { id: 1, value: 'Weeks' }
    // Removed Months and Years as they're not typical for microfinance
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
    { id: 1, value: 'Same as repayment period' }
    // Removed 'Daily' - not typical for microfinance (usually same as repayment period)
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
      interestRateFrequencyType: [{ value: '', disabled: true }], // READ-ONLY - set by bank/MFI
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
    this.error = null;
    this.authService.loanProductTemplate(productId).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.productTemplate = result;
        this.selectedProduct = this.loanProducts.find((p) => p.id === productId);

        // Auto-fill form with product defaults
        if (result) {
          const product = result.product || result;

          // First, re-enable all fields (in case switching products)
          this.step2Form.get('interestType')?.enable();
          this.step2Form.get('amortizationType')?.enable();
          this.step2Form.get('interestCalculationPeriodType')?.enable();
          this.step2Form.get('transactionProcessingStrategyCode')?.enable();
          this.step2Form.get('repaymentEvery')?.enable();
          this.step2Form.get('repaymentFrequencyType')?.enable();
          this.step2Form.get('allowPartialPeriodInterestCalculation')?.enable();

          // Auto-fill form with product defaults
          this.step2Form.patchValue({
            principalAmount: result.principal || '',
            numberOfRepayments: result.numberOfRepayments || '',
            repaymentEvery: result.repaymentEvery || '',
            repaymentFrequencyType: result.repaymentFrequencyType?.id || '',
            loanTermFrequencyType: result.termPeriodFrequencyType?.id || '',
            interestRatePerPeriod: result.interestRatePerPeriod || '', // Always read-only (set by bank)
            interestRateFrequencyType: result.interestRateFrequencyType?.id || '',
            interestType: result.interestType?.id || '',
            amortizationType: result.amortizationType?.id || '',
            interestCalculationPeriodType: result.interestCalculationPeriodType?.id || '',
            transactionProcessingStrategyCode: result.transactionProcessingStrategyCode || ''
          });

          // Apply field restrictions based on product configuration
          const overrides = product.allowAttributeOverrides || {};

          // Interest rate is ALWAYS read-only (set by bank/MFI)
          this.step2Form.get('interestRatePerPeriod')?.disable();

          // If product is linked to floating interest rates, hide/disable interest rate field
          if (product.isLinkedToFloatingInterestRates) {
            this.step2Form.get('interestRatePerPeriod')?.disable();
            this.step2Form.get('interestRateFrequencyType')?.disable();
          }

          // Disable fields that can't be overridden based on allowAttributeOverrides
          if (!overrides.interestType) {
            this.step2Form.get('interestType')?.disable();
          }
          if (!overrides.amortizationType) {
            this.step2Form.get('amortizationType')?.disable();
          }
          if (!overrides.interestCalculationPeriodType) {
            this.step2Form.get('interestCalculationPeriodType')?.disable();
            this.step2Form.get('allowPartialPeriodInterestCalculation')?.disable();
          }
          if (!overrides.transactionProcessingStrategyCode) {
            this.step2Form.get('transactionProcessingStrategyCode')?.disable();
          }
          if (!overrides.repaymentEvery) {
            this.step2Form.get('repaymentEvery')?.disable();
            this.step2Form.get('repaymentFrequencyType')?.disable();
          }
          if (!overrides.graceOnPrincipalAndInterestPayment) {
            this.step2Form.get('graceOnPrincipalPayment')?.disable();
            this.step2Form.get('graceOnInterestPayment')?.disable();
          }
          if (!overrides.graceOnArrearsAgeing) {
            this.step2Form.get('graceOnArrearsAgeing')?.disable();
          }
          if (!overrides.inArrearsTolerance) {
            this.step2Form.get('inArrearsTolerance')?.disable();
          }

          // Set transaction processing strategies
          if (result.transactionProcessingStrategyOptions) {
            this.transactionProcessingStrategies = result.transactionProcessingStrategyOptions;
          } else if (result.transactionProcessingStrategyCode) {
            // Fallback: create option from code
            this.transactionProcessingStrategies = [
              {
                code: result.transactionProcessingStrategyCode,
                name: result.transactionProcessingStrategyName || 'Standard'
              }
            ];
          }

          this.calculateLoanTerm();
        }
      },
      error: (err: any) => {
        this.loading = false;
        const errorMsg = err?.error?.details || err?.error?.error || 'Failed to load product details.';
        this.error = errorMsg;
        console.error('Error loading product template:', err);
        // Still try to use basic product data if available
        const product = this.loanProducts.find((p) => p.id === productId);
        if (product) {
          this.selectedProduct = product;

          // Re-enable all fields first
          this.step2Form.get('interestType')?.enable();
          this.step2Form.get('amortizationType')?.enable();
          this.step2Form.get('interestCalculationPeriodType')?.enable();
          this.step2Form.get('transactionProcessingStrategyCode')?.enable();
          this.step2Form.get('repaymentEvery')?.enable();
          this.step2Form.get('repaymentFrequencyType')?.enable();

          // Use basic product data to populate form
          // IMPORTANT: Use the product's frequency types exactly as they are configured
          const repaymentFreqType = product.repaymentFrequencyType?.id ?? product.repaymentFrequencyType?.value ?? '';
          const termFreqType = product.termPeriodFrequencyType?.id ?? product.termPeriodFrequencyType?.value ?? '';
          const interestRateFreqType =
            product.interestRateFrequencyType?.id ?? product.interestRateFrequencyType?.value ?? '';

          this.step2Form.patchValue({
            principalAmount: product.principal || '',
            numberOfRepayments: product.numberOfRepayments || '',
            repaymentEvery: product.repaymentEvery || '',
            repaymentFrequencyType: repaymentFreqType, // Use product's exact value
            loanTermFrequencyType: termFreqType, // Use product's exact value
            interestRatePerPeriod: product.interestRatePerPeriod || '', // Always read-only
            interestRateFrequencyType: interestRateFreqType, // Use product's exact value
            interestType: product.interestType?.id || '',
            amortizationType: product.amortizationType?.id || '',
            interestCalculationPeriodType: product.interestCalculationPeriodType?.id || '',
            transactionProcessingStrategyCode: product.transactionProcessingStrategyCode || ''
          });

          // Apply restrictions from product
          this.step2Form.get('interestRatePerPeriod')?.disable(); // Always read-only
          this.step2Form.get('interestRateFrequencyType')?.disable(); // Also set by bank/MFI

          // Check if product has allowAttributeOverrides (if available in product list)
          if (product.allowAttributeOverrides) {
            const overrides = product.allowAttributeOverrides;
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
              // Ensure we use the product's frequency type (check both id and value)
              const productRepaymentFreq = product.repaymentFrequencyType?.id ?? product.repaymentFrequencyType?.value;
              const productTermFreq = product.termPeriodFrequencyType?.id ?? product.termPeriodFrequencyType?.value;
              if (productRepaymentFreq !== undefined) {
                this.step2Form.patchValue({
                  repaymentFrequencyType: productRepaymentFreq,
                  loanTermFrequencyType: productTermFreq ?? productRepaymentFreq // Use same as repayment if term not specified
                });
              }
            }
          } else {
            // If no overrides defined, assume repayment frequency can't be changed
            this.step2Form.get('repaymentFrequencyType')?.disable();
            if (product.repaymentFrequencyType?.id !== undefined) {
              this.step2Form.patchValue({
                repaymentFrequencyType: product.repaymentFrequencyType.id
              });
            }
          }

          // Set transaction processing strategy
          if (product.transactionProcessingStrategyCode) {
            this.transactionProcessingStrategies = [
              {
                code: product.transactionProcessingStrategyCode,
                name: product.transactionProcessingStrategyName || 'Standard'
              }
            ];
          }

          this.calculateLoanTerm();
        }
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

    // Map form fields to Fineract API field names
    // Get raw values to include disabled fields
    const step2RawData = this.step2Form.getRawValue();

    const formData: any = {
      productId: step1Data.productId,
      principal: step2Data.principalAmount, // Map principalAmount to principal
      numberOfRepayments: step2Data.numberOfRepayments,
      repaymentEvery: step2Data.repaymentEvery,
      repaymentFrequencyType: step2Data.repaymentFrequencyType,
      loanTermFrequency: step2Data.loanTermFrequency || step2Data.numberOfRepayments * step2Data.repaymentEvery, // Calculate if not set
      loanTermFrequencyType: step2Data.loanTermFrequencyType,
      interestRatePerPeriod: step2RawData.interestRatePerPeriod, // Use raw value to get disabled field
      interestRateFrequencyType: step2RawData.interestRateFrequencyType, // Use raw value to get disabled field
      interestType: step2Data.interestType,
      amortizationType: step2Data.amortizationType,
      interestCalculationPeriodType: step2Data.interestCalculationPeriodType,
      transactionProcessingStrategyCode: step2Data.transactionProcessingStrategyCode,
      loanType: 'individual', // Required by Fineract for client portal
      dateFormat: 'yyyy-MM-dd',
      locale: 'en'
    };

    // Add clientId only if available (backend will set it from session if not provided)
    if (this.clientProfile?.id) {
      formData.clientId = this.clientProfile.id;
    }

    // Convert dates to ISO format strings
    if (step1Data.submittedOnDate) {
      formData.submittedOnDate = new Date(step1Data.submittedOnDate).toISOString().split('T')[0];
    }
    if (step1Data.expectedDisbursementDate) {
      formData.expectedDisbursementDate = new Date(step1Data.expectedDisbursementDate).toISOString().split('T')[0];
    }

    // Add optional fields if they have values
    if (step1Data.loanPurposeId) {
      formData.loanPurposeId = step1Data.loanPurposeId;
    }
    if (step2Data.repaymentsStartingFromDate) {
      formData.repaymentsStartingFromDate = new Date(step2Data.repaymentsStartingFromDate).toISOString().split('T')[0];
    }
    if (step2Data.graceOnPrincipalPayment) {
      formData.graceOnPrincipalPayment = step2Data.graceOnPrincipalPayment;
    }
    if (step2Data.graceOnInterestPayment) {
      formData.graceOnInterestPayment = step2Data.graceOnInterestPayment;
    }
    if (step2Data.graceOnInterestCharged) {
      formData.graceOnInterestCharged = step2Data.graceOnInterestCharged;
    }
    if (step2Data.allowPartialPeriodInterestCalculation) {
      formData.allowPartialPeriodInterestCalculation = step2Data.allowPartialPeriodInterestCalculation;
    }

    // Remove null/undefined/empty values, but keep required fields even if empty
    // interestRateFrequencyType might be required by Fineract even if empty
    const requiredFieldsToKeep = [
      'interestRateFrequencyType',
      'interestRatePerPeriod'
    ];
    Object.keys(formData).forEach((key) => {
      if (
        !requiredFieldsToKeep.includes(key) &&
        (formData[key] === '' || formData[key] === null || formData[key] === undefined)
      ) {
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
        // Don't show error if it's a timeout - schedule calculation is optional
        // Users can still submit the application without seeing the schedule
        if (err?.status === 504 || err?.error?.error === 'schedule_calculation_timeout') {
          // Schedule calculation timed out - this is okay, user can still submit
          this.error = null; // Clear error, allow submission
          console.warn('Schedule calculation timed out, but user can still submit application');
        } else {
          // For other errors, show a warning but don't block
          this.error =
            'Schedule preview unavailable: ' +
            (err?.error?.details ||
              err?.error?.error ||
              'Unable to calculate repayment schedule. You can still submit the application.');
        }
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
      // Try to calculate schedule, but don't block navigation if it fails
      this.calculateSchedule();
      // Always allow navigation to step 3, even if schedule calculation is in progress or fails
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

    // Map form fields to Fineract API field names (same as calculateSchedule)
    // Get raw values to include disabled fields
    const step2RawData = this.step2Form.getRawValue();

    const formData: any = {
      productId: step1Data.productId,
      principal: step2Data.principalAmount, // Map principalAmount to principal
      numberOfRepayments: step2Data.numberOfRepayments,
      repaymentEvery: step2Data.repaymentEvery,
      repaymentFrequencyType: step2Data.repaymentFrequencyType,
      loanTermFrequency: step2Data.loanTermFrequency || step2Data.numberOfRepayments * step2Data.repaymentEvery, // Calculate if not set
      loanTermFrequencyType: step2Data.loanTermFrequencyType,
      interestRatePerPeriod: step2RawData.interestRatePerPeriod, // Use raw value to get disabled field
      interestRateFrequencyType: step2RawData.interestRateFrequencyType, // Use raw value to get disabled field
      interestType: step2Data.interestType,
      amortizationType: step2Data.amortizationType,
      interestCalculationPeriodType: step2Data.interestCalculationPeriodType,
      transactionProcessingStrategyCode: step2Data.transactionProcessingStrategyCode,
      loanType: 'individual', // Required by Fineract for client portal
      dateFormat: 'yyyy-MM-dd',
      locale: 'en'
    };

    // Add clientId only if available (backend will set it from session if not provided)
    if (this.clientProfile?.id) {
      formData.clientId = this.clientProfile.id;
    }

    // Convert dates to ISO format strings
    if (step1Data.submittedOnDate) {
      formData.submittedOnDate = new Date(step1Data.submittedOnDate).toISOString().split('T')[0];
    }
    if (step1Data.expectedDisbursementDate) {
      formData.expectedDisbursementDate = new Date(step1Data.expectedDisbursementDate).toISOString().split('T')[0];
    }

    // Add optional fields if they have values
    if (step1Data.loanPurposeId) {
      formData.loanPurposeId = step1Data.loanPurposeId;
    }
    if (step2Data.repaymentsStartingFromDate) {
      formData.repaymentsStartingFromDate = new Date(step2Data.repaymentsStartingFromDate).toISOString().split('T')[0];
    }
    if (step2Data.graceOnPrincipalPayment) {
      formData.graceOnPrincipalPayment = step2Data.graceOnPrincipalPayment;
    }
    if (step2Data.graceOnInterestPayment) {
      formData.graceOnInterestPayment = step2Data.graceOnInterestPayment;
    }
    if (step2Data.graceOnInterestCharged) {
      formData.graceOnInterestCharged = step2Data.graceOnInterestCharged;
    }
    if (step2Data.allowPartialPeriodInterestCalculation) {
      formData.allowPartialPeriodInterestCalculation = step2Data.allowPartialPeriodInterestCalculation;
    }

    // Remove null/undefined/empty values
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
