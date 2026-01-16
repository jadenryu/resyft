interface FormData {
  formName: string;
  purpose: string;
  accessibility: string;
}

interface TrainingExample {
  text: string;
  labels: Record<string, number>;
}

// Comprehensive training data across all categories
const trainingData: TrainingExample[] = [
  // MEDICAL - Research
  { text: "I'm participating in a clinical trial for a new cancer treatment at Hopkins. They need me to sign consent forms.", labels: { research_informed_consent: 1, research_hipaa_authorization: 1 } },
  { text: "Volunteering for a diabetes study. They want access to my medical history and blood work results.", labels: { research_informed_consent: 1, research_hipaa_authorization: 1, hipaa_authorization_release: 1 } },
  { text: "Enrolled in a vaccine trial. Need to understand what data they'll collect and how it's used.", labels: { research_informed_consent: 1, research_irb_protocol: 1 } },
  { text: "My son is joining a pediatric asthma research study at the university.", labels: { research_informed_consent: 1, research_hipaa_authorization: 1 } },
  { text: "Participating in a mental health research project. They need permission to contact me for follow-ups.", labels: { research_informed_consent: 1 } },

  // MEDICAL - Healthcare Admin
  { text: "First time visiting this doctor's office. They want me to fill out new patient paperwork.", labels: { patient_intake_form: 1 } },
  { text: "Switching to a new primary care physician. Need to complete intake forms and insurance information.", labels: { patient_intake_form: 1, patient_financial_responsibility: 1 } },
  { text: "Hospital wants me to sign forms about how they'll use my health information.", labels: { hipaa_notice_privacy_practices: 1 } },
  { text: "Getting surgery next week. They're asking me to review and sign financial responsibility documents.", labels: { patient_financial_responsibility: 1 } },
  { text: "New dentist office needs my medical history, insurance card, and emergency contact.", labels: { patient_intake_form: 1 } },

  // MEDICAL - Medical Records
  { text: "Moving to a new state. Need my complete medical records sent to my new doctor.", labels: { medical_records_release: 1, hipaa_authorization_release: 1 } },
  { text: "Applying for life insurance and they're requesting 10 years of medical history.", labels: { medical_records_release: 1, hipaa_authorization_release: 1 } },
  { text: "My daughter's pediatrician needs her vaccination records from our old clinic.", labels: { medical_records_release: 1 } },
  { text: "Personal injury lawyer needs my ER records and imaging from the accident.", labels: { medical_records_release: 1, hipaa_authorization_release: 1 } },
  { text: "Second opinion oncologist wants my pathology reports and treatment history.", labels: { medical_records_release: 1 } },

  // MEDICAL - Prescriptions
  { text: "My blood pressure medication is running low. Need to request a refill from my doctor.", labels: { prescription_refill_request: 1 } },
  { text: "Can't reach my doctor's office. Need to refill my insulin prescription urgently.", labels: { prescription_refill_request: 1 } },
  { text: "Moving pharmacies. Need to transfer all my prescriptions to the new location.", labels: { prescription_refill_request: 1 } },
  { text: "VA patient needing refills on three medications for PTSD and hypertension.", labels: { va_medication_refill: 1 } },
  { text: "My antidepressant prescription expired. Doctor's office wants me to fill out a refill request form.", labels: { prescription_refill_request: 1 } },

  // MEDICAL - Lab Results
  { text: "Doctor ordered bloodwork. Lab needs me to complete requisition forms before drawing blood.", labels: { laboratory_request_form: 1 } },
  { text: "Getting annual physical. Need forms for cholesterol panel and diabetes screening.", labels: { laboratory_request_form: 1 } },
  { text: "Oncologist ordered tumor markers and CBC. Going to an independent lab for testing.", labels: { lab_requisition_express: 1 } },
  { text: "Health department referred me for STD testing. They gave me paperwork to take to the lab.", labels: { public_health_lab_request: 1 } },
  { text: "Pre-surgical testing required. Need comprehensive metabolic panel and coagulation studies.", labels: { laboratory_request_form: 1 } },

  // BUSINESS - Sales
  { text: "Customer wants to purchase 500 units. Need to generate an official sales order.", labels: { sales_order_form: 1 } },
  { text: "Providing a quote for construction services. Client needs it in writing with payment terms.", labels: { sales_quote_template: 1 } },
  { text: "New client signed on. Need customer agreement outlining service terms and pricing.", labels: { customer_agreement: 1 } },
  { text: "Bulk order from corporate client. They require formal purchase documentation.", labels: { sales_order_form: 1, customer_agreement: 1 } },
  { text: "Potential customer requested detailed pricing for annual software subscription.", labels: { sales_quote_template: 1 } },

  // BUSINESS - Marketing
  { text: "Launching new product campaign. Need to document strategy, budget, and timeline.", labels: { marketing_campaign_brief: 1, marketing_budget: 1 } },
  { text: "Planning social media posts for Q4. Need to organize content schedule.", labels: { content_calendar: 1 } },
  { text: "Boss approved $50k for digital advertising. Need to break down spending by channel.", labels: { marketing_budget: 1 } },
  { text: "Email campaign targeting new subscribers. Creating brief with objectives and KPIs.", labels: { marketing_campaign_brief: 1 } },
  { text: "Managing blog posts, videos, and newsletters across three months.", labels: { content_calendar: 1 } },

  // BUSINESS - Operations
  { text: "Training new employees on our quality control process. Need written procedures.", labels: { standard_operating_procedure: 1 } },
  { text: "Documenting our order fulfillment workflow from receipt to shipping.", labels: { process_documentation: 1 } },
  { text: "New supplier wants to work with us. They need to complete our vendor application.", labels: { vendor_application: 1 } },
  { text: "ISO audit next month. Updating all our standard operating procedures.", labels: { standard_operating_procedure: 1 } },
  { text: "Onboarding new vendor for office supplies. They're filling out application forms.", labels: { vendor_application: 1 } },

  // BUSINESS - HR
  { text: "Just hired. Employer needs me to fill out tax withholding paperwork.", labels: { form_w4: 1 } },
  { text: "New job starts Monday. They sent me employment eligibility verification documents.", labels: { form_i9: 1 } },
  { text: "First day orientation. Need to sign that I received and read the employee handbook.", labels: { employee_handbook_acknowledgment: 1 } },
  { text: "Setting up paycheck direct deposit to my checking account.", labels: { direct_deposit_authorization: 1 } },
  { text: "HR needs emergency contact information in case something happens at work.", labels: { emergency_contact_form: 1 } },
  { text: "Starting new position. Need to complete tax forms, I-9, and provide two forms of ID.", labels: { form_w4: 1, form_i9: 1 } },

  // BUSINESS - Contracts
  { text: "Accepted job offer. They're sending over the formal employment agreement to sign.", labels: { employment_agreement: 1 } },
  { text: "Client wants me to sign NDA before discussing their proprietary technology.", labels: { non_disclosure_agreement: 1 } },
  { text: "Hired as 1099 contractor. They need signed independent contractor agreement.", labels: { independent_contractor_agreement: 1 } },
  { text: "New employer sent offer letter with salary, benefits, and non-compete clause.", labels: { employment_agreement: 1 } },
  { text: "Freelance web design project. Client wants contract specifying deliverables and payment.", labels: { independent_contractor_agreement: 1 } },

  // BUSINESS - Invoicing
  { text: "Completed consulting project. Need to bill client for 40 hours of work.", labels: { invoice_template: 1 } },
  { text: "Independent contractor. Need to invoice company and make sure it's 1099 compliant.", labels: { "1099_invoice": 1 } },
  { text: "Freelance graphic designer. Finished logo design and need to request payment.", labels: { invoice_template: 1 } },
  { text: "Contract work done. Company needs proper invoice for their accounts payable.", labels: { "1099_invoice": 1, invoice_template: 1 } },
  { text: "Monthly retainer client. Billing for services rendered in December.", labels: { invoice_template: 1 } },

  // FINANCE - Banking
  { text: "New employer needs my bank info to set up direct deposit payroll.", labels: { direct_deposit_form: 1 } },
  { text: "Sending money to family overseas. Bank needs me to complete wire transfer paperwork.", labels: { wire_transfer_form: 1 } },
  { text: "Opening checking and savings accounts. Need to fill out new account applications.", labels: { account_application: 1 } },
  { text: "Refinancing mortgage. Bank requires direct deposit setup for automatic payments.", labels: { direct_deposit_form: 1 } },
  { text: "Wiring down payment for house purchase. Need to complete transfer authorization.", labels: { wire_transfer_form: 1 } },

  // FINANCE - Investments
  { text: "Opening Roth IRA. Brokerage needs completed application and beneficiary designation.", labels: { investment_account_application: 1, beneficiary_designation: 1 } },
  { text: "Want my spouse to be able to trade in my investment account. Need authorization forms.", labels: { trading_authorization: 1 } },
  { text: "Just had a baby. Updating beneficiaries on my 401k and brokerage accounts.", labels: { beneficiary_designation: 1 } },
  { text: "Starting new brokerage account for day trading. They need personal and financial information.", labels: { investment_account_application: 1 } },
  { text: "Giving my financial advisor power to execute trades on my behalf.", labels: { trading_authorization: 1 } },

  // FINANCE - Tax Forms
  { text: "New freelance client needs my tax ID and signature before paying me.", labels: { form_w9: 1 } },
  { text: "Hired contractor for home renovation. Need to send him 1099 form for tax year.", labels: { form_1099_nec: 1 } },
  { text: "Bank sent form showing interest earned on savings account this year.", labels: { form_1099_int: 1 } },
  { text: "Got dividends from stock investments. Brokerage sent tax form in January.", labels: { form_1099_div: 1 } },
  { text: "Self-employed. Filing taxes and need to report business income and expenses.", labels: { form_1040: 1, schedule_c: 1 } },
  { text: "Paid freelance photographer $3,000 last year. Need to issue 1099.", labels: { form_1099_nec: 1 } },
  { text: "Tax season. Filing individual return and reporting my small business profits.", labels: { form_1040: 1, schedule_c: 1 } },

  // FINANCE - Budgeting
  { text: "Starting new business. Need to create monthly budget for first year operations.", labels: { budget_template: 1 } },
  { text: "Business trip last week. Submitting hotel, meals, and transportation costs for reimbursement.", labels: { expense_report: 1 } },
  { text: "Trying to save for house down payment. Creating personal monthly budget.", labels: { monthly_budget_worksheet: 1 } },
  { text: "Boss wants breakdown of department spending for Q1 budget planning.", labels: { budget_template: 1 } },
  { text: "Conference attendance last month. Need to document expenses and submit for payment.", labels: { expense_report: 1 } },

  // FINANCE - Insurance
  { text: "Car accident last month. Need to file claim with insurance company for repairs.", labels: { insurance_claim_form: 1 } },
  { text: "Lost job and need to continue health insurance through COBRA for my family.", labels: { cobra_election_form: 1 } },
  { text: "Shopping for health insurance on marketplace. Filling out application for coverage.", labels: { health_insurance_application: 1 } },
  { text: "House flooded. Filing homeowners insurance claim for water damage.", labels: { insurance_claim_form: 1 } },
  { text: "Job ended. Have spouse and one child on insurance. Need continuation coverage.", labels: { cobra_election_form: 1 } },

  // FINANCE - Accounting
  { text: "Starting LLC. Accountant needs chart of accounts set up for bookkeeping.", labels: { chart_of_accounts: 1 } },
  { text: "Year-end closing. Recording all financial transactions in general ledger.", labels: { general_ledger: 1 } },
  { text: "Vendor sent invoice for $5,000. Processing payment through accounts payable.", labels: { accounts_payable_form: 1 } },
  { text: "CPA doing annual audit. Needs organized general ledger for review.", labels: { general_ledger: 1 } },
  { text: "Multiple supplier invoices due this month. Managing payment schedule.", labels: { accounts_payable_form: 1 } },

  // EDUCATION - Student Records
  { text: "Transferring colleges. New school needs official transcripts sent from current university.", labels: { transcript_request: 1 } },
  { text: "Grad school application requires transcript release from undergraduate institution.", labels: { transcript_request: 1, ferpa_release_form: 1 } },
  { text: "Employer wants to verify my degree. Need to authorize university to share my records.", labels: { ferpa_release_form: 1 } },
  { text: "Enrolling child in middle school. They need immunization and academic records from elementary.", labels: { student_information_form: 1 } },
  { text: "Applying for professional license. Board needs my college transcripts.", labels: { transcript_request: 1 } },

  // EDUCATION - Grading
  { text: "Professor made error calculating my final grade. Need to submit grade change request.", labels: { grade_change_form: 1 } },
  { text: "Teaching high school. Setting up gradebook for semester grades and assignments.", labels: { gradebook_template: 1 } },
  { text: "Student failing two classes. Creating academic progress report for parents.", labels: { academic_progress_report: 1 } },
  { text: "Midterm grades wrong in system. Department chair needs documentation for correction.", labels: { grade_change_form: 1 } },
  { text: "Parent-teacher conferences next week. Preparing progress reports for all students.", labels: { academic_progress_report: 1 } },

  // EDUCATION - Curriculum
  { text: "Developing new unit on American History. Creating detailed lesson plans for three weeks.", labels: { lesson_plan_template: 1 } },
  { text: "First year teaching biology. Mapping out curriculum for entire academic year.", labels: { curriculum_map: 1 } },
  { text: "Teaching college course. Students need syllabus with grading policy and schedule.", labels: { course_syllabus_template: 1 } },
  { text: "Substitute teacher tomorrow. Regular teacher left lesson plans for the day.", labels: { lesson_plan_template: 1 } },
  { text: "Department updating math curriculum. Outlining learning objectives by grade level.", labels: { curriculum_map: 1 } },

  // EDUCATION - Attendance
  { text: "Taking attendance daily for my classroom. Need organized tracking system.", labels: { attendance_sheet: 1 } },
  { text: "Child was sick last week. School needs doctor's note to excuse absences.", labels: { absence_excuse_form: 1 } },
  { text: "Student late to class five times this month. Documenting tardiness for records.", labels: { tardy_report: 1 } },
  { text: "My son missed three days with flu. Submitting excuse form to attendance office.", labels: { absence_excuse_form: 1 } },
  { text: "Tracking student attendance patterns for intervention program eligibility.", labels: { attendance_sheet: 1 } },

  // EDUCATION - Enrollment
  { text: "Enrolling daughter in kindergarten for fall. School needs registration paperwork.", labels: { enrollment_application: 1, registration_form: 1 } },
  { text: "Transferring son to different elementary school. Completing enrollment application.", labels: { enrollment_application: 1 } },
  { text: "New to district. Registering two kids for school and providing emergency contacts.", labels: { registration_form: 1, emergency_contact_form_school: 1 } },
  { text: "Moving across town. Need to re-enroll children in new school zone.", labels: { enrollment_application: 1 } },
  { text: "School requires updated emergency contact information for student file.", labels: { emergency_contact_form_school: 1 } },

  // EDUCATION - Scholarships
  { text: "Applying for merit scholarship at state university. Need to submit application.", labels: { scholarship_application: 1 } },
  { text: "Completing FAFSA for financial aid. Need tax returns and income information.", labels: { financial_aid_form_fafsa: 1 } },
  { text: "Received notification I won $5,000 scholarship. They sent award letter.", labels: { scholarship_award_letter: 1 } },
  { text: "Daughter applying for college. Filling out FAFSA with family financial information.", labels: { financial_aid_form_fafsa: 1 } },
  { text: "Local organization offering scholarship for community service. Submitting application.", labels: { scholarship_application: 1 } },

  // PERSONAL - Travel
  { text: "Planning international trip. Never had passport before and need to apply.", labels: { passport_application_ds11: 1 } },
  { text: "Frequent flyer. Applying for TSA PreCheck to speed up airport security.", labels: { tsa_precheck_application: 1 } },
  { text: "Booking European vacation. Creating itinerary with flights, hotels, and activities.", labels: { travel_itinerary: 1 } },
  { text: "First time leaving the country. Need passport application for Mexico trip.", labels: { passport_application_ds11: 1 } },
  { text: "Business trip next month. Organizing travel schedule with meetings and reservations.", labels: { travel_itinerary: 1 } },

  // PERSONAL - Events
  { text: "Registering for charity 5K race. Need to complete registration form online.", labels: { event_registration_form: 1 } },
  { text: "Invited to wedding. Sending RSVP to let them know I'm attending plus one.", labels: { rsvp_form: 1 } },
  { text: "Planning company party. Reserving banquet hall and signing rental agreement.", labels: { venue_rental_agreement: 1 } },
  { text: "Attending conference. Completing registration with meal preferences and sessions.", labels: { event_registration_form: 1 } },
  { text: "Wedding reception venue requires signed contract and deposit.", labels: { venue_rental_agreement: 1 } },

  // PERSONAL - Surveys
  { text: "Participating in medical research survey. They need consent before I answer questions.", labels: { survey_consent_form: 1 } },
  { text: "Company wants employee feedback on workplace culture. Filling out questionnaire.", labels: { questionnaire_template: 1 } },
  { text: "Restaurant asked me to complete customer satisfaction survey after dining.", labels: { feedback_form: 1 } },
  { text: "University study on consumer habits. Agreeing to participate and signing consent.", labels: { survey_consent_form: 1 } },
  { text: "Product purchased last week. Company sent feedback form about experience.", labels: { feedback_form: 1 } },

  // PERSONAL - Applications
  { text: "Applying for software engineer position. Submitting resume and job application.", labels: { job_application: 1 } },
  { text: "High school senior. Completing college applications for five universities.", labels: { college_application: 1 } },
  { text: "Need car loan. Bank requires completed application with income and credit info.", labels: { loan_application: 1 } },
  { text: "Applying for mortgage. Lender needs detailed financial application with tax returns.", labels: { loan_application: 1 } },
  { text: "Saw job posting on LinkedIn. Filling out online application and uploading documents.", labels: { job_application: 1 } },

  // PERSONAL - Registration
  { text: "Turning 18 next month. Registering to vote before election deadline.", labels: { voter_registration: 1 } },
  { text: "Bought used car. Need to register it with DMV and get new license plates.", labels: { vehicle_registration: 1 } },
  { text: "Starting LLC. Filing business registration with state corporation commission.", labels: { business_registration: 1 } },
  { text: "Moved to new state. Need to register to vote and update voter information.", labels: { voter_registration: 1 } },
  { text: "Vehicle registration expired. Renewing with DMV and paying annual fees.", labels: { vehicle_registration: 1 } },

  // PERSONAL - Memberships
  { text: "Joining professional engineering society. Need to complete membership application.", labels: { membership_application: 1, professional_association_form: 1 } },
  { text: "Signing up for gym membership. They require agreement signature and payment info.", labels: { gym_membership_agreement: 1 } },
  { text: "Becoming member of local chamber of commerce. Filling out business membership form.", labels: { membership_application: 1 } },
  { text: "Joining fitness center near work. Reading membership terms and signing contract.", labels: { gym_membership_agreement: 1 } },
  { text: "Applying for AMA membership as licensed physician. Submitting credentials.", labels: { professional_association_form: 1 } },

  // Legacy medical forms for backward compatibility
  { text: "I recently lost my job and need to continue my health insurance. I have a spouse and two children who were also covered.", labels: { cobra_election_form: 1 } },
  { text: "My doctor wants to send my medical records to a specialist at Johns Hopkins. I need the form to authorize this release.", labels: { hipaa_authorization_release: 1 } },
  { text: "I'm applying for Medicaid in Virginia. My household income is around $28,000/year and I have three kids.", labels: { health_insurance_application: 1 } },
  { text: "Need to add my newborn daughter to my Medicare plan. She was born last month.", labels: { enrollment_application: 1 } },
  { text: "I have multiple sclerosis and need to provide documentation for my disability benefits.", labels: { hipaa_authorization_release: 1 } },
];

// Normalize form name to label key (e.g., "Research_Informed_Consent" -> "research_informed_consent")
function normalizeFormName(formName: string): string {
  return formName.toLowerCase().replace(/-/g, '_');
}

// Form mapping with comprehensive categories
const formMapping: Record<string, FormData> = {
  // MEDICAL CATEGORIES
  research_informed_consent: {
    formName: "Research Informed Consent",
    purpose: "Consent to participate in research studies",
    accessibility: "Research Study Consent Guide"
  },
  research_irb_protocol: {
    formName: "Research IRB Protocol",
    purpose: "Institutional review board research documentation",
    accessibility: "IRB Protocol Guide"
  },
  research_hipaa_authorization: {
    formName: "Research HIPAA Authorization",
    purpose: "Authorize research access to medical records",
    accessibility: "Research HIPAA Guide"
  },
  patient_intake_form: {
    formName: "Patient Intake Form",
    purpose: "New patient registration and medical history",
    accessibility: "Patient Registration Guide"
  },
  hipaa_notice_privacy_practices: {
    formName: "HIPAA Notice of Privacy Practices",
    purpose: "Understand how health information is used",
    accessibility: "HIPAA Privacy Guide"
  },
  patient_financial_responsibility: {
    formName: "Patient Financial Responsibility",
    purpose: "Acknowledge financial obligations for care",
    accessibility: "Financial Responsibility Guide"
  },
  medical_records_release: {
    formName: "Medical Records Release",
    purpose: "Request transfer of medical records",
    accessibility: "Records Release Guide"
  },
  hipaa_authorization_release: {
    formName: "HIPAA Authorization Release",
    purpose: "Authorize release of protected health information",
    accessibility: "HIPAA Release Guide"
  },
  medical_records_request_ny: {
    formName: "Medical Records Request (NY)",
    purpose: "New York state medical records request",
    accessibility: "NY Records Request Guide"
  },
  prescription_refill_request: {
    formName: "Prescription Refill Request",
    purpose: "Request medication refills from provider",
    accessibility: "Prescription Refill Guide"
  },
  prescription_refill_cognito: {
    formName: "Prescription Refill (Cognito)",
    purpose: "Digital prescription refill request",
    accessibility: "Online Refill Guide"
  },
  va_medication_refill: {
    formName: "VA Medication Refill",
    purpose: "Veterans Affairs medication refill",
    accessibility: "VA Refill Guide"
  },
  laboratory_request_form: {
    formName: "Laboratory Request Form",
    purpose: "Order laboratory tests and procedures",
    accessibility: "Lab Request Guide"
  },
  lab_requisition_express: {
    formName: "Lab Requisition (Express)",
    purpose: "Express laboratory test requisition",
    accessibility: "Express Lab Guide"
  },
  public_health_lab_request: {
    formName: "Public Health Lab Request",
    purpose: "Public health laboratory testing",
    accessibility: "Public Health Lab Guide"
  },

  // BUSINESS CATEGORIES
  sales_order_form: {
    formName: "Sales Order Form",
    purpose: "Document customer purchase orders",
    accessibility: "Sales Order Guide"
  },
  sales_quote_template: {
    formName: "Sales Quote Template",
    purpose: "Provide pricing quotes to customers",
    accessibility: "Sales Quote Guide"
  },
  customer_agreement: {
    formName: "Customer Agreement",
    purpose: "Formalize customer service terms",
    accessibility: "Customer Agreement Guide"
  },
  marketing_campaign_brief: {
    formName: "Marketing Campaign Brief",
    purpose: "Plan marketing campaign strategy",
    accessibility: "Campaign Planning Guide"
  },
  content_calendar: {
    formName: "Content Calendar",
    purpose: "Schedule content publication",
    accessibility: "Content Planning Guide"
  },
  marketing_budget: {
    formName: "Marketing Budget",
    purpose: "Plan marketing expenditures",
    accessibility: "Budget Planning Guide"
  },
  standard_operating_procedure: {
    formName: "Standard Operating Procedure",
    purpose: "Document operational processes",
    accessibility: "SOP Documentation Guide"
  },
  process_documentation: {
    formName: "Process Documentation",
    purpose: "Record workflow procedures",
    accessibility: "Process Guide"
  },
  vendor_application: {
    formName: "Vendor Application",
    purpose: "Onboard new vendor or supplier",
    accessibility: "Vendor Onboarding Guide"
  },
  form_w4: {
    formName: "Form W-4",
    purpose: "Employee tax withholding allowance",
    accessibility: "IRS W-4 Guide"
  },
  form_i9: {
    formName: "Form I-9",
    purpose: "Employment eligibility verification",
    accessibility: "USCIS I-9 Guide"
  },
  employee_handbook_acknowledgment: {
    formName: "Employee Handbook Acknowledgment",
    purpose: "Confirm receipt of employee handbook",
    accessibility: "Handbook Acknowledgment Guide"
  },
  direct_deposit_authorization: {
    formName: "Direct Deposit Authorization",
    purpose: "Set up payroll direct deposit",
    accessibility: "Direct Deposit Guide"
  },
  emergency_contact_form: {
    formName: "Emergency Contact Form",
    purpose: "Provide emergency contact information",
    accessibility: "Emergency Contact Guide"
  },
  new_hire_reporting: {
    formName: "New Hire Reporting",
    purpose: "Report new employee to state",
    accessibility: "New Hire Guide"
  },
  employment_agreement: {
    formName: "Employment Agreement",
    purpose: "Formalize employment terms",
    accessibility: "Employment Contract Guide"
  },
  non_disclosure_agreement: {
    formName: "Non-Disclosure Agreement",
    purpose: "Protect confidential information",
    accessibility: "NDA Guide"
  },
  independent_contractor_agreement: {
    formName: "Independent Contractor Agreement",
    purpose: "Establish contractor relationship",
    accessibility: "Contractor Agreement Guide"
  },
  invoice_template: {
    formName: "Invoice Template",
    purpose: "Bill clients for services",
    accessibility: "Invoicing Guide"
  },
  "1099_invoice": {
    formName: "1099 Invoice",
    purpose: "1099-compliant contractor invoice",
    accessibility: "1099 Invoicing Guide"
  },

  // FINANCE CATEGORIES
  direct_deposit_form: {
    formName: "Direct Deposit Form",
    purpose: "Set up direct bank deposit",
    accessibility: "Direct Deposit Setup Guide"
  },
  wire_transfer_form: {
    formName: "Wire Transfer Form",
    purpose: "Initiate wire transfer",
    accessibility: "Wire Transfer Guide"
  },
  account_application: {
    formName: "Account Application",
    purpose: "Open bank account",
    accessibility: "Account Opening Guide"
  },
  investment_account_application: {
    formName: "Investment Account Application",
    purpose: "Open investment or brokerage account",
    accessibility: "Investment Account Guide"
  },
  beneficiary_designation: {
    formName: "Beneficiary Designation",
    purpose: "Designate account beneficiaries",
    accessibility: "Beneficiary Guide"
  },
  trading_authorization: {
    formName: "Trading Authorization",
    purpose: "Authorize trading on behalf",
    accessibility: "Trading Authorization Guide"
  },
  form_w9: {
    formName: "Form W-9",
    purpose: "Request for taxpayer identification",
    accessibility: "IRS W-9 Guide"
  },
  form_1099_nec: {
    formName: "Form 1099-NEC",
    purpose: "Nonemployee compensation reporting",
    accessibility: "IRS 1099-NEC Guide"
  },
  form_1099_misc: {
    formName: "Form 1099-MISC",
    purpose: "Miscellaneous income reporting",
    accessibility: "IRS 1099-MISC Guide"
  },
  form_1099_int: {
    formName: "Form 1099-INT",
    purpose: "Interest income reporting",
    accessibility: "IRS 1099-INT Guide"
  },
  form_1099_div: {
    formName: "Form 1099-DIV",
    purpose: "Dividends and distributions",
    accessibility: "IRS 1099-DIV Guide"
  },
  form_1040: {
    formName: "Form 1040",
    purpose: "U.S. individual income tax return",
    accessibility: "IRS 1040 Guide"
  },
  schedule_c: {
    formName: "Schedule C",
    purpose: "Profit or loss from business",
    accessibility: "IRS Schedule C Guide"
  },
  budget_template: {
    formName: "Budget Template",
    purpose: "Plan financial budget",
    accessibility: "Budgeting Guide"
  },
  expense_report: {
    formName: "Expense Report",
    purpose: "Submit business expenses",
    accessibility: "Expense Reporting Guide"
  },
  monthly_budget_worksheet: {
    formName: "Monthly Budget Worksheet",
    purpose: "Track monthly finances",
    accessibility: "Monthly Budget Guide"
  },
  insurance_claim_form: {
    formName: "Insurance Claim Form",
    purpose: "File insurance claim",
    accessibility: "Claims Filing Guide"
  },
  cobra_election_form: {
    formName: "COBRA Election Form",
    purpose: "Continue health insurance after job loss",
    accessibility: "COBRA Coverage Guide"
  },
  health_insurance_application: {
    formName: "Health Insurance Application",
    purpose: "Apply for health insurance coverage",
    accessibility: "Health Insurance Guide"
  },
  chart_of_accounts: {
    formName: "Chart of Accounts",
    purpose: "Organize accounting categories",
    accessibility: "Accounting Guide"
  },
  general_ledger: {
    formName: "General Ledger",
    purpose: "Record all financial transactions",
    accessibility: "Ledger Guide"
  },
  accounts_payable_form: {
    formName: "Accounts Payable Form",
    purpose: "Manage vendor payments",
    accessibility: "Accounts Payable Guide"
  },

  // EDUCATION CATEGORIES
  ferpa_release_form: {
    formName: "FERPA Release Form",
    purpose: "Authorize education record release",
    accessibility: "FERPA Guide"
  },
  transcript_request: {
    formName: "Transcript Request",
    purpose: "Request official transcripts",
    accessibility: "Transcript Request Guide"
  },
  student_information_form: {
    formName: "Student Information Form",
    purpose: "Provide student enrollment information",
    accessibility: "Student Info Guide"
  },
  grade_change_form: {
    formName: "Grade Change Form",
    purpose: "Request grade correction",
    accessibility: "Grade Change Guide"
  },
  gradebook_template: {
    formName: "Gradebook Template",
    purpose: "Track student grades",
    accessibility: "Gradebook Guide"
  },
  academic_progress_report: {
    formName: "Academic Progress Report",
    purpose: "Report student academic progress",
    accessibility: "Progress Report Guide"
  },
  lesson_plan_template: {
    formName: "Lesson Plan Template",
    purpose: "Plan instructional lessons",
    accessibility: "Lesson Planning Guide"
  },
  curriculum_map: {
    formName: "Curriculum Map",
    purpose: "Map curriculum objectives",
    accessibility: "Curriculum Planning Guide"
  },
  course_syllabus_template: {
    formName: "Course Syllabus Template",
    purpose: "Outline course structure and policies",
    accessibility: "Syllabus Guide"
  },
  attendance_sheet: {
    formName: "Attendance Sheet",
    purpose: "Track student attendance",
    accessibility: "Attendance Guide"
  },
  absence_excuse_form: {
    formName: "Absence Excuse Form",
    purpose: "Excuse student absences",
    accessibility: "Absence Excuse Guide"
  },
  tardy_report: {
    formName: "Tardy Report",
    purpose: "Document student tardiness",
    accessibility: "Tardiness Guide"
  },
  enrollment_application: {
    formName: "Enrollment Application",
    purpose: "Enroll in educational institution",
    accessibility: "Enrollment Guide"
  },
  registration_form: {
    formName: "Registration Form",
    purpose: "Register for classes or programs",
    accessibility: "Registration Guide"
  },
  emergency_contact_form_school: {
    formName: "Emergency Contact Form (School)",
    purpose: "Provide school emergency contacts",
    accessibility: "School Emergency Contact Guide"
  },
  scholarship_application: {
    formName: "Scholarship Application",
    purpose: "Apply for scholarship funding",
    accessibility: "Scholarship Guide"
  },
  financial_aid_form_fafsa: {
    formName: "FAFSA (Financial Aid Form)",
    purpose: "Apply for federal student aid",
    accessibility: "FAFSA Guide"
  },
  scholarship_award_letter: {
    formName: "Scholarship Award Letter",
    purpose: "Document scholarship award",
    accessibility: "Award Letter Guide"
  },

  // PERSONAL CATEGORIES
  passport_application_ds11: {
    formName: "Passport Application (DS-11)",
    purpose: "Apply for U.S. passport",
    accessibility: "Passport Application Guide"
  },
  tsa_precheck_application: {
    formName: "TSA PreCheck Application",
    purpose: "Apply for TSA PreCheck",
    accessibility: "TSA PreCheck Guide"
  },
  travel_itinerary: {
    formName: "Travel Itinerary",
    purpose: "Plan travel schedule",
    accessibility: "Travel Planning Guide"
  },
  event_registration_form: {
    formName: "Event Registration Form",
    purpose: "Register for events",
    accessibility: "Event Registration Guide"
  },
  rsvp_form: {
    formName: "RSVP Form",
    purpose: "Respond to event invitation",
    accessibility: "RSVP Guide"
  },
  venue_rental_agreement: {
    formName: "Venue Rental Agreement",
    purpose: "Rent event venue",
    accessibility: "Venue Rental Guide"
  },
  survey_consent_form: {
    formName: "Survey Consent Form",
    purpose: "Consent to survey participation",
    accessibility: "Survey Consent Guide"
  },
  questionnaire_template: {
    formName: "Questionnaire Template",
    purpose: "Collect survey responses",
    accessibility: "Questionnaire Guide"
  },
  feedback_form: {
    formName: "Feedback Form",
    purpose: "Provide feedback or reviews",
    accessibility: "Feedback Guide"
  },
  job_application: {
    formName: "Job Application",
    purpose: "Apply for employment",
    accessibility: "Job Application Guide"
  },
  college_application: {
    formName: "College Application",
    purpose: "Apply for college admission",
    accessibility: "College Application Guide"
  },
  loan_application: {
    formName: "Loan Application",
    purpose: "Apply for financial loan",
    accessibility: "Loan Application Guide"
  },
  voter_registration: {
    formName: "Voter Registration",
    purpose: "Register to vote",
    accessibility: "Voter Registration Guide"
  },
  vehicle_registration: {
    formName: "Vehicle Registration",
    purpose: "Register motor vehicle",
    accessibility: "Vehicle Registration Guide"
  },
  business_registration: {
    formName: "Business Registration",
    purpose: "Register new business entity",
    accessibility: "Business Registration Guide"
  },
  membership_application: {
    formName: "Membership Application",
    purpose: "Apply for organization membership",
    accessibility: "Membership Guide"
  },
  gym_membership_agreement: {
    formName: "Gym Membership Agreement",
    purpose: "Sign up for gym membership",
    accessibility: "Gym Membership Guide"
  },
  professional_association_form: {
    formName: "Professional Association Form",
    purpose: "Join professional organization",
    accessibility: "Professional Association Guide"
  }
};

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function trainNaiveBayes() {
  // Collect all unique labels from training data
  const labelSet = new Set<string>();
  trainingData.forEach(ex => {
    Object.keys(ex.labels).forEach(label => labelSet.add(label));
  });

  const labels = Array.from(labelSet);
  const models: Record<string, any> = {};

  labels.forEach(label => {
    const positive = trainingData.filter(d => d.labels[label] === 1);
    const negative = trainingData.filter(d => !d.labels[label] || d.labels[label] === 0);

    const posWords: Record<string, number> = {};
    const negWords: Record<string, number> = {};

    positive.forEach(ex => {
      tokenize(ex.text).forEach(word => {
        posWords[word] = (posWords[word] || 0) + 1;
      });
    });

    negative.forEach(ex => {
      tokenize(ex.text).forEach(word => {
        negWords[word] = (negWords[word] || 0) + 1;
      });
    });

    const posTotal = Object.values(posWords).reduce((a, b) => a + b, 0);
    const negTotal = Object.values(negWords).reduce((a, b) => a + b, 0);

    models[label] = {
      posWords,
      negWords,
      posTotal,
      negTotal,
      prior: positive.length / trainingData.length
    };
  });

  return models;
}

const models = trainNaiveBayes();

interface ScoredLabel {
  label: string;
  score: number;
}

function predictNaiveBayes(text: string): ScoredLabel[] {
  const words = tokenize(text);
  const scores: ScoredLabel[] = [];

  const labels = Object.keys(models);

  labels.forEach(label => {
    const model = models[label];

    let score = 0;
    const uniqueWords = new Set(words);

    uniqueWords.forEach(word => {
      const posCount = model.posWords[word] || 0;
      const negCount = model.negWords[word] || 0;

      if (posCount > negCount) {
        score += (posCount - negCount);
      }
    });

    const normalizedScore = score / (words.length + 1);

    if (normalizedScore > 0.3) {
      scores.push({ label, score: normalizedScore });
    }
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

export function classifyHealthInsuranceQuery(text: string): FormData[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const predictions = predictNaiveBayes(text);

  // Return top 5 forms with highest scores
  const forms: FormData[] = [];
  const addedForms = new Set<string>();

  predictions.slice(0, 5).forEach(({ label }) => {
    if (formMapping[label] && !addedForms.has(label)) {
      forms.push(formMapping[label]);
      addedForms.add(label);
      console.log(`Recommended: ${formMapping[label].formName} (label: ${label})`);
    }
  });

  return forms;
}

// Generate a suitable project name from description
export function generateProjectName(description: string): string {
  if (!description || description.trim().length === 0) {
    return "New Project";
  }

  const text = description.toLowerCase();
  const words = tokenize(description);

  // Expanded keywords to detect project types
  const projectTypes: Record<string, string[]> = {
    "Health Insurance": ["health", "insurance", "medical", "healthcare", "coverage", "plan", "medicaid", "medicare", "cobra"],
    "Tax Documents": ["tax", "taxes", "irs", "filing", "return", "deduction", "1099", "1040", "w9", "w4"],
    "Employment": ["job", "work", "employment", "employer", "hire", "salary", "position", "career"],
    "Legal Documents": ["legal", "court", "lawyer", "attorney", "lawsuit", "contract", "agreement"],
    "Immigration": ["visa", "immigration", "passport", "citizenship", "green card"],
    "Housing": ["housing", "rent", "mortgage", "apartment", "lease", "home"],
    "Education": ["school", "college", "university", "student", "education", "tuition", "transcript", "fafsa"],
    "Business": ["business", "company", "startup", "corporation", "llc", "incorporate", "vendor", "sales"],
    "Financial Aid": ["financial aid", "scholarship", "loan", "fafsa", "grant"],
    "Government Benefits": ["benefits", "government", "social security", "welfare", "assistance"],
    "Family Documents": ["family", "marriage", "divorce", "child", "custody", "birth"],
    "Medical Records": ["records", "medical", "doctor", "hospital", "treatment", "prescription"],
    "Research": ["research", "study", "clinical", "trial", "irb", "consent"],
    "Banking": ["bank", "deposit", "wire", "transfer", "account", "checking", "savings"],
    "Investments": ["invest", "brokerage", "stocks", "bonds", "retirement", "401k", "ira"],
    "Accounting": ["accounting", "ledger", "payable", "receivable", "bookkeeping"],
    "Marketing": ["marketing", "campaign", "advertising", "content", "promotion"],
    "Travel": ["travel", "passport", "tsa", "flight", "vacation", "itinerary"],
  };

  // Find matching project type
  for (const [projectType, keywords] of Object.entries(projectTypes)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return `${projectType} Project`;
      }
    }
  }

  // If no specific match, create a name from key nouns in the description
  const importantWords = words.filter(w =>
    w.length > 4 &&
    !['about', 'would', 'could', 'should', 'their', 'there', 'these', 'those', 'which', 'where', 'being'].includes(w)
  );

  if (importantWords.length > 0) {
    // Capitalize first letter
    const keyWord = importantWords[0].charAt(0).toUpperCase() + importantWords[0].slice(1);
    return `${keyWord} Project`;
  }

  return "Custom Project";
}
