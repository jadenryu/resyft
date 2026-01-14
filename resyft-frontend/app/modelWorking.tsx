interface FormData {
  formName: string;
  purpose: string;
  accessibility: string;
}

interface TrainingExample {
  text: string;
  labels: {
    hipaa?: number;
    cobra?: number;
    medicaid?: number;
    enrollment?: number;
    disability?: number;
    income?: number;
    dependents?: number;
  };
}

type LabelKey = 'hipaa' | 'cobra' | 'medicaid' | 'enrollment' | 'disability' | 'income' | 'dependents';

const trainingData: TrainingExample[] = [
  { text: "I recently lost my job and need to continue my health insurance. I have a spouse and two children who were also covered.", labels: { cobra: 1, dependents: 1 } },
  { text: "My doctor wants to send my medical records to a specialist at Johns Hopkins. I need the form to authorize this release.", labels: { hipaa: 1 } },
  { text: "I'm applying for Medicaid in Virginia. My household income is around $28,000/year and I have three kids.", labels: { medicaid: 1, income: 1, dependents: 1 } },
  { text: "Need to add my newborn daughter to my Medicare plan. She was born last month.", labels: { enrollment: 1, dependents: 1 } },
  { text: "I have multiple sclerosis and need to provide documentation for my disability benefits.", labels: { hipaa: 1, disability: 1 } },
  { text: "Got laid off two weeks ago. Company had 60 employees. I have my wife and one kid on my insurance.", labels: { cobra: 1, income: 1, dependents: 1 } },
  { text: "Moving from one Medicare Advantage plan to another during open enrollment.", labels: { enrollment: 1 } },
  { text: "I need to let my physical therapist access my surgery records from last year.", labels: { hipaa: 1 } },
  { text: "Applying for Virginia Medicaid. Single mother, income approximately $32,000 annually, two children.", labels: { medicaid: 1, income: 1, dependents: 1 } },
  { text: "My employer terminated my position last Friday. I have diabetes and can't afford to lose coverage.", labels: { cobra: 1, income: 1, dependents: 1 } },
  { text: "Need forms to prove my disability status for Medicare. I have rheumatoid arthritis.", labels: { hipaa: 1, disability: 1 } },
  { text: "Just got married and need to add my spouse to my health plan.", labels: { enrollment: 1, dependents: 1 } },
  { text: "I work freelance and my income varies a lot. Need health insurance and can't afford much.", labels: { medicaid: 1, income: 1 } },
  { text: "Company is downsizing and I'm losing my job next month. Have a wife and no kids.", labels: { cobra: 1, dependents: 1 } },
  { text: "My son needs his immunization records transferred to his new school.", labels: { hipaa: 1, dependents: 1 } },
  { text: "Need to submit proof of income for my health insurance application. I'm self-employed.", labels: { income: 1 } },
  { text: "Switching from regular Medicare to a Medicare Advantage plan.", labels: { enrollment: 1 } },
  { text: "I have lupus and chronic kidney disease. Applying for disability benefits.", labels: { hipaa: 1, disability: 1 } },
  { text: "Lost job due to company bankruptcy. Three kids and pregnant wife on my insurance.", labels: { cobra: 1, income: 1, dependents: 1 } },
  { text: "Household income dropped to $24,000. I have one child and think we might qualify for Medicaid.", labels: { medicaid: 1, income: 1, dependents: 1 } },
  { text: "Removing my ex-spouse from my health insurance after divorce.", labels: { enrollment: 1 } },
  { text: "My therapist needs my psychiatric records from my previous provider.", labels: { hipaa: 1 } },
  { text: "Been approved for Social Security Disability. Now need to enroll in Medicare.", labels: { enrollment: 1, disability: 1 } },
  { text: "Job ended September 30th. Single, no dependents. Need continuation coverage.", labels: { cobra: 1, income: 1 } },
  { text: "Pregnant and uninsured. Income is $18,500. Live in Virginia.", labels: { medicaid: 1, income: 1 } },
  { text: "Turning 26 next month and aging out of parents' plan.", labels: { enrollment: 1 } },
  { text: "Doctor requires medical records from my cardiologist before surgery.", labels: { hipaa: 1 } },
  { text: "I have fibromyalgia and chronic fatigue syndrome. Can't work anymore.", labels: { hipaa: 1, disability: 1 } },
  { text: "Position eliminated at work. Family of four - me, spouse, two kids.", labels: { cobra: 1, income: 1, dependents: 1 } },
  { text: "Applied for Medicaid but they're asking for more income documentation.", labels: { medicaid: 1, income: 1, dependents: 1 } }
];

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function trainNaiveBayes() {
  const labels: LabelKey[] = ['hipaa', 'cobra', 'medicaid', 'enrollment', 'disability', 'income', 'dependents'];
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

function predictNaiveBayes(text: string): Record<LabelKey, boolean> {
  const words = tokenize(text);
  const predictions: Record<string, boolean> = {};
  
  const labels: LabelKey[] = ['hipaa', 'cobra', 'medicaid', 'enrollment', 'disability', 'income', 'dependents'];
  
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
    
    console.log(`  ${label}: score = ${normalizedScore.toFixed(3)} (raw: ${score})`);
    
    predictions[label] = normalizedScore > 0.3;
  });
  
  return predictions as Record<LabelKey, boolean>;
}

const formMapping: Record<LabelKey, FormData> = {
  hipaa: {
    formName: "HIPAA Authorization Form",
    purpose: "Authorize release of medical records",
    accessibility: "HIPAA Release Guide"
  },
  cobra: {
    formName: "COBRA Continuation Form",
    purpose: "Continue health insurance after job loss",
    accessibility: "COBRA Coverage Guide"
  },
  medicaid: {
    formName: "Medicaid Application",
    purpose: "Apply for state health insurance",
    accessibility: "Medicaid Enrollment Guide"
  },
  enrollment: {
    formName: "Enrollment Change Form",
    purpose: "Modify health insurance coverage",
    accessibility: "Coverage Change Guide"
  },
  disability: {
    formName: "Disability Documentation Form",
    purpose: "Provide disability status information",
    accessibility: "Disability Benefits Guide"
  },
  income: {
    formName: "Income Verification Form",
    purpose: "Verify household income for eligibility",
    accessibility: "Income Documentation Guide"
  },
  dependents: {
    formName: "Dependent Information Form",
    purpose: "Add or update dependent coverage",
    accessibility: "Dependent Coverage Guide"
  }
};

export function classifyHealthInsuranceQuery(text: string): FormData[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const predictions = predictNaiveBayes(text);

  const forms: FormData[] = [];
  const labels: LabelKey[] = ['hipaa', 'cobra', 'medicaid', 'enrollment', 'disability', 'income', 'dependents'];

  labels.forEach(label => {
    if (predictions[label]) {
      forms.push(formMapping[label]);
      console.log("Found These Thingies:", formMapping[label].formName);
    }
  });

  return forms;
}

// Generate a suitable project name from description when no forms match
export function generateProjectName(description: string): string {
  if (!description || description.trim().length === 0) {
    return "New Project";
  }

  const text = description.toLowerCase();
  const words = tokenize(description);

  // Keywords to detect project types
  const projectTypes: Record<string, string[]> = {
    "Health Insurance": ["health", "insurance", "medical", "healthcare", "coverage", "plan"],
    "Tax Documents": ["tax", "taxes", "irs", "filing", "return", "deduction"],
    "Employment": ["job", "work", "employment", "employer", "hire", "salary", "position"],
    "Legal Documents": ["legal", "court", "lawyer", "attorney", "lawsuit", "contract"],
    "Immigration": ["visa", "immigration", "passport", "citizenship", "green card"],
    "Housing": ["housing", "rent", "mortgage", "apartment", "lease", "home"],
    "Education": ["school", "college", "university", "student", "education", "tuition"],
    "Business": ["business", "company", "startup", "corporation", "llc", "incorporate"],
    "Financial Aid": ["financial aid", "scholarship", "loan", "fafsa", "grant"],
    "Government Benefits": ["benefits", "government", "social security", "welfare", "assistance"],
    "Family Documents": ["family", "marriage", "divorce", "child", "custody", "birth"],
    "Medical Records": ["records", "medical", "doctor", "hospital", "treatment"],
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