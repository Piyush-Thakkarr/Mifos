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

    // Reset form to clear previous product's data
    this.step2Form.reset();
    this.productTemplate = null;
    this.selectedProduct = null;

    this.authService.loanProductTemplate(productId).subscribe({
      next: (result: any) => {
        this.productTemplate = result;
        this.selectedProduct = this.loanProducts.find((p) => p.id === productId);

        // Populate dynamic options from template
        this.populateOptionsFromTemplate(result);

        // Populate form with template values (this will set all fields from API)
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
          this.selectedProduct = product;
          this.populateFormFromProduct(product);
        }
      }
    });
  }

  populateOptionsFromTemplate(template: any): void {
    // Populate frequency type options from template
    if (template.termFrequencyTypeOptions && Array.isArray(template.termFrequencyTypeOptions)) {
      this.termFrequencyTypes = template.termFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.repaymentFrequencyTypeOptions && Array.isArray(template.repaymentFrequencyTypeOptions)) {
      this.repaymentFrequencyTypes = template.repaymentFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.interestRateFrequencyTypeOptions && Array.isArray(template.interestRateFrequencyTypeOptions)) {
      this.interestRateFrequencyTypes = template.interestRateFrequencyTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.interestTypeOptions && Array.isArray(template.interestTypeOptions)) {
      this.interestTypes = template.interestTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.amortizationTypeOptions && Array.isArray(template.amortizationTypeOptions)) {
      this.amortizationTypes = template.amortizationTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.interestCalculationPeriodTypeOptions && Array.isArray(template.interestCalculationPeriodTypeOptions)) {
      this.interestCalculationPeriodTypes = template.interestCalculationPeriodTypeOptions.map((opt: any) => ({
        id: opt.id,
        value: opt.value || opt.name || `Type ${opt.id}`
      }));
    }

    if (template.transactionProcessingStrategyOptions && Array.isArray(template.transactionProcessingStrategyOptions)) {
      this.transactionProcessingStrategies = template.transactionProcessingStrategyOptions.map((opt: any) => ({
        code: opt.code,
        name: opt.name || opt.code
      }));
    }

    // Ensure we have at least default options if template didn't provide them
    this.ensureDefaultOptions();
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
    // CRITICAL: Extract IDs correctly - template may have nested objects
    const repaymentFreqTypeId =
      template.repaymentFrequencyType?.id ??
      (typeof template.repaymentFrequencyType === 'object'
        ? template.repaymentFrequencyType?.id
        : template.repaymentFrequencyType) ??
      '';
    const termFreqTypeId =
      template.termPeriodFrequencyType?.id ??
      (typeof template.termPeriodFrequencyType === 'object'
        ? template.termPeriodFrequencyType?.id
        : template.termPeriodFrequencyType) ??
      '';
    const interestRateFreqTypeId =
      template.interestRateFrequencyType?.id ??
      (typeof template.interestRateFrequencyType === 'object'
        ? template.interestRateFrequencyType?.id
        : template.interestRateFrequencyType) ??
      '';
    const loanTermFreq = template.termFrequency ?? template.loanTermFrequency ?? '';

    // CRITICAL: Use exact values from template - these come from the API
    const interestRate = template.interestRatePerPeriod ?? '';
    const principal = template.principal ?? template.proposedPrincipal ?? template.approvedPrincipal ?? '';
    const numberOfRepayments = template.numberOfRepayments ?? '';
    const repaymentEvery = template.repaymentEvery ?? '';

    this.step2Form.patchValue({
      principalAmount: principal,
      numberOfRepayments: numberOfRepayments,
      repaymentEvery: repaymentEvery,
      repaymentFrequencyType: repaymentFreqTypeId, // Use template's exact value
      loanTermFrequency: loanTermFreq, // Use template's termFrequency
      loanTermFrequencyType: termFreqTypeId, // Use template's exact value
      interestRatePerPeriod: interestRate, // Always read-only - use exact value from API
      interestRateFrequencyType: interestRateFreqTypeId, // Always read-only
      interestType:
        template.interestType?.id ??
        (typeof template.interestType === 'object' ? template.interestType?.id : template.interestType) ??
        '',
      amortizationType:
        template.amortizationType?.id ??
        (typeof template.amortizationType === 'object' ? template.amortizationType?.id : template.amortizationType) ??
        '',
      interestCalculationPeriodType:
        template.interestCalculationPeriodType?.id ??
        (typeof template.interestCalculationPeriodType === 'object'
          ? template.interestCalculationPeriodType?.id
          : template.interestCalculationPeriodType) ??
        '',
      transactionProcessingStrategyCode: template.transactionProcessingStrategyCode || ''
    });

    // Always disable interest rate fields (set by bank/MFI)
    this.step2Form.get('interestRatePerPeriod')?.disable();
    this.step2Form.get('interestRateFrequencyType')?.disable();
  }

  populateFormFromProduct(product: any): void {
    // Fallback: populate from product data if template fails
    // First, ensure we have default options if template didn't provide them
    this.ensureDefaultOptions();

    // CRITICAL: Extract IDs correctly - product may have nested objects
    const repaymentFreqTypeId =
      product.repaymentFrequencyType?.id ??
      (typeof product.repaymentFrequencyType === 'object'
        ? product.repaymentFrequencyType?.id
        : product.repaymentFrequencyType) ??
      '';
    const termFreqTypeId =
      product.termPeriodFrequencyType?.id ??
      (typeof product.termPeriodFrequencyType === 'object'
        ? product.termPeriodFrequencyType?.id
        : product.termPeriodFrequencyType) ??
      '';
    const interestRateFreqTypeId =
      product.interestRateFrequencyType?.id ??
      (typeof product.interestRateFrequencyType === 'object'
        ? product.interestRateFrequencyType?.id
        : product.interestRateFrequencyType) ??
      '';

    // CRITICAL: Use exact values from product - these come from the API
    const interestRate = product.interestRatePerPeriod ?? '';
    const principal = product.principal ?? '';

    this.step2Form.patchValue({
      principalAmount: principal,
      numberOfRepayments: product.numberOfRepayments || '',
      repaymentEvery: product.repaymentEvery || '',
      repaymentFrequencyType: repaymentFreqTypeId,
      loanTermFrequencyType: termFreqTypeId,
      interestRatePerPeriod: interestRate, // Use exact value from API
      interestRateFrequencyType: interestRateFreqTypeId,
      interestType:
        product.interestType?.id ??
        (typeof product.interestType === 'object' ? product.interestType?.id : product.interestType) ??
        '',
      amortizationType:
        product.amortizationType?.id ??
        (typeof product.amortizationType === 'object' ? product.amortizationType?.id : product.amortizationType) ??
        '',
      interestCalculationPeriodType:
        product.interestCalculationPeriodType?.id ??
        (typeof product.interestCalculationPeriodType === 'object'
          ? product.interestCalculationPeriodType?.id
          : product.interestCalculationPeriodType) ??
        '',
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
    // Don't block if forms are invalid - schedule calculation is optional
    // Get raw values to include disabled fields
    const step1Data = this.step1Form.getRawValue();
    const step2RawData = this.step2Form.getRawValue();

    // Ensure we have minimum required data
    if (!step1Data.productId || !step2RawData.principalAmount) {
      console.warn('Cannot calculate schedule: missing required fields');
      return;
    }

    // Build form data using template's exact values
    const formData = this.buildLoanApplicationData(step1Data, step2RawData);

    // Remove clientId if not needed for schedule calculation
    // Schedule calculation might work without it
    if (formData.clientId) {
      delete formData.clientId;
    }

    // Set a timeout for the schedule calculation (30 seconds)
    const timeout = setTimeout(() => {
      console.warn('Schedule calculation taking too long, continuing without preview');
    }, 30000);

    this.authService.calculateLoanSchedule(formData).subscribe({
      next: (result: any) => {
        clearTimeout(timeout);
        // Extract repayment schedule from response
        if (result.periods && Array.isArray(result.periods)) {
          this.repaymentSchedule = result.periods;
          this.calculateTotals();
        } else if (result.repaymentSchedule && Array.isArray(result.repaymentSchedule)) {
          this.repaymentSchedule = result.repaymentSchedule;
          this.calculateTotals();
        } else if (result.repaymentSchedule?.periods && Array.isArray(result.repaymentSchedule.periods)) {
          this.repaymentSchedule = result.repaymentSchedule.periods;
          this.calculateTotals();
        }
      },
      error: (err: any) => {
        clearTimeout(timeout);
        console.error('Error calculating schedule:', err);
        // Don't show error if it's a timeout or CORS error - schedule calculation is optional
        if (
          err?.status === 504 ||
          err?.status === 0 ||
          err?.error?.error === 'schedule_calculation_timeout' ||
          err?.message?.includes('CORS') ||
          err?.message?.includes('Failed to fetch')
        ) {
          // Silently fail - schedule preview is optional
          console.warn('Schedule calculation failed or timed out, but user can still submit application');
          this.repaymentSchedule = [];
        } else {
          // Only show error for non-timeout issues
          console.warn('Schedule preview unavailable:', err?.error?.details || err?.error?.error);
          this.repaymentSchedule = [];
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

    // Convert dates to ISO format strings - these are REQUIRED by Fineract
    // Always include submittedOnDate (default to today if not set)
    if (step1Data.submittedOnDate) {
      formData.submittedOnDate = new Date(step1Data.submittedOnDate).toISOString().split('T')[0];
    } else {
      // Default to today if not provided
      formData.submittedOnDate = new Date().toISOString().split('T')[0];
    }

    // Always include expectedDisbursementDate (default to today + 7 days if not set)
    if (step1Data.expectedDisbursementDate) {
      formData.expectedDisbursementDate = new Date(step1Data.expectedDisbursementDate).toISOString().split('T')[0];
    } else {
      // Default to 7 days from today if not provided
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      formData.expectedDisbursementDate = defaultDate.toISOString().split('T')[0];
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
    // Validate forms but allow submission even if some fields are invalid (they might be disabled)
    // Just ensure required fields are present
    const step1Data = this.step1Form.getRawValue();
    const step2RawData = this.step2Form.getRawValue();

    // Ensure required fields are present
    if (!step1Data.productId) {
      this.error = 'Please select a loan product.';
      return;
    }

    if (!step2RawData.principalAmount || step2RawData.principalAmount <= 0) {
      this.error = 'Please enter a valid loan amount.';
      return;
    }

    this.loading = true;
    this.error = null;

    // Build form data using template's exact values
    const formData = this.buildLoanApplicationData(step1Data, step2RawData);

    // Log the payload for debugging
    console.log('Submitting loan application with data:', formData);

    this.authService.submitLoanApplication(formData).subscribe({
      next: (result: any) => {
        this.loading = false;
        // Redirect to application status page with the new loan ID
        const loanId = result.loanId || result.resourceId || result.id;
        if (loanId) {
          this.router.navigate(['/clientportal/application-status'], {
            queryParams: { loanId: loanId }
          });
        } else {
          // Fallback to loans page if no ID returned
          this.router.navigate(['/clientportal/loans']);
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error submitting application:', err);

        // Handle timeout errors with user-friendly message
        if (
          err?.status === 504 ||
          err?.status === 0 ||
          err?.error?.error === 'schedule_calculation_timeout' ||
          err?.error?.error === 'submission_timeout' ||
          err?.error?.demo_server_limitation
        ) {
          this.error =
            '⏱️ <strong>Request Timeout</strong><br>' +
            'The loan application request timed out. This is a known limitation of the demo server (demo.mifos.io) which is slow and overloaded.<br><br>' +
            '✅ <strong>Your application may still have been submitted successfully!</strong> Please check your <a href="/clientportal/loans" style="color: #1976d2; text-decoration: underline;">loan list</a> to verify.<br><br>' +
            '💡 For production use, please use a self-hosted Fineract instance for better performance.';
          return;
        }

        // Extract detailed error message
        let errorMessage = 'Failed to submit loan application. Please try again.';
        if (err?.error?.details) {
          errorMessage = err.error.details;
        } else if (err?.error?.error) {
          errorMessage = err.error.error;
        } else if (err?.error?.errors && Array.isArray(err.error.errors)) {
          // Extract first error message from errors array
          const firstError = err.error.errors[0];
          errorMessage = firstError?.defaultUserMessage || firstError?.developerMessage || errorMessage;
        }
        this.error = errorMessage;
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

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  ensureDefaultOptions(): void {
    // Ensure all options arrays have at least default values if they're empty
    if (!this.repaymentFrequencyTypes || this.repaymentFrequencyTypes.length === 0) {
      this.repaymentFrequencyTypes = [
        { id: 0, value: 'Days' },
        { id: 1, value: 'Weeks' },
        { id: 2, value: 'Months' }
      ];
    }
    if (!this.termFrequencyTypes || this.termFrequencyTypes.length === 0) {
      this.termFrequencyTypes = [
        { id: 0, value: 'Days' },
        { id: 1, value: 'Weeks' },
        { id: 2, value: 'Months' },
        { id: 3, value: 'Years' }
      ];
    }
    if (!this.interestRateFrequencyTypes || this.interestRateFrequencyTypes.length === 0) {
      this.interestRateFrequencyTypes = [
        { id: 0, value: 'Per day' },
        { id: 1, value: 'Per week' },
        { id: 2, value: 'Per month' }
      ];
    }
    if (!this.interestTypes || this.interestTypes.length === 0) {
      this.interestTypes = [
        { id: 0, value: 'Declining Balance' },
        { id: 1, value: 'Flat' }
      ];
    }
    if (!this.amortizationTypes || this.amortizationTypes.length === 0) {
      this.amortizationTypes = [
        { id: 0, value: 'Equal Principal Payments' },
        { id: 1, value: 'Equal Installments' }
      ];
    }
    if (!this.interestCalculationPeriodTypes || this.interestCalculationPeriodTypes.length === 0) {
      this.interestCalculationPeriodTypes = [
        { id: 0, value: 'Daily' },
        { id: 1, value: 'Same as repayment period' }
      ];
    }
    if (!this.transactionProcessingStrategies || this.transactionProcessingStrategies.length === 0) {
      this.transactionProcessingStrategies = [
        { code: 'advanced-payment-allocation-strategy', name: 'Advanced payment allocation strategy' },
        { code: 'standard-strategy', name: 'Standard strategy' }
      ];
    }
  }
}
