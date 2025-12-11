# Figma AI Prompt: Loan Application Form Design

Copy and paste everything below this line into Figma AI:

---

Design a loan application form for a banking application using Mifos brand colors. The form should be a 3-step wizard with the following structure:

**STEP 1: Product Selection & Basic Details**

Create a single column form layout with these sections:

Section 1 - Product Selection (Required):

- Add a searchable dropdown for "Product Name" that spans full width
- Include a search icon on the left side
- Add placeholder text: "Search and select loan product"
- Mark as required with a red asterisk (\*) after the label

Section 2 - Basic Information (Required):

- Add two date picker fields side by side (50% width each):
  - "Submitted On Date \*" with calendar icon on the right, default to today's date
  - "Expected Disbursement Date \*" with calendar icon on the right
- Both fields are required

Section 3 - Additional Details (Optional, Collapsible):

- Add a collapsible section header: "Additional Details (Optional)" with expand/collapse icon
- Inside, add these fields in a 2-column layout (50% width each):
  - External ID: Text input
  - Loan Officer: Dropdown (only visible after product is selected)
  - Loan Purpose: Dropdown (only visible after product is selected)
  - Fund: Dropdown (only visible after product is selected)
  - Link Savings Account: Dropdown (only visible after product is selected)
  - Create Standing Instructions: Checkbox (only visible if savings account is linked)

Navigation:

- Add a "Next" button (primary style, right-aligned)
- Button should be disabled until product is selected and both dates are filled

**STEP 2: Loan Terms & Amount**

Create a multi-column form layout with these sections:

Section 1 - Loan Amount (Required):

- Add a currency input field for "Loan Amount \*" (full width)
- Include dollar sign ($) prefix
- Format numbers with thousand separators (commas) and two decimal places
- Add helper text below: "Enter amount between [min] and [max]"

Section 2 - Loan Term (Required):

- Create a 3-column layout:
  - Number of Repayments: Number input (33% width), integer only, required
  - Repaid Every: Number input (33% width), integer only, required
  - Repayment Frequency: Dropdown (33% width), options: Days, Weeks, Months, Years, disabled/auto-filled
- Below, add a 2-column layout:
  - Loan Term: Number input (50% width, disabled/grayed out, read-only) labeled "Loan Term (Auto-calculated)"
  - Loan Term Frequency: Dropdown (50% width), options: Days, Weeks, Months, Years, required

Section 3 - Interest Settings (Required):

- Create a 2-column layout with these fields:
  - Interest Rate Per Period (%): Number input with % symbol (50% width)
  - Interest Rate Frequency: Dropdown (50% width), options: Days, Weeks, Months, Years
  - Interest Method: Dropdown (50% width), options: Flat, Declining Balance, required
  - Amortization Type: Dropdown (50% width), options: Equal Principal Payments, Equal Installments, required
  - Interest Calculation Period: Dropdown (50% width), options: Daily, Same as repayment period
  - Repayment Strategy: Dropdown (50% width), required

Section 4 - Optional Settings (Collapsible):

- Add collapsible section header: "Optional Settings"
- Inside, add these fields in a 2-column layout:
  - First Repayment Date: Date picker (50% width)
  - Interest Charged From Date: Date picker (50% width)
  - Fixed EMI Amount: Currency input (50% width)
  - Arrears Tolerance: Currency input (50% width)
- Add a 3-column layout:
  - Grace on Principal Payment: Number input (33% width)
  - Grace on Interest Payment: Number input (33% width)
  - Interest Free Period: Number input (33% width)
- Add checkbox: "Calculate Interest for Exact Days"

Section 5 - Collateral (Conditional, only show if product requires):

- Add section header: "Collateral Information"
- Create a table with columns: Type (dropdown), Quantity (number input), Total Value (read-only, calculated), Actions (delete icon button)
- Add "Add Collateral" button (primary style, left-aligned) above the table

Section 6 - Multi-Disbursement (Conditional, only show if product allows):

- Add section header: "Multi-Disbursement Schedule"
- Add checkbox: "Enable Multi-Disbursement"
- Add "Max Outstanding Balance" currency input (50% width)
- Create a table with columns: Expected Disbursement Date (date picker), Principal Amount (currency input), Actions (delete icon button)
- Add "Add Disbursement" button (primary style, left-aligned) above the table

Navigation:

- Add "Previous" button (secondary style, left-aligned)
- Add "Next" button (primary style, right-aligned)

**STEP 3: Review & Submit**

Create a layout with read-only summary cards and preview table:

Section 1 - Application Summary Card:

- Create a white card with subtle shadow, rounded corners (8px), and padding (20px)
- Add card title: "Application Summary"
- Create a 2-column layout (labels on left, values on right):
  - Loan Product: [Product Name]
  - Principal Amount: $[Amount]
  - Loan Term: [Number] [Frequency]
  - Number of Repayments: [Number]
  - Repayment Frequency: Every [Number] [Frequency]
  - Interest Rate: [Rate]% per [Frequency]
  - Expected Disbursement Date: [Date]
  - Submitted On Date: [Date]
  - Loan Officer: [Name] (if selected)
  - Loan Purpose: [Purpose] (if selected)

Section 2 - Repayment Schedule Preview Card:

- Create another white card with same styling
- Add card title: "Repayment Schedule Preview"
- Create a table with columns: Installment #, Due Date, Principal, Interest, Total
- Show 5-10 rows of sample data
- Add "View Full Schedule" link below table (if more than 10 installments)

Section 3 - Actions:

- Add "Edit Application" button (secondary style, left-aligned)
- Add "Submit Application" button (primary style, right-aligned, large size)
- Add "Cancel" text link (left-aligned)

**VISUAL DESIGN SPECIFICATIONS:**

Typography:

- Form Labels: 14px, Medium weight, Dark gray (#353b3b)
- Required Indicator: Red asterisk (\*) after label in color #d9534f
- Helper Text: 12px, Light gray (#95a5a6), positioned below input
- Section Headers: 18px, Bold, Dark gray (#353b3b)
- Card Titles: 16px, Semi-bold, Dark gray (#353b3b)

Colors (Mifos Brand Colors - use these exact hex codes):

- Primary Button: Mifos Blue #1074b9
- Primary Button Hover: Darker Blue #004989
- Primary Button Light: Light Blue #5ba2ec
- Secondary Button: Gray #95a5a6
- Accent Color: Peter River Blue #3498db
- Highlight Color: Belize Hole Blue #2980b9
- Base/Dark Text: Dark Grey #353b3b
- White: Pure White #ffffff
- Black: Pure Black #000000
- Required Field Indicator: Red #d9534f
- Disabled Field: Light gray background #f5f5f5, gray text #95a5a6
- Error State: Red border #d9534f, red text #d9534f below field
- Success State: Green #5cb85c
- Warning State: Orange #f0ad4e
- Info State: Light Blue #5bc0de
- Light Grey Background: #f5f5f5
- Mid Grey: #d7dada
- Table Header Background: Dark Grey #353b3b with white text #ffffff
- Table Row Alternating: Light Grey #f5f5f5

Spacing:

- Section Spacing: 32px between sections
- Field Spacing: 16px between fields
- Form Padding: 24px
- Card Padding: 20px
- Button Spacing: 16px between buttons

Components to Create:

1. Searchable Dropdown: Input field with search icon, dropdown list with search results, selected item highlighted in primary blue

2. Date Picker: Input field with calendar icon on right, calendar popup appears when clicked

3. Currency Input: Number input with dollar sign prefix, thousand separators (commas), two decimal places

4. Number Input: Standard number input, integer validation where needed

5. Dropdown/Select: Standard dropdown with arrow icon, options list

6. Checkbox: Standard checkbox with label

7. Table: Headers row with bold text, dark background #353b3b, white text #ffffff. Data rows with alternating light gray #f5f5f5 background. Action buttons in last column use Mifos Blue #1074b9

8. Card: White background #ffffff, subtle shadow, rounded corners 8px, padding 20px inside

9. Progress Indicator: Show "Step 1 of 3", "Step 2 of 3", "Step 3 of 3". Active step highlighted in Mifos Blue #1074b9. Completed steps show checkmark in Success Green #5cb85c. Inactive steps in Mid Grey #95a5a6

10. Button States: Default uses primary color #1074b9, hover uses darker shade #004989, disabled uses gray #95a5a6 with no interaction, loading shows spinner icon

Responsive Breakpoints:

Desktop (1024px and above):

- Multi-column layout (2-3 columns)
- Form max width 800px, centered on page

Tablet (768px to 1023px):

- 2-column layout where possible
- Full width form

Mobile (below 768px):

- Single column layout
- Full width inputs
- Stack buttons vertically
- Collapsible sections default to collapsed state

Error States:

- Field Error: Red border #d9534f on input, error message below in red text #d9534f
- Form Error: Error banner at top of form with red background #d9534f and white text #ffffff
- Validation Message: Clear, actionable text like "Principal must be between $100 and $10,000"

Loading States:

- Dropdown Loading: Skeleton loader or spinner
- Form Submission: Button shows spinner, disabled state
- API Call: Overlay with spinner and "Loading..." text

Success State (After Submission):

- Success Page with large green checkmark icon in Success Green #5cb85c
- Heading: "Application Submitted Successfully"
- Application ID displayed prominently in Mifos Blue #1074b9
- Message: "Your loan application has been submitted. You will be notified once it's reviewed."
- "Track Application" button in primary Mifos Blue #1074b9
- "Back to Dashboard" link in Dark Grey #353b3b

Design Principles:

1. Progressive Disclosure: Show only relevant fields based on user selections
2. Clear Hierarchy: Required fields should be prominent, optional fields in collapsible sections
3. Visual Feedback: Immediate validation with clear error messages
4. Accessibility: Proper labels, keyboard navigation support, screen reader friendly
5. Mobile-First: Ensure all interactions work on touch devices
6. Consistent Spacing: Use the spacing scale provided (16px, 24px, 32px)
7. Loading States: Always show feedback during API calls
8. Error Prevention: Disable submit button until form is valid

Component Hierarchy:

- Loan Application Form (main container)
  - Progress Indicator (Step 1/3, 2/3, 3/3)
  - Step 1: Product Selection
    - Product Search Dropdown
    - Date Pickers (2 columns)
    - Collapsible Optional Section
  - Step 2: Loan Terms
    - Principal Amount Input
    - Loan Term Section (3 columns)
    - Interest Settings Section (2 columns)
    - Collapsible Optional Settings
    - Collateral Table (conditional)
    - Multi-Disbursement Table (conditional)
  - Step 3: Review
    - Summary Card
    - Repayment Schedule Preview Table
    - Action Buttons

Additional Notes:

- Use Material Design 3 components as base design system
- All inputs should have consistent styling
- Dropdowns should be searchable where indicated
- Tables should be scrollable if content exceeds viewport
- Form should be scrollable on mobile devices
- Use auto-layout for responsive behavior
- Create component variants for different states: default, error, disabled, focused, hover, active
- Include hover and active states for all interactive elements
- Ensure proper contrast ratios for accessibility
- Use the exact Mifos brand colors provided - do not substitute with similar colors

---

**FEATURE 2: LOAN APPLICATION STATUS TRACKER**

Design a loan application status tracker page for a banking application using Mifos brand colors. This page shows where a loan application is in the approval process.

**Main Layout:**

Create a page with the following sections:

Section 1 - Application Header Card:

- Create a white card with subtle shadow, rounded corners (8px), and padding (20px)
- Add application details in a 2-column layout:
  - Left column: Labels (Application ID, Loan Product, Principal Amount, Applied Date)
  - Right column: Values (display actual data)
- Application ID should be prominently displayed in Mifos Blue #1074b9
- Current status badge at the top right corner showing status (Submitted, Pending Approval, Approved, Rejected, Disbursed)

Section 2 - Status Timeline (Visual Progress Indicator):

- Create a vertical timeline component showing the loan application journey
- Timeline should have these stages (in order):
  1. Submitted (with checkmark icon if completed)
  2. Pending Approval (with clock icon if current, checkmark if completed)
  3. Approved/Rejected (with checkmark or X icon)
  4. Disbursed (with money icon if completed)
- Each timeline step should show:
  - Step number or icon
  - Step name (e.g., "Submitted", "Pending Approval")
  - Date when step was completed (if applicable)
  - Username of person who completed the step (if applicable)
  - Status indicator (completed, current, pending)
- Visual styling:
  - Completed steps: Green checkmark icon (#5cb85c), connected line in green
  - Current step: Highlighted in Mifos Blue #1074b9 with animated pulse or glow effect
  - Pending steps: Grayed out (#95a5a6), no checkmark
  - Rejected state: Red X icon (#d9534f) if application was rejected
- Timeline should be vertical on desktop, horizontal scrollable on mobile

Section 3 - Status Details Card:

- Create another white card with same styling
- Add card title: "Status Details"
- Display detailed information about current status:
  - Current Status: [Status Name] with colored badge
  - Status Code: [Code]
  - Last Updated: [Date and Time]
  - Next Action: [What happens next or who needs to act]
- Use color-coded badges:
  - Submitted: Info Blue #5bc0de
  - Pending Approval: Warning Orange #f0ad4e
  - Approved: Success Green #5cb85c
  - Rejected: Error Red #d9534f
  - Disbursed: Success Green #5cb85c

Section 4 - Timeline Events Table (Optional):

- Create a table showing all timeline events in chronological order
- Columns: Event, Date, Time, Performed By, Status
- Most recent event at the top
- Use same table styling as other tables (dark header #353b3b, alternating rows #f5f5f5)

Section 5 - Actions:

- Add "View Application Details" button (secondary style)
- Add "Back to Applications" link (text link)
- If status is "Pending Approval", show message: "Your application is being reviewed. You will be notified once a decision is made."

**Status States to Design:**

1. Submitted State:
   - Timeline: Step 1 (Submitted) - completed with green checkmark
   - Timeline: Step 2 (Pending Approval) - current, highlighted in blue
   - Timeline: Steps 3-4 - pending, grayed out
   - Status badge: "Pending Approval" in orange

2. Approved State:
   - Timeline: Steps 1-2 - completed with green checkmarks
   - Timeline: Step 3 (Approved) - completed with green checkmark
   - Timeline: Step 4 (Disbursed) - current or pending
   - Status badge: "Approved" in green

3. Rejected State:
   - Timeline: Steps 1-2 - completed
   - Timeline: Step 3 - shows red X icon
   - Timeline: Step 4 - not reached
   - Status badge: "Rejected" in red
   - Add rejection reason message if available

4. Disbursed State:
   - Timeline: All steps completed with green checkmarks
   - Status badge: "Disbursed" in green
   - Show disbursement date and amount

**Visual Design Specifications (same as Feature 1):**

Use the same Mifos brand colors, typography, spacing, and component styles as defined in Feature 1 above.

**Responsive Design:**

- Desktop: Vertical timeline on left, details on right
- Tablet: Stack timeline above details
- Mobile: Horizontal scrollable timeline, stacked cards below

---

**FEATURE 3: FINANCIAL CALCULATORS**

Design a financial calculators page for a banking application using Mifos brand colors. This page includes multiple calculator tools to help users understand loan costs and compare products.

**Main Layout:**

Create a page with a tabbed interface or card-based navigation to switch between different calculators:

**Tab 1: Loan EMI Calculator**

Create a calculator card with the following:

Input Section:

- Create a white card with subtle shadow, rounded corners (8px), and padding (20px)
- Add card title: "Loan EMI Calculator"
- Add input fields in a 2-column layout:
  - Loan Amount: Currency input (50% width) with dollar sign prefix, placeholder "Enter loan amount"
  - Interest Rate: Number input with % symbol (50% width), placeholder "Annual interest rate"
  - Loan Tenure: Number input (50% width), placeholder "Number of months/years"
  - Tenure Type: Dropdown (50% width), options: Months, Years
- Add "Calculate" button (primary style, Mifos Blue #1074b9)

Results Section:

- Display results in a highlighted box or separate card below inputs
- Show calculated values:
  - Monthly EMI: Large, prominent display in Mifos Blue #1074b9
  - Total Interest Payable: Currency amount
  - Total Amount Payable: Currency amount (Principal + Interest)
  - Breakdown chart or visualization (optional): Pie chart or bar chart showing principal vs interest

**Tab 2: Savings Maturity Calculator**

Create a calculator card with:

Input Section:

- Card title: "Savings Maturity Calculator"
- Input fields:
  - Principal Amount: Currency input (50% width)
  - Interest Rate: Number input with % symbol (50% width), label "Annual interest rate"
  - Tenure: Number input (50% width)
  - Tenure Type: Dropdown (50% width), options: Months, Years
  - Compounding Frequency: Dropdown (50% width), options: Monthly, Quarterly, Annually
- Add "Calculate" button (primary style)

Results Section:

- Maturity Amount: Large, prominent display
- Total Interest Earned: Currency amount
- Breakdown showing growth over time (optional line chart)

**Tab 3: Interest Calculator**

Create a calculator card with:

Input Section:

- Card title: "Simple Interest Calculator"
- Input fields:
  - Principal Amount: Currency input (50% width)
  - Interest Rate: Number input with % symbol (50% width)
  - Time Period: Number input (50% width)
  - Time Unit: Dropdown (50% width), options: Days, Months, Years
- Add "Calculate" button (primary style)

Results Section:

- Simple Interest: Currency amount
- Total Amount: Currency amount (Principal + Interest)

**Tab 4: Product Comparison Tool**

Create a comparison interface:

Product Selection:

- Card title: "Compare Loan Products"
- Add two product selection dropdowns side by side:
  - "Select Product 1" dropdown (50% width)
  - "Select Product 2" dropdown (50% width)
- Add "Compare" button (primary style)

Comparison Table:

- Create a comparison table with columns: Feature, Product 1, Product 2
- Rows to compare:
  - Product Name
  - Interest Rate
  - Minimum Amount
  - Maximum Amount
  - Loan Tenure
  - Processing Fee
  - Features/Benefits
- Highlight differences between products
- Use alternating row colors (#f5f5f5) for readability
- Add "Apply Now" buttons below each product column

**Shared Calculator Components:**

Input Fields:

- All number inputs should have proper formatting
- Currency inputs with dollar sign prefix and thousand separators
- Percentage inputs with % symbol suffix
- Clear labels above each input
- Helper text below inputs where needed (e.g., "Enter annual interest rate")

Calculate Button:

- Primary style, Mifos Blue #1074b9
- Full width or centered
- Hover state: Darker blue #004989
- Loading state: Show spinner when calculating

Results Display:

- Use cards or highlighted boxes
- Large, readable numbers
- Clear labels for each calculated value
- Use Success Green #5cb85c for positive results
- Use Info Blue #5bc0de for informational displays

Reset/Clear Button:

- Secondary style button
- Allows users to clear all inputs and start over

**Visual Design Specifications (same as Feature 1):**

Use the same Mifos brand colors, typography, spacing, and component styles as defined in Feature 1 above.

**Layout Options:**

Option 1 - Tabbed Interface:

- Tabs at the top: "EMI Calculator", "Savings Calculator", "Interest Calculator", "Compare Products"
- Active tab highlighted in Mifos Blue #1074b9
- Content area below shows selected calculator

Option 2 - Card Grid:

- All calculators visible on one page in a 2-column grid (desktop)
- Each calculator in its own card
- Single column on mobile

**Responsive Design:**

- Desktop: 2-column layout for inputs, full width results
- Tablet: Single column inputs, full width results
- Mobile: Single column, stacked inputs, full width results

**Additional Features:**

- Add "Save Calculation" button to save results (optional)
- Add "Print" or "Download PDF" button for results (optional)
- Add example values or "Fill Example" button to help users understand
- Add tooltips with explanations for complex terms

---

**SHARED DESIGN ELEMENTS FOR ALL THREE FEATURES:**

All three features should use consistent:

- Mifos brand colors (as specified in Feature 1)
- Typography (14px labels, 18px headers, etc.)
- Spacing (16px, 24px, 32px)
- Card styling (white background, 8px rounded corners, subtle shadow, 20px padding)
- Button styles (primary #1074b9, secondary #95a5a6)
- Table styling (dark header #353b3b, alternating rows #f5f5f5)
- Responsive breakpoints (Desktop 1024px+, Tablet 768-1023px, Mobile <768px)
- Error states (red border #d9534f, error messages)
- Loading states (spinners, skeleton loaders)
- Accessibility features (proper labels, keyboard navigation, screen reader support)

---

End of prompt. Copy everything above this line into Figma AI.
