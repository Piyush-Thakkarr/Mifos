/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'mifosx-clientportal-calculators',
  templateUrl: './calculators.component.html',
  styleUrls: ['./calculators.component.scss'],
  standalone: false
})
export class ClientportalCalculatorsComponent implements OnInit {
  activeTab: 'emi' | 'interest' | 'compare' = 'emi';
  loading = false;
  loanProducts: any[] = [];

  // EMI Calculator
  emiForm: FormGroup;
  emiResult: any = null;

  // Interest Calculator
  interestForm: FormGroup;
  interestResult: any = null;

  // Compare Products
  compareForm: FormGroup;
  product1: any = null;
  product2: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize EMI Calculator form
    this.emiForm = this.fb.group({
      loanAmount: [
        100000,
        [
          Validators.required,
          Validators.min(1)]
      ],
      annualInterestRate: [
        10,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)]
      ],
      loanTenure: [
        24,
        [
          Validators.required,
          Validators.min(1)]
      ],
      tenureType: [
        'Months',
        Validators.required
      ]
    });

    // Initialize Interest Calculator form
    this.interestForm = this.fb.group({
      principalAmount: [
        10000,
        [
          Validators.required,
          Validators.min(1)]
      ],
      interestRate: [
        8,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)]
      ],
      timePeriod: [
        1,
        [
          Validators.required,
          Validators.min(0.01)]
      ],
      timeUnit: [
        'Years',
        Validators.required
      ]
    });

    // Initialize Compare Products form
    this.compareForm = this.fb.group({
      product1: [
        '',
        Validators.required
      ],
      product2: [
        '',
        Validators.required
      ]
    });
  }

  ngOnInit(): void {
    this.loadLoanProducts();

    // Watch for product selection changes
    this.compareForm.get('product1')?.valueChanges.subscribe((productId) => {
      if (productId) {
        this.product1 = this.loanProducts.find((p) => p.id === Number(productId));
      } else {
        this.product1 = null;
      }
    });

    this.compareForm.get('product2')?.valueChanges.subscribe((productId) => {
      if (productId) {
        this.product2 = this.loanProducts.find((p) => p.id === Number(productId));
      } else {
        this.product2 = null;
      }
    });
  }

  loadLoanProducts(): void {
    this.loading = true;
    this.authService.loanProducts().subscribe({
      next: (result: any) => {
        this.loanProducts = result.products || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading loan products:', err);
        this.loanProducts = [];
        this.loading = false;
      }
    });
  }

  getUserName(): string {
    return 'User'; // Calculators doesn't need user profile
  }

  setActiveTab(tab: 'emi' | 'interest' | 'compare'): void {
    this.activeTab = tab;
    this.emiResult = null;
    this.interestResult = null;
  }

  // EMI Calculator
  calculateEMI(): void {
    if (this.emiForm.invalid) {
      this.emiForm.markAllAsTouched();
      return;
    }

    const { loanAmount, annualInterestRate, loanTenure, tenureType } = this.emiForm.value;

    // Convert tenure to months if needed
    let tenureInMonths = loanTenure;
    if (tenureType === 'Years') {
      tenureInMonths = loanTenure * 12;
    } else if (tenureType === 'Weeks') {
      tenureInMonths = loanTenure / 4.33;
    } else if (tenureType === 'Days') {
      tenureInMonths = loanTenure / 30;
    }

    // Monthly interest rate
    const monthlyRate = annualInterestRate / 100 / 12;

    // EMI calculation: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emi =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
      (Math.pow(1 + monthlyRate, tenureInMonths) - 1);

    const totalAmount = emi * tenureInMonths;
    const totalInterest = totalAmount - loanAmount;

    this.emiResult = {
      emi: emi,
      totalAmount: totalAmount,
      totalInterest: totalInterest,
      principal: loanAmount
    };
  }

  resetEMI(): void {
    this.emiForm.reset({
      loanAmount: 100000,
      annualInterestRate: 10,
      loanTenure: 24,
      tenureType: 'Months'
    });
    this.emiResult = null;
  }

  // Interest Calculator
  calculateInterest(): void {
    if (this.interestForm.invalid) {
      this.interestForm.markAllAsTouched();
      return;
    }

    const { principalAmount, interestRate, timePeriod, timeUnit } = this.interestForm.value;

    // Convert time to years
    let timeInYears = timePeriod;
    if (timeUnit === 'Months') {
      timeInYears = timePeriod / 12;
    } else if (timeUnit === 'Weeks') {
      timeInYears = timePeriod / 52;
    } else if (timeUnit === 'Days') {
      timeInYears = timePeriod / 365;
    }

    // Simple Interest: P * R * T / 100
    const interest = (principalAmount * interestRate * timeInYears) / 100;
    const totalAmount = principalAmount + interest;

    this.interestResult = {
      principal: principalAmount,
      interest: interest,
      totalAmount: totalAmount,
      rate: interestRate,
      time: timePeriod,
      timeUnit: timeUnit
    };
  }

  resetInterest(): void {
    this.interestForm.reset({
      principalAmount: 10000,
      interestRate: 8,
      timePeriod: 1,
      timeUnit: 'Years'
    });
    this.interestResult = null;
  }

  // Compare Products
  applyForLoan(productId: number): void {
    this.router.navigate(['/clientportal/loan-application'], {
      queryParams: { productId: productId }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
