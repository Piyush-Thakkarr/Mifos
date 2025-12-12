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

  // Dynamic options from template (will be populated from API)
  termFrequencyTypes: any[] = [];
  repaymentFrequencyTypes: any[] = [];
  interestRateFrequencyTypes: any[] = [];
  interestTypes: any[] = [];
  amortizationTypes: any[] = [];
  interestCalculationPeriodTypes: any[] = [];
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
        { value: '', disabled: false },
        Validators.required
      ],
      loanTermFrequency: [
        { value: '', disabled: true },
        Validators.required
      ],
      loanTermFrequencyType: [
        { value: '', disabled: false },
        Validators.required
      ],
      interestRatePerPeriod: [{ value: '', disabled: true }], // READ-ONLY
      interestRateFrequencyType: [{ value: '', disabled: true }], // READ-ONLY
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
  }

  loadLoanProducts(): void {
    this.loading = true;
    this.authService.loanProducts().subscribe({
      next: (result: any) => {
        // Backend returns {products: [...]}, so extract the products array
        this.loanProducts = result.products || result || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading loan products:', err);
        this.error = 'Failed to load loan products. Please try again.';
        this.loading = false;
      }
    });
  }

  loadClientProfile(): void {
    this.authService.client().subscribe({
      next: (result: any) => {
        this.clientProfile = result.profile || result;
      },
      error: (err: any) => {
        console.error('Error loading client profile:', err);
      }
    });
  }

  loadProductTemplate(productId: number): void {
    this.loading = true;
    this.error = null;

    this.authService.loanProductTemplate(productId).subscribe({
      next: (result: any) => {
        this.productTemplate = result;
        this.selectedProduct = this.loanProducts.find((p) => p.id === productId);

        // Populate dynamic options from template
        this.populateOptionsFromTemplate(result);

        // Populate form with template values
        this.populateFormFromTemplate(result);

        // Apply field restrictions based on allowAttributeOverrides
        this.applyFieldRestrictions(result);

        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading product template:', err);
        this.error = 'Failed to load product details. Please try again.';
        this.loading = false;

        // Fallback: use product data directly
        const product = this.loanProducts.find((p) => p.id === productId);
        if (product) {
          this.populateFormFromProduct(product);
        }
      }
    });
  }

  populateOptionsFromTemplate(template: any): void {
    // Populate frequency type options from template
    if (template.termFrequencyTypeOptions) {
      this.termFrequencyTypes = template.termFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.repaymentFrequencyTypeOptions) {
      this.repaymentFrequencyTypes = template.repaymentFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.interestRateFrequencyTypeOptions) {
      this.interestRateFrequencyTypes = template.interestRateFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.interestTypeOptions) {
      this.interestTypes = template.interestTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.amortizationTypeOptions) {
      this.amortizationTypes = template.amortizationTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.interestCalculationPeriodTypeOptions) {
      this.interestCalculationPeriodTypes = template.interestCalculationPeriodTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value
      }));
    }

    if (template.transactionProcessingStrategyOptions) {
      this.transactionProcessingStrategies = template.transactionProcessingStrategyOptions.map((opt: any) => ({
        code: opt.code,
        name: opt.name
      }));
    }
  }

  populateFormFromTemplate(template: any): void {
    // Re-enable all fields first
    this.step2Form.get('principalAmount')?.enable();
    this.step2Form.get('numberOfRepayments')?.enable();
    this.step2Form.get('repaymentEvery')?.enable();
    this.step2Form.get('repaymentFrequencyType')?.enable();
    this.step2Form.get('loanTermFrequencyType')?.enable();
    this.step2Form.get('interestType')?.enable();
    this.step2Form.get('amortizationType')?.enable();
    this.step2Form.get('interestCalculationPeriodType')?.enable();
    this.step2Form.get('transactionProcessingStrategyCode')?.enable();

    // Populate form with template values - use exact values from template
    const repaymentFreqTypeId = template.repaymentFrequencyType?.id ?? template.repaymentFrequencyType?.value ?? '';
    const termFreqTypeId = template.termPeriodFrequencyType?.id ?? template.termPeriodFrequencyType?.value ?? '';
    const interestRateFreqTypeId =
      template.interestRateFrequencyType?.id ?? template.interestRateFrequencyType?.value ?? '';
    const loanTermFreq = template.termFrequency ?? template.loanTermFrequency ?? '';

    this.step2Form.patchValue({
      principalAmount: template.principal || '',
      numberOfRepayments: template.numberOfRepayments || '',
      repaymentEvery: template.repaymentEvery || '',
      repaymentFrequencyType: repaymentFreqTypeId, // Use template's exact value
      loanTermFrequency: loanTermFreq, // Use template's termFrequency
      loanTermFrequencyType: termFreqTypeId, // Use template's exact value
      interestRatePerPeriod: template.interestRatePerPeriod || '', // Always read-only
      interestRateFrequencyType: interestRateFreqTypeId, // Always read-only
      interestType: template.interestType?.id ?? template.interestType?.value ?? '',
      amortizationType: template.amortizationType?.id ?? template.amortizationType?.value ?? '',
      interestCalculationPeriodType:
        template.interestCalculationPeriodType?.id ?? template.interestCalculationPeriodType?.value ?? '',
      transactionProcessingStrategyCode: template.transactionProcessingStrategyCode || ''
    });

    // Always disable interest rate fields (set by bank/MFI)
    this.step2Form.get('interestRatePerPeriod')?.disable();
    this.step2Form.get('interestRateFrequencyType')?.disable();
  }

  populateFormFromProduct(product: any): void {
    // Fallback: populate from product data if template fails
    const repaymentFreqTypeId = product.repaymentFrequencyType?.id ?? product.repaymentFrequencyType?.value ?? '';
    const termFreqTypeId = product.termPeriodFrequencyType?.id ?? product.termPeriodFrequencyType?.value ?? '';
    const interestRateFreqTypeId =
      product.interestRateFrequencyType?.id ?? product.interestRateFrequencyType?.value ?? '';

    this.step2Form.patchValue({
      principalAmount: product.principal || '',
      numberOfRepayments: product.numberOfRepayments || '',
      repaymentEvery: product.repaymentEvery || '',
      repaymentFrequencyType: repaymentFreqTypeId,
      loanTermFrequencyType: termFreqTypeId,
      interestRatePerPeriod: product.interestRatePerPeriod || '',
      interestRateFrequencyType: interestRateFreqTypeId,
      interestType: product.interestType?.id ?? '',
      amortizationType: product.amortizationType?.id ?? '',
      interestCalculationPeriodType: product.interestCalculationPeriodType?.id ?? '',
      transactionProcessingStrategyCode: product.transactionProcessingStrategyCode || ''
    });

    this.step2Form.get('interestRatePerPeriod')?.disable();
    this.step2Form.get('interestRateFrequencyType')?.disable();
  }

  applyFieldRestrictions(template: any): void {
    // Get allowAttributeOverrides from template
    const overrides = template.product?.allowAttributeOverrides ?? template.allowAttributeOverrides ?? {};

    // If repaymentEvery cannot be overridden, disable repayment frequency fields
    if (!overrides.repaymentEvery) {
      this.step2Form.get('repaymentEvery')?.disable();
      this.step2Form.get('repaymentFrequencyType')?.disable();
      // Ensure we use template's exact values
      const repaymentFreqTypeId = template.repaymentFrequencyType?.id ?? template.repaymentFrequencyType?.value;
      if (repaymentFreqTypeId !== undefined) {
        this.step2Form.patchValue({
          repaymentFrequencyType: repaymentFreqTypeId
        });
      }
    }

    // If interestType cannot be overridden, disable it
    if (!overrides.interestType) {
      this.step2Form.get('interestType')?.disable();
    }

    // If amortizationType cannot be overridden, disable it
    if (!overrides.amortizationType) {
      this.step2Form.get('amortizationType')?.disable();
    }

    // If interestCalculationPeriodType cannot be overridden, disable it
    if (!overrides.interestCalculationPeriodType) {
      this.step2Form.get('interestCalculationPeriodType')?.disable();
    }

    // If transactionProcessingStrategyCode cannot be overridden, disable it
    if (!overrides.transactionProcessingStrategyCode) {
      this.step2Form.get('transactionProcessingStrategyCode')?.disable();
    }
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

    // Get raw values to include disabled fields
    const step1Data = this.step1Form.getRawValue();
    const step2RawData = this.step2Form.getRawValue();

    // Build form data using template's exact values
    const formData = this.buildLoanApplicationData(step1Data, step2RawData);

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
        if (err?.status === 504 || err?.error?.error === 'schedule_calculation_timeout') {
          this.error = null; // Clear error, allow submission
          console.warn('Schedule calculation timed out, but user can still submit application');
        } else {
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

  buildLoanApplicationData(step1Data: any, step2RawData: any): any {
    // CRITICAL: Always use raw values for frequency types to get template's exact values
    // This ensures we send the correct enum values even if fields are disabled
    const repaymentFreqType = step2RawData.repaymentFrequencyType;
    const termFreqType = step2RawData.loanTermFrequencyType;
    const interestRateFreqType = step2RawData.interestRateFrequencyType;

    // Calculate loanTermFrequency if not set
    const loanTermFreq =
      step2RawData.loanTermFrequency ||
      (step2RawData.numberOfRepayments && step2RawData.repaymentEvery
        ? step2RawData.numberOfRepayments * step2RawData.repaymentEvery
        : this.productTemplate?.termFrequency || '');

    const formData: any = {
      productId: step1Data.productId,
      principal: step2RawData.principalAmount,
      numberOfRepayments: step2RawData.numberOfRepayments,
      repaymentEvery: step2RawData.repaymentEvery,
      repaymentFrequencyType: repaymentFreqType, // Use raw value (template's exact enum)
      loanTermFrequency: loanTermFreq,
      loanTermFrequencyType: termFreqType, // Use raw value (template's exact enum)
      interestRatePerPeriod: step2RawData.interestRatePerPeriod,
      interestRateFrequencyType: interestRateFreqType, // Use raw value (template's exact enum)
      interestType: step2RawData.interestType,
      amortizationType: step2RawData.amortizationType,
      interestCalculationPeriodType: step2RawData.interestCalculationPeriodType,
      transactionProcessingStrategyCode: step2RawData.transactionProcessingStrategyCode,
      loanType: 'individual', // Required by Fineract for client portal
      dateFormat: 'yyyy-MM-dd',
      locale: 'en'
    };

    // Add clientId if available (backend will set it from session if not provided)
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
    if (step2RawData.repaymentsStartingFromDate) {
      formData.repaymentsStartingFromDate = new Date(step2RawData.repaymentsStartingFromDate)
        .toISOString()
        .split('T')[0];
    }
    if (step2RawData.graceOnPrincipalPayment) {
      formData.graceOnPrincipalPayment = step2RawData.graceOnPrincipalPayment;
    }
    if (step2RawData.graceOnInterestPayment) {
      formData.graceOnInterestPayment = step2RawData.graceOnInterestPayment;
    }
    if (step2RawData.graceOnInterestCharged) {
      formData.graceOnInterestCharged = step2RawData.graceOnInterestCharged;
    }
    if (step2RawData.allowPartialPeriodInterestCalculation) {
      formData.allowPartialPeriodInterestCalculation = step2RawData.allowPartialPeriodInterestCalculation;
    }

    return formData;
  }

  submitApplication(): void {
    if (!this.step1Form.valid || !this.step2Form.valid) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Get raw values to include disabled fields
    const step1Data = this.step1Form.getRawValue();
    const step2RawData = this.step2Form.getRawValue();

    // Build form data using template's exact values
    const formData = this.buildLoanApplicationData(step1Data, step2RawData);

    this.authService.submitLoanApplication(formData).subscribe({
      next: (result: any) => {
        this.loading = false;
        // Redirect to success page or loan details
        this.router.navigate(['/clientportal/loans']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error submitting application:', err);
        this.error = err?.error?.details || err?.error?.error || 'Failed to submit loan application. Please try again.';
      }
    });
  }

  getFrequencyLabel(frequencyTypeId: number): string {
    // Find label from any of the frequency type arrays
    const allTypes = [
      ...this.termFrequencyTypes,
      ...this.repaymentFrequencyTypes,
      ...this.interestRateFrequencyTypes
    ];
    const type = allTypes.find((t) => t.id === frequencyTypeId);
    return type?.value || `Type ${frequencyTypeId}`;
  }

  getUserName(): string {
    return this.clientProfile?.displayName || 'User';
  }

  navigateToNotifications(): void {
    this.router.navigate(['/clientportal/notifications']);
  }
}
