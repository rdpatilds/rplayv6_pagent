// Default parameter categories and parameters for seeding the database

export const defaultCategories = [
  {
    name: "Demographics",
    key: "demographics",
    parameter_type: "structured",
  },
  {
    name: "Education",
    key: "education",
    parameter_type: "structured",
  },
  {
    name: "Employment",
    key: "employment",
    parameter_type: "structured",
  },
  {
    name: "Financial",
    key: "financial",
    parameter_type: "structured",
  },
  {
    name: "Health",
    key: "health",
    parameter_type: "life",
  },
  {
    name: "Relationships",
    key: "relationships",
    parameter_type: "life",
  },
  {
    name: "Personality",
    key: "personality",
    parameter_type: "life",
  },
  {
    name: "Content Restrictions",
    key: "content-restrictions",
    parameter_type: "guardrail",
  },
  {
    name: "Behavioral Constraints",
    key: "behavioral-constraints",
    parameter_type: "guardrail",
  },
]

export const defaultParameters = [
  // Structured Parameters - Demographics
  {
    name: "Age",
    description: "The age of the simulated entity",
    type: "structured",
    category_key: "demographics",
    range: "18-100",
    examples: "25, 42, 67",
  },
  {
    name: "Gender",
    description: "The gender identity of the simulated entity",
    type: "structured",
    category_key: "demographics",
    examples: "Male, Female, Non-binary",
  },
  {
    name: "Location",
    description: "The geographic location of the simulated entity",
    type: "structured",
    category_key: "demographics",
    examples: "New York, USA; London, UK; Tokyo, Japan",
  },

  // Structured Parameters - Education
  {
    name: "Education Level",
    description: "The highest level of education completed",
    type: "structured",
    category_key: "education",
    examples: "High School, Bachelor's Degree, Master's Degree, PhD",
  },
  {
    name: "Field of Study",
    description: "The academic discipline or professional field",
    type: "structured",
    category_key: "education",
    examples: "Computer Science, Medicine, Business, Arts",
  },

  // Structured Parameters - Employment
  {
    name: "Occupation",
    description: "The current job or profession",
    type: "structured",
    category_key: "employment",
    examples: "Software Engineer, Doctor, Teacher, Artist",
  },
  {
    name: "Income Level",
    description: "Annual income range",
    type: "structured",
    category_key: "employment",
    range: "$0-$1,000,000+",
    examples: "$45,000, $120,000, $250,000",
  },

  // Structured Parameters - Financial
  {
    name: "Credit Score",
    description: "Credit worthiness score",
    type: "structured",
    category_key: "financial",
    range: "300-850",
    examples: "580, 720, 800",
  },
  {
    name: "Savings",
    description: "Amount in savings accounts",
    type: "structured",
    category_key: "financial",
    range: "$0-$10,000,000+",
    examples: "$5,000, $50,000, $500,000",
  },

  // Life Parameters - Health
  {
    name: "Physical Health",
    description: "Overall physical health condition",
    type: "life",
    category_key: "health",
    examples: "Excellent, Good, Fair, Poor",
  },
  {
    name: "Mental Health",
    description: "Overall mental and emotional wellbeing",
    type: "life",
    category_key: "health",
    examples: "Stable, Anxious, Depressed, Thriving",
  },

  // Life Parameters - Relationships
  {
    name: "Marital Status",
    description: "Current relationship status",
    type: "life",
    category_key: "relationships",
    examples: "Single, Married, Divorced, Widowed",
  },
  {
    name: "Family Size",
    description: "Number of family members",
    type: "life",
    category_key: "relationships",
    range: "0-20+",
    examples: "0, 2, 5, 8",
  },

  // Life Parameters - Personality
  {
    name: "Extraversion",
    description: "Tendency to seek stimulation and engage with others",
    type: "life",
    category_key: "personality",
    range: "1-10",
    examples: "2 (Introverted), 5 (Balanced), 9 (Highly Extraverted)",
  },
  {
    name: "Conscientiousness",
    description: "Tendency to be organized and dependable",
    type: "life",
    category_key: "personality",
    range: "1-10",
    examples: "3 (Spontaneous), 6 (Moderately Organized), 10 (Highly Disciplined)",
  },

  // Guardrail Parameters - Content Restrictions
  {
    name: "Profanity Filter",
    description: "Level of profanity filtering",
    type: "guardrail",
    category_key: "content-restrictions",
    examples: "None, Mild, Moderate, Strict",
  },
  {
    name: "Sensitive Topics",
    description: "Topics to avoid in simulation",
    type: "guardrail",
    category_key: "content-restrictions",
    examples: "Politics, Religion, Violence, None",
  },

  // Guardrail Parameters - Behavioral Constraints
  {
    name: "Ethical Boundaries",
    description: "Ethical constraints on simulated behavior",
    type: "guardrail",
    category_key: "behavioral-constraints",
    examples: "Standard, Permissive, Strict",
  },
  {
    name: "Realism Level",
    description: "How realistic the simulation should be",
    type: "guardrail",
    category_key: "behavioral-constraints",
    range: "1-10",
    examples: "3 (Simplified), 7 (Realistic), 10 (Hyper-realistic)",
  },
]
