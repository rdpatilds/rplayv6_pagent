import fs from "fs"
import path from "path"
import type { DifficultyRubric } from "./rubrics"

// Define types for our rubric structure
export type CompetencyRubric = {
  id: string
  name: string
  description: string
  rubric: DifficultyRubric
}

// Define the path for our data files
const DATA_DIR = path.join(process.cwd(), "data")
const COMPETENCIES_FILE = path.join(DATA_DIR, "competencies.json")
const RUBRICS_FILE = path.join(DATA_DIR, "rubrics.json")
const INDUSTRY_COMPETENCIES_FILE = path.join(DATA_DIR, "industry-competencies.json")
const INDUSTRY_METADATA_FILE = path.join(DATA_DIR, "industry-metadata.json")
const DIFFICULTY_SETTINGS_FILE = path.join(DATA_DIR, "difficulty-settings.json")

// Update the file path handling and add better initialization for missing files

// At the beginning of the file, after the imports, add this:
console.log("Current working directory:", process.cwd())
console.log("Data directory path:", path.join(process.cwd(), "data"))

// Replace the existing initialization code with this more robust version:
// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory: ${DATA_DIR}`)
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Default industry competencies
const defaultIndustryCompetencies = {
  insurance: {
    "life-health": {
      competencies: [
        "communication",
        "needs-assessment",
        "objection-handling",
        "bias-awareness",
        "option-suggestions",
        "time-management",
      ],
      focusAreas: {
        "life-insurance": {
          competencies: [],
          enabled: true,
        },
        annuities: {
          competencies: [],
          enabled: true,
        },
        "long-term-care": {
          competencies: [],
          enabled: true,
        },
        "medical-expense": {
          competencies: [],
          enabled: true,
        },
        "disability-insurance": {
          competencies: [],
          enabled: true,
        },
      },
    },
    "property-casualty": {
      competencies: [
        "communication",
        "needs-assessment",
        "objection-handling",
        "bias-awareness",
        "option-suggestions",
        "time-management",
      ],
      focusAreas: {
        "homeowners-insurance": {
          competencies: [],
          enabled: true,
        },
        "automobile-insurance": {
          competencies: [],
          enabled: true,
        },
      },
    },
  },
  "wealth-management": {
    default: {
      competencies: [
        "communication",
        "needs-assessment",
        "objection-handling",
        "bias-awareness",
        "option-suggestions",
        "time-management",
      ],
      focusAreas: {},
    },
  },
  securities: {
    default: {
      competencies: [
        "communication",
        "needs-assessment",
        "objection-handling",
        "bias-awareness",
        "option-suggestions",
        "time-management",
      ],
      focusAreas: {},
    },
  },
}

// Default industry metadata
const defaultIndustryMetadata = {
  insurance: {
    displayName: "Insurance",
    subcategories: {
      "life-health": {
        displayName: "Life & Health",
      },
      "property-casualty": {
        displayName: "Property & Casualty",
      },
    },
  },
  "wealth-management": {
    displayName: "Wealth Management",
    subcategories: {
      default: {
        displayName: "Default",
      },
    },
  },
  securities: {
    displayName: "Securities",
    subcategories: {
      default: {
        displayName: "Default",
      },
    },
  },
}

// Default difficulty settings with visibility controls for client details
const defaultDifficultySettings = {
  insurance: {
    beginner: {
      description: "Build foundational skills. All client details are provided upfront.",
      objectives:
        "Active listening, rapport-building, confirming client details, and explaining basic financial concepts (e.g., budgeting, life insurance basics).",
      clientBehavior: "Friendly, cooperative, and open.",
      sampleScenario: "John Smith, a teacher with stable income and savings planning for children's education.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: true,
        assets: true,
        debt: true,
        primaryGoals: true,
      },
    },
    intermediate: {
      description: "Requires deeper trust-building with partially hidden information.",
      objectives:
        "Uncover hidden details, ask open-ended questions, and explain moderately complex concepts (e.g., insurance types, retirement planning).",
      clientBehavior: "Hesitant and reserved.",
      sampleScenario: "Susan Lee, a nurse with moderate income and student loan debt saving for a first home.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
    advanced: {
      description: "Involves uncooperative or skeptical clients.",
      objectives:
        "Handle objections empathetically, uncover fully hidden details, and explain advanced strategies (e.g., risk management, tax implications).",
      clientBehavior: "Skeptical, challenging, and resistant.",
      sampleScenario: "Michael Torres, an entrepreneur with high income but significant business debt.",
      visibleDetails: {
        name: true,
        age: false,
        familyStatus: false,
        occupation: false,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
  },
  "wealth-management": {
    beginner: {
      description: "Build foundational skills. All client details are provided upfront.",
      objectives:
        "Active listening, rapport-building, confirming client details, and explaining basic investment concepts (e.g., risk vs. return, diversification).",
      clientBehavior: "Friendly, cooperative, and open.",
      sampleScenario:
        "Emily Johnson, a recently retired teacher with a pension and modest savings looking to generate income.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: true,
        assets: true,
        debt: true,
        primaryGoals: true,
      },
    },
    intermediate: {
      description: "Requires deeper trust-building with partially hidden information.",
      objectives:
        "Uncover hidden details, ask open-ended questions, and explain moderately complex concepts (e.g., tax-efficient investing, retirement withdrawal strategies).",
      clientBehavior: "Hesitant and reserved.",
      sampleScenario:
        "David Chen, a mid-career professional with multiple retirement accounts and concerns about market volatility.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
    advanced: {
      description: "Involves uncooperative or skeptical clients.",
      objectives:
        "Handle objections empathetically, uncover fully hidden details, and explain advanced strategies (e.g., estate planning, tax optimization).",
      clientBehavior: "Skeptical, challenging, and resistant.",
      sampleScenario:
        "Sarah Williams, a high-net-worth business owner with complex assets and trust issues from previous advisors.",
      visibleDetails: {
        name: true,
        age: false,
        familyStatus: false,
        occupation: false,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
  },
  securities: {
    beginner: {
      description: "Build foundational skills. All client details are provided upfront.",
      objectives:
        "Active listening, rapport-building, confirming client details, and explaining basic securities concepts (e.g., stocks, bonds, mutual funds).",
      clientBehavior: "Friendly, cooperative, and open.",
      sampleScenario: "Robert Taylor, a young professional starting to invest with a focus on long-term growth.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: true,
        assets: true,
        debt: true,
        primaryGoals: true,
      },
    },
    intermediate: {
      description: "Requires deeper trust-building with partially hidden information.",
      objectives:
        "Uncover hidden details, ask open-ended questions, and explain moderately complex concepts (e.g., options, ETFs, sector allocation).",
      clientBehavior: "Hesitant and reserved.",
      sampleScenario:
        "Jennifer Lopez, an experienced investor looking to optimize her portfolio after a recent market downturn.",
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
    advanced: {
      description: "Involves uncooperative or skeptical clients.",
      objectives:
        "Handle objections empathetically, uncover fully hidden details, and explain advanced strategies (e.g., derivatives, alternative investments).",
      clientBehavior: "Skeptical, challenging, and resistant.",
      sampleScenario:
        "William Chang, a sophisticated trader with specific performance expectations and concerns about advisor conflicts of interest.",
      visibleDetails: {
        name: true,
        age: false,
        familyStatus: false,
        occupation: false,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
  },
}

// Initialize files with default data if they don't exist
if (!fs.existsSync(COMPETENCIES_FILE)) {
  console.log(`Creating default competencies file: ${COMPETENCIES_FILE}`)
  const defaultCompetencies = [
    {
      id: "communication",
      name: "Communication Skills",
      description: "Ability to clearly articulate concepts and actively listen to clients",
    },
    {
      id: "needs-assessment",
      name: "Needs Assessment",
      description: "Ability to identify and prioritize client needs through questioning",
    },
    {
      id: "objection-handling",
      name: "Objection Handling",
      description: "Ability to address client concerns and resistance effectively",
    },
    {
      id: "bias-awareness",
      name: "Bias Awareness",
      description: "Ability to recognize and mitigate personal biases in client interactions",
    },
    {
      id: "option-suggestions",
      name: "Solution Recommendations",
      description: "Ability to suggest appropriate options based on client needs",
    },
    {
      id: "time-management",
      name: "Time Management",
      description: "Ability to efficiently use meeting time while covering necessary topics",
    },
  ]
  fs.writeFileSync(COMPETENCIES_FILE, JSON.stringify(defaultCompetencies, null, 2))
}

// Update the initialization of default rubrics with the new structure
if (!fs.existsSync(RUBRICS_FILE)) {
  console.log(`Creating default rubrics file: ${RUBRICS_FILE}`)
  const defaultRubrics = [
    {
      id: "communication",
      name: "Communication Skills",
      description: "Ability to clearly articulate concepts and actively listen to clients",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Used inappropriate or unprofessional language",
              "Failed to listen to client concerns",
              "Communicated in a confusing or unclear manner",
              "Used jargon without explanation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Used mostly appropriate language with some issues",
              "Showed limited active listening",
              "Communicated with some clarity but had gaps",
              "Occasionally used unexplained jargon",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Used appropriate professional language",
              "Demonstrated basic active listening",
              "Communicated clearly most of the time",
              "Explained most technical terms",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Used consistently professional language",
              "Demonstrated strong active listening",
              "Communicated clearly and effectively",
              "Explained all technical terms appropriately",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Used exemplary professional language",
              "Demonstrated exceptional active listening",
              "Communicated with outstanding clarity and impact",
              "Made complex concepts accessible and understandable",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Used inappropriate or unprofessional language",
              "Failed to listen to client concerns",
              "Communicated in a confusing or unclear manner",
              "Used jargon without explanation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Used mostly appropriate language with some issues",
              "Showed limited active listening",
              "Communicated with some clarity but had gaps",
              "Occasionally used unexplained jargon",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Used appropriate professional language",
              "Demonstrated basic active listening",
              "Communicated clearly most of the time",
              "Explained most technical terms",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Used consistently professional language",
              "Demonstrated strong active listening",
              "Communicated clearly and effectively",
              "Explained all technical terms appropriately",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Used exemplary professional language",
              "Demonstrated exceptional active listening",
              "Communicated with outstanding clarity and impact",
              "Made complex concepts accessible and understandable",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Used inappropriate or unprofessional language",
              "Failed to listen to client concerns",
              "Communicated in a confusing or unclear manner",
              "Used jargon without explanation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Used mostly appropriate language with some issues",
              "Showed limited active listening",
              "Communicated with some clarity but had gaps",
              "Occasionally used unexplained jargon",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Used appropriate professional language",
              "Demonstrated basic active listening",
              "Communicated clearly most of the time",
              "Explained most technical terms",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Used consistently professional language",
              "Demonstrated strong active listening",
              "Communicated clearly and effectively",
              "Explained all technical terms appropriately",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Used exemplary professional language",
              "Demonstrated exceptional active listening",
              "Communicated with outstanding clarity and impact",
              "Made complex concepts accessible and understandable",
            ],
          },
        ],
      },
    },
    {
      id: "needs-assessment",
      name: "Needs Assessment",
      description: "Ability to identify and prioritize client needs through questioning",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Asked leading questions",
              "Failed to identify client's primary needs",
              "Did not ask follow-up questions",
              "Made assumptions about client's situation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Asked some relevant questions but missed key areas",
              "Identified some client needs but not all",
              "Limited follow-up questions",
              "Made some assumptions about client's situation",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Asked relevant questions to identify client needs",
              "Identified most client needs",
              "Asked appropriate follow-up questions",
              "Avoided making assumptions",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Probed deeply to uncover underlying needs",
              "Identified all client needs accurately",
              "Asked insightful follow-up questions",
              "Validated assumptions with client",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully uncovered hidden needs",
              "Prioritized needs effectively",
              "Asked highly targeted follow-up questions",
              "Created a comprehensive understanding of client's situation",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Asked leading questions",
              "Failed to identify client's primary needs",
              "Did not ask follow-up questions",
              "Made assumptions about client's situation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Asked some relevant questions but missed key areas",
              "Identified some client needs but not all",
              "Limited follow-up questions",
              "Made some assumptions about client's situation",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Asked relevant questions to identify client needs",
              "Identified most client needs",
              "Asked appropriate follow-up questions",
              "Avoided making assumptions",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Probed deeply to uncover underlying needs",
              "Identified all client needs accurately",
              "Asked insightful follow-up questions",
              "Validated assumptions with client",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully uncovered hidden needs",
              "Prioritized needs effectively",
              "Asked highly targeted follow-up questions",
              "Created a comprehensive understanding of client's situation",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Asked leading questions",
              "Failed to identify client's primary needs",
              "Did not ask follow-up questions",
              "Made assumptions about client's situation",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Asked some relevant questions but missed key areas",
              "Identified some client needs but not all",
              "Limited follow-up questions",
              "Made some assumptions about client's situation",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Asked relevant questions to identify client needs",
              "Identified most client needs",
              "Asked appropriate follow-up questions",
              "Avoided making assumptions",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Probed deeply to uncover underlying needs",
              "Identified all client needs accurately",
              "Asked insightful follow-up questions",
              "Validated assumptions with client",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully uncovered hidden needs",
              "Prioritized needs effectively",
              "Asked highly targeted follow-up questions",
              "Created a comprehensive understanding of client's situation",
            ],
          },
        ],
      },
    },
    {
      id: "objection-handling",
      name: "Objection Handling",
      description: "Ability to address client concerns and resistance effectively",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Dismissed client concerns",
              "Became defensive or argumentative",
              "Failed to address objections",
              "Used pressure tactics",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Acknowledged objections but did not address them effectively",
              "Showed some defensiveness",
              "Offered generic responses",
              "Continued to push product/service",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Acknowledged and addressed objections",
              "Remained calm and professional",
              "Provided basic explanations",
              "Focused on features rather than benefits",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Anticipated and addressed objections proactively",
              "Demonstrated empathy and understanding",
              "Provided tailored solutions",
              "Focused on benefits and value",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Turned objections into opportunities",
              "Built trust and rapport",
              "Provided compelling solutions",
              "Created a win-win situation",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Dismissed client concerns",
              "Became defensive or argumentative",
              "Failed to address objections",
              "Used pressure tactics",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Acknowledged objections but did not address them effectively",
              "Showed some defensiveness",
              "Offered generic responses",
              "Continued to push product/service",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Acknowledged and addressed objections",
              "Remained calm and professional",
              "Provided basic explanations",
              "Focused on features rather than benefits",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Anticipated and addressed objections proactively",
              "Demonstrated empathy and understanding",
              "Provided tailored solutions",
              "Focused on benefits and value",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Turned objections into opportunities",
              "Built trust and rapport",
              "Provided compelling solutions",
              "Created a win-win situation",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Dismissed client concerns",
              "Became defensive or argumentative",
              "Failed to address objections",
              "Used pressure tactics",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Acknowledged objections but did not address them effectively",
              "Showed some defensiveness",
              "Offered generic responses",
              "Continued to push product/service",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Acknowledged and addressed objections",
              "Remained calm and professional",
              "Provided basic explanations",
              "Focused on features rather than benefits",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Anticipated and addressed objections proactively",
              "Demonstrated empathy and understanding",
              "Provided tailored solutions",
              "Focused on benefits and value",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Turned objections into opportunities",
              "Built trust and rapport",
              "Provided compelling solutions",
              "Created a win-win situation",
            ],
          },
        ],
      },
    },
    {
      id: "bias-awareness",
      name: "Bias Awareness",
      description: "Ability to recognize and mitigate personal biases in client interactions",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Demonstrated clear bias in language or behavior",
              "Made assumptions based on stereotypes",
              "Failed to treat all clients with respect",
              "Showed insensitivity to cultural differences",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Showed some awareness of bias but did not address it",
              "Made some assumptions based on stereotypes",
              "Treated some clients differently",
              "Showed limited sensitivity to cultural differences",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Demonstrated awareness of personal biases",
              "Avoided making assumptions",
              "Treated all clients with respect",
              "Showed sensitivity to cultural differences",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Actively challenged personal biases",
              "Sought to understand different perspectives",
              "Advocated for inclusivity",
              "Adapted communication style to cultural differences",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created a welcoming and inclusive environment",
              "Empowered clients from diverse backgrounds",
              "Challenged systemic biases",
              "Served as a role model for inclusivity",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Demonstrated clear bias in language or behavior",
              "Made assumptions based on stereotypes",
              "Failed to treat all clients with respect",
              "Showed insensitivity to cultural differences",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Showed some awareness of bias but did not address it",
              "Made some assumptions based on stereotypes",
              "Treated some clients differently",
              "Showed limited sensitivity to cultural differences",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Demonstrated awareness of personal biases",
              "Avoided making assumptions",
              "Treated all clients with respect",
              "Showed sensitivity to cultural differences",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Actively challenged personal biases",
              "Sought to understand different perspectives",
              "Advocated for inclusivity",
              "Adapted communication style to cultural differences",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created a welcoming and inclusive environment",
              "Empowered clients from diverse backgrounds",
              "Challenged systemic biases",
              "Served as a role model for inclusivity",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Demonstrated clear bias in language or behavior",
              "Made assumptions based on stereotypes",
              "Failed to treat all clients with respect",
              "Showed insensitivity to cultural differences",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Showed some awareness of bias but did not address it",
              "Made some assumptions based on stereotypes",
              "Treated some clients differently",
              "Showed limited sensitivity to cultural differences",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Demonstrated awareness of personal biases",
              "Avoided making assumptions",
              "Treated all clients with respect",
              "Showed sensitivity to cultural differences",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Actively challenged personal biases",
              "Sought to understand different perspectives",
              "Advocated for inclusivity",
              "Adapted communication style to cultural differences",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created a welcoming and inclusive environment",
              "Empowered clients from diverse backgrounds",
              "Challenged systemic biases",
              "Served as a role model for inclusivity",
            ],
          },
        ],
      },
    },
    {
      id: "option-suggestions",
      name: "Solution Recommendations",
      description: "Ability to suggest appropriate options based on client needs",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Suggested irrelevant or inappropriate options",
              "Failed to explain options clearly",
              "Did not consider client's needs",
              "Pushed a single option",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Suggested some relevant options but missed key areas",
              "Provided limited explanations",
              "Did not fully consider client's needs",
              "Showed preference for one option",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Suggested relevant options based on client needs",
              "Explained options clearly",
              "Considered client's preferences",
              "Presented multiple options",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Tailored options to client's specific situation",
              "Provided detailed explanations",
              "Addressed potential concerns",
              "Empowered client to make informed decision",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created innovative and customized solutions",
              "Anticipated future needs",
              "Provided exceptional support",
              "Exceeded client's expectations",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Suggested irrelevant or inappropriate options",
              "Failed to explain options clearly",
              "Did not consider client's needs",
              "Pushed a single option",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Suggested some relevant options but missed key areas",
              "Provided limited explanations",
              "Did not fully consider client's needs",
              "Showed preference for one option",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Suggested relevant options based on client needs",
              "Explained options clearly",
              "Considered client's preferences",
              "Presented multiple options",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Tailored options to client's specific situation",
              "Provided detailed explanations",
              "Addressed potential concerns",
              "Empowered client to make informed decision",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created innovative and customized solutions",
              "Anticipated future needs",
              "Provided exceptional support",
              "Exceeded client's expectations",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Suggested irrelevant or inappropriate options",
              "Failed to explain options clearly",
              "Did not consider client's needs",
              "Pushed a single option",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Suggested some relevant options but missed key areas",
              "Provided limited explanations",
              "Did not fully consider client's needs",
              "Showed preference for one option",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Suggested relevant options based on client needs",
              "Explained options clearly",
              "Considered client's preferences",
              "Presented multiple options",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Tailored options to client's specific situation",
              "Provided detailed explanations",
              "Addressed potential concerns",
              "Empowered client to make informed decision",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Created innovative and customized solutions",
              "Anticipated future needs",
              "Provided exceptional support",
              "Exceeded client's expectations",
            ],
          },
        ],
      },
    },
    {
      id: "time-management",
      name: "Time Management",
      description: "Ability to efficiently use meeting time while covering necessary topics",
      rubric: {
        beginner: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Failed to manage time effectively",
              "Missed key topics",
              "Ran over allotted time",
              "Appeared disorganized",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Managed time with some difficulty",
              "Covered most key topics",
              "Ran slightly over time",
              "Appeared somewhat disorganized",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Managed time effectively",
              "Covered all key topics",
              "Stayed within allotted time",
              "Appeared organized",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Managed time efficiently",
              "Covered all topics thoroughly",
              "Left time for questions",
              "Appeared highly organized",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully managed time",
              "Covered all topics comprehensively",
              "Created a seamless experience",
              "Exceeded client's expectations",
            ],
          },
        ],
        intermediate: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Failed to manage time effectively",
              "Missed key topics",
              "Ran over allotted time",
              "Appeared disorganized",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Managed time with some difficulty",
              "Covered most key topics",
              "Ran slightly over time",
              "Appeared somewhat disorganized",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Managed time effectively",
              "Covered all key topics",
              "Stayed within allotted time",
              "Appeared organized",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Managed time efficiently",
              "Covered all topics thoroughly",
              "Left time for questions",
              "Appeared highly organized",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully managed time",
              "Covered all topics comprehensively",
              "Created a seamless experience",
              "Exceeded client's expectations",
            ],
          },
        ],
        advanced: [
          {
            range: "1-2",
            description: "Critical improvement required",
            criteria: [
              "Failed to manage time effectively",
              "Missed key topics",
              "Ran over allotted time",
              "Appeared disorganized",
            ],
          },
          {
            range: "3-4",
            description: "Below expectations",
            criteria: [
              "Managed time with some difficulty",
              "Covered most key topics",
              "Ran slightly over time",
              "Appeared somewhat disorganized",
            ],
          },
          {
            range: "5-6",
            description: "Meets basic expectations",
            criteria: [
              "Managed time effectively",
              "Covered all key topics",
              "Stayed within allotted time",
              "Appeared organized",
            ],
          },
          {
            range: "7-8",
            description: "Exceeds expectations",
            criteria: [
              "Managed time efficiently",
              "Covered all topics thoroughly",
              "Left time for questions",
              "Appeared highly organized",
            ],
          },
          {
            range: "9-10",
            description: "Outstanding performance",
            criteria: [
              "Masterfully managed time",
              "Covered all topics comprehensively",
              "Created a seamless experience",
              "Exceeded client's expectations",
            ],
          },
        ],
      },
    },
  ]
  fs.writeFileSync(RUBRICS_FILE, JSON.stringify(defaultRubrics, null, 2))
}

if (!fs.existsSync(INDUSTRY_COMPETENCIES_FILE)) {
  console.log(`Creating default industry competencies file: ${INDUSTRY_COMPETENCIES_FILE}`)
  fs.writeFileSync(INDUSTRY_COMPETENCIES_FILE, JSON.stringify(defaultIndustryCompetencies, null, 2))
}

if (!fs.existsSync(INDUSTRY_METADATA_FILE)) {
  console.log(`Creating default industry metadata file: ${INDUSTRY_METADATA_FILE}`)
  fs.writeFileSync(INDUSTRY_METADATA_FILE, JSON.stringify(defaultIndustryMetadata, null, 2))
}

if (!fs.existsSync(DIFFICULTY_SETTINGS_FILE)) {
  console.log(`Creating default difficulty settings file: ${DIFFICULTY_SETTINGS_FILE}`)
  fs.writeFileSync(DIFFICULTY_SETTINGS_FILE, JSON.stringify(defaultDifficultySettings, null, 2))
}

// Update the IndustryCompetencies type to support focus areas
export type IndustryCompetencies = {
  [industry: string]: {
    [subcategory: string]: any
  }
}

// Define industry metadata type
export type IndustryMetadata = {
  [industry: string]: {
    displayName: string
    subcategories: {
      [subcategory: string]: {
        displayName: string
      }
    }
  }
}

// Define difficulty settings type with visible details
export type VisibleClientDetails = {
  name: boolean
  age: boolean
  familyStatus: boolean
  occupation: boolean
  income: boolean
  assets: boolean
  debt: boolean
  primaryGoals: boolean
}

export type DifficultyLevel = {
  description: string
  objectives: string
  clientBehavior: string
  sampleScenario: string
  visibleDetails: VisibleClientDetails
}

export type DifficultySettings = {
  [industry: string]: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  }
}

// Type definitions
export type Competency = {
  id: string
  name: string
  description: string
}

// Functions to read and write data
export function getCompetencies(): Competency[] {
  try {
    const data = fs.readFileSync(COMPETENCIES_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading competencies:", error)
    return []
  }
}

export function saveCompetencies(competencies: Competency[]): boolean {
  try {
    fs.writeFileSync(COMPETENCIES_FILE, JSON.stringify(competencies, null, 2))
    return true
  } catch (error) {
    console.error("Error saving competencies:", error)
    return false
  }
}

export function getRubrics(): CompetencyRubric[] {
  try {
    const data = fs.readFileSync(RUBRICS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading rubrics:", error)
    return []
  }
}

export function saveRubrics(rubrics: CompetencyRubric[]): boolean {
  try {
    fs.writeFileSync(RUBRICS_FILE, JSON.stringify(rubrics, null, 2))
    return true
  } catch (error) {
    console.error("Error saving rubrics:", error)
    return false
  }
}

// Update the getIndustryCompetencies function with better error handling
export function getIndustryCompetencies(): IndustryCompetencies {
  try {
    if (!fs.existsSync(INDUSTRY_COMPETENCIES_FILE)) {
      console.log(`Industry competencies file not found, creating default: ${INDUSTRY_COMPETENCIES_FILE}`)
      fs.writeFileSync(INDUSTRY_COMPETENCIES_FILE, JSON.stringify(defaultIndustryCompetencies, null, 2))
      return defaultIndustryCompetencies
    }

    const data = fs.readFileSync(INDUSTRY_COMPETENCIES_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading industry competencies:", error)
    console.log("Returning default industry competencies")
    return defaultIndustryCompetencies
  }
}

export function saveIndustryCompetencies(industryCompetencies: IndustryCompetencies): boolean {
  try {
    fs.writeFileSync(INDUSTRY_COMPETENCIES_FILE, JSON.stringify(industryCompetencies, null, 2))
    return true
  } catch (error) {
    console.error("Error saving industry competencies:", error)
    return false
  }
}

export function getIndustryMetadata(): IndustryMetadata {
  try {
    const data = fs.readFileSync(INDUSTRY_METADATA_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading industry metadata:", error)
    return {}
  }
}

export function saveIndustryMetadata(metadata: IndustryMetadata): boolean {
  try {
    fs.writeFileSync(INDUSTRY_METADATA_FILE, JSON.stringify(metadata, null, 2))
    return true
  } catch (error) {
    console.error("Error saving industry metadata:", error)
    return false
  }
}

export function getDifficultySettings(): DifficultySettings {
  try {
    const data = fs.readFileSync(DIFFICULTY_SETTINGS_FILE, "utf8")
    const settings = JSON.parse(data)

    // Ensure all industries have visibleDetails for each difficulty level
    Object.keys(settings).forEach((industry) => {
      ;["beginner", "intermediate", "advanced"].forEach((level) => {
        if (!settings[industry][level].visibleDetails) {
          // Add default visibility settings if missing
          settings[industry][level].visibleDetails =
            level === "beginner"
              ? {
                  name: true,
                  age: true,
                  familyStatus: true,
                  occupation: true,
                  income: true,
                  assets: true,
                  debt: true,
                  primaryGoals: true,
                }
              : level === "intermediate"
                ? {
                    name: true,
                    age: true,
                    familyStatus: true,
                    occupation: true,
                    income: false,
                    assets: false,
                    debt: false,
                    primaryGoals: false,
                  }
                : {
                    name: true,
                    age: false,
                    familyStatus: false,
                    occupation: false,
                    income: false,
                    assets: false,
                    debt: false,
                    primaryGoals: false,
                  }
        }
      })
    })

    return settings
  } catch (error) {
    console.error("Error reading difficulty settings:", error)
    return defaultDifficultySettings
  }
}

export function saveDifficultySettings(settings: DifficultySettings): boolean {
  try {
    fs.writeFileSync(DIFFICULTY_SETTINGS_FILE, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error("Error saving difficulty settings:", error)
    return false
  }
}

export function getFocusAreas(industry: string, subcategory: string): any {
  try {
    const industryCompetencies = getIndustryCompetencies()
    const subcategoryData = industryCompetencies[industry]?.[subcategory]

    if (
      subcategoryData &&
      typeof subcategoryData === "object" &&
      subcategoryData !== null &&
      "focusAreas" in subcategoryData
    ) {
      const focusAreas = subcategoryData.focusAreas
      return Object.entries(focusAreas).map(([id, data]: [string, any]) => ({
        id: id,
        name: data.displayName || id,
        enabled: data.enabled !== false,
      }))
    }

    return []
  } catch (error) {
    console.error("Error reading focus areas:", error)
    return []
  }
}

export function updateIndustryCompetency(
  industry: string,
  subcategory: string,
  competencyId: string,
  isSelected: boolean,
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (
      industryCompetencies[industry] &&
      industryCompetencies[industry][subcategory] &&
      Array.isArray(industryCompetencies[industry][subcategory])
    ) {
      const competencies = industryCompetencies[industry][subcategory] as string[]
      if (isSelected) {
        if (!competencies.includes(competencyId)) {
          competencies.push(competencyId)
        }
      } else {
        const index = competencies.indexOf(competencyId)
        if (index > -1) {
          competencies.splice(index, 1)
        }
      }
      saveIndustryCompetencies(industryCompetencies)
      return true
    } else {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }
  } catch (error) {
    console.error("Error updating industry competency:", error)
    return false
  }
}

export function saveIndustrySubcategoryCompetencies(
  industry: string,
  subcategory: string,
  competencyIds: string[],
): boolean {
  try {
    console.log(`Saving competencies for ${industry}/${subcategory}:`, competencyIds)
    const industryCompetencies = getIndustryCompetencies()

    // Ensure the industry exists
    if (!industryCompetencies[industry]) {
      console.warn(`Industry not found: ${industry}, creating it`)
      industryCompetencies[industry] = {}
    }

    // Handle industry-level subcategory specially
    if (subcategory === "industry-level") {
      // Create or update the industry-level object with proper structure
      industryCompetencies[industry]["industry-level"] = {
        competencies: competencyIds,
        focusAreas: {},
      }
    } else {
      // For regular subcategories
      if (!industryCompetencies[industry][subcategory]) {
        console.warn(`Subcategory not found: ${subcategory}, creating it`)
        industryCompetencies[industry][subcategory] = {
          competencies: [],
          focusAreas: {},
        }
      }

      // Handle both legacy array format and new object format
      if (
        typeof industryCompetencies[industry][subcategory] === "object" &&
        !Array.isArray(industryCompetencies[industry][subcategory])
      ) {
        // New format with competencies property
        industryCompetencies[industry][subcategory].competencies = competencyIds
      } else {
        // Legacy format or unexpected format - convert to new format
        industryCompetencies[industry][subcategory] = {
          competencies: competencyIds,
          focusAreas: {},
        }
      }
    }

    // Save the updated competencies
    const saveResult = saveIndustryCompetencies(industryCompetencies)
    console.log(`Save result for ${industry}/${subcategory}:`, saveResult)
    return saveResult
  } catch (error) {
    console.error(`Error saving competencies for ${industry}/${subcategory}:`, error)
    return false
  }
}

export function saveFocusAreaCompetencies(
  industry: string,
  subcategory: string,
  focusArea: string,
  competencyIds: string[],
  enabled = true,
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (
      industryCompetencies[industry] &&
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory]
    ) {
      const focusAreas = industryCompetencies[industry][subcategory].focusAreas
      if (focusAreas && focusArea in focusAreas) {
        focusAreas[focusArea].competencies = competencyIds
        focusAreas[focusArea].enabled = enabled
        saveIndustryCompetencies(industryCompetencies)
        return true
      } else {
        console.warn(`Focus area not found: ${focusArea}`)
        return false
      }
    } else {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }
  } catch (error) {
    console.error("Error saving focus area competencies:", error)
    return false
  }
}

export function toggleFocusAreaEnabled(
  industry: string,
  subcategory: string,
  focusArea: string,
  enabled: boolean,
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (
      industryCompetencies[industry] &&
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory]
    ) {
      const focusAreas = industryCompetencies[industry][subcategory].focusAreas
      if (focusAreas && focusArea in focusAreas) {
        focusAreas[focusArea].enabled = enabled
        saveIndustryCompetencies(industryCompetencies)
        return true
      } else {
        console.warn(`Focus area not found: ${focusArea}`)
        return false
      }
    } else {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }
  } catch (error) {
    console.error("Error toggling focus area enabled:", error)
    return false
  }
}

export function addNewIndustry(
  industryId: string,
  displayName: string,
  difficultySettings?: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  },
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()
    const industryMetadata = getIndustryMetadata()
    const difficultySettingsData = getDifficultySettings()

    if (industryCompetencies[industryId]) {
      console.warn(`Industry already exists: ${industryId}`)
      return false
    }

    // Add new industry to industry competencies
    industryCompetencies[industryId] = {
      default: {
        competencies: [],
        focusAreas: {},
      },
    }

    // Add new industry to industry metadata
    industryMetadata[industryId] = {
      displayName: displayName,
      subcategories: {
        default: {
          displayName: "Default",
        },
      },
    }

    // Add new industry to difficulty settings
    if (difficultySettings) {
      difficultySettingsData[industryId] = difficultySettings
    }

    saveIndustryCompetencies(industryCompetencies)
    saveIndustryMetadata(industryMetadata)
    saveDifficultySettings(difficultySettingsData)

    return true
  } catch (error) {
    console.error("Error adding new industry:", error)
    return false
  }
}

export function addNewSubcategory(industry: string, subcategoryId: string, displayName: string): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()
    const industryMetadata = getIndustryMetadata()

    if (!industryCompetencies[industry]) {
      console.warn(`Industry not found: ${industry}`)
      return false
    }

    if (industryCompetencies[industry][subcategoryId]) {
      console.warn(`Subcategory already exists: ${subcategoryId}`)
      return false
    }

    // Add new subcategory to industry competencies
    industryCompetencies[industry][subcategoryId] = {
      competencies: [],
      focusAreas: {},
    }

    // Add new subcategory to industry metadata
    industryMetadata[industry].subcategories[subcategoryId] = {
      displayName: displayName,
    }

    saveIndustryCompetencies(industryCompetencies)
    saveIndustryMetadata(industryMetadata)

    return true
  } catch (error) {
    console.error("Error adding new subcategory:", error)
    return false
  }
}

export function addNewFocusArea(
  industry: string,
  subcategory: string,
  focusAreaId: string,
  displayName: string,
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (!industryCompetencies[industry] || !industryCompetencies[industry][subcategory]) {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }

    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory] &&
      industryCompetencies[industry][subcategory].focusAreas[focusAreaId]
    ) {
      console.warn(`Focus area already exists: ${focusAreaId}`)
      return false
    }

    // Add new focus area to industry competencies
    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory]
    ) {
      industryCompetencies[industry][subcategory].focusAreas[focusAreaId] = {
        competencies: [],
        enabled: true,
        displayName: displayName,
      }
    } else {
      console.warn(`Focus areas not found for ${industry}, ${subcategory}`)
      return false
    }

    saveIndustryCompetencies(industryCompetencies)

    return true
  } catch (error) {
    console.error("Error adding new focus area:", error)
    return false
  }
}

export function updateIndustry(
  industryId: string,
  displayName: string,
  difficultySettings?: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  },
): boolean {
  try {
    const industryMetadata = getIndustryMetadata()
    const difficultySettingsData = getDifficultySettings()

    if (!industryMetadata[industryId]) {
      console.warn(`Industry not found: ${industryId}`)
      return false
    }

    // Update industry metadata
    industryMetadata[industryId].displayName = displayName

    // Update difficulty settings if provided
    if (difficultySettings) {
      difficultySettingsData[industryId] = difficultySettings
    }

    saveIndustryMetadata(industryMetadata)
    saveDifficultySettings(difficultySettingsData)

    return true
  } catch (error) {
    console.error("Error updating industry:", error)
    return false
  }
}

export function updateSubcategory(industry: string, subcategoryId: string, displayName: string): boolean {
  try {
    const industryMetadata = getIndustryMetadata()

    if (!industryMetadata[industry] || !industryMetadata[industry].subcategories[subcategoryId]) {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategoryId}`)
      return false
    }

    // Update subcategory metadata
    industryMetadata[industry].subcategories[subcategoryId].displayName = displayName

    saveIndustryMetadata(industryMetadata)

    return true
  } catch (error) {
    console.error("Error updating subcategory:", error)
    return false
  }
}

export function updateFocusArea(
  industry: string,
  subcategory: string,
  focusAreaId: string,
  newFocusAreaId: string,
  enabled: boolean,
): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (!industryCompetencies[industry] || !industryCompetencies[industry][subcategory]) {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }

    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory] &&
      !industryCompetencies[industry][subcategory].focusAreas[focusAreaId]
    ) {
      console.warn(`Focus area not found: ${focusAreaId}`)
      return false
    }

    // Update focus area
    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory]
    ) {
      const focusAreas = industryCompetencies[industry][subcategory].focusAreas

      // Copy the old focus area's data to the new ID
      focusAreas[newFocusAreaId] = { ...focusAreas[focusAreaId] }

      // Delete the old focus area
      delete focusAreas[focusAreaId]

      // Update the enabled status
      focusAreas[newFocusAreaId].enabled = enabled

      saveIndustryCompetencies(industryCompetencies)
    }

    return true
  } catch (error) {
    console.error("Error updating focus area:", error)
    return false
  }
}

export function deleteIndustry(industryId: string): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()
    const industryMetadata = getIndustryMetadata()
    const difficultySettingsData = getDifficultySettings()

    if (!industryCompetencies[industryId]) {
      console.warn(`Industry not found: ${industryId}`)
      return false
    }

    // Delete industry from industry competencies
    delete industryCompetencies[industryId]

    // Delete industry from industry metadata
    delete industryMetadata[industryId]

    // Delete industry from difficulty settings
    delete difficultySettingsData[industryId]

    saveIndustryCompetencies(industryCompetencies)
    saveIndustryMetadata(industryMetadata)
    saveDifficultySettings(difficultySettingsData)

    return true
  } catch (error) {
    console.error("Error deleting industry:", error)
    return false
  }
}

export function deleteSubcategory(industry: string, subcategoryId: string): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()
    const industryMetadata = getIndustryMetadata()

    if (!industryCompetencies[industry] || !industryCompetencies[industry][subcategoryId]) {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategoryId}`)
      return false
    }

    // Delete subcategory from industry competencies
    delete industryCompetencies[industry][subcategoryId]

    // Delete subcategory from industry metadata
    delete industryMetadata[industry].subcategories[subcategoryId]

    saveIndustryCompetencies(industryCompetencies)
    saveIndustryMetadata(industryMetadata)

    return true
  } catch (error) {
    console.error("Error deleting subcategory:", error)
    return false
  }
}

export function deleteFocusArea(industry: string, subcategory: string, focusAreaId: string): boolean {
  try {
    const industryCompetencies = getIndustryCompetencies()

    if (!industryCompetencies[industry] || !industryCompetencies[industry][subcategory]) {
      console.warn(`Industry or subcategory not found: ${industry}, ${subcategory}`)
      return false
    }

    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory] &&
      !industryCompetencies[industry][subcategory].focusAreas[focusAreaId]
    ) {
      console.warn(`Focus area not found: ${focusAreaId}`)
      return false
    }

    // Delete focus area from industry competencies
    if (
      industryCompetencies[industry][subcategory] &&
      typeof industryCompetencies[industry][subcategory] === "object" &&
      industryCompetencies[industry][subcategory] !== null &&
      "focusAreas" in industryCompetencies[industry][subcategory]
    ) {
      delete industryCompetencies[industry][subcategory].focusAreas[focusAreaId]
    }

    saveIndustryCompetencies(industryCompetencies)

    return true
  } catch (error) {
    console.error("Error deleting focus area:", error)
    return false
  }
}

export function addCompetencyWithRubric(competency: Competency): boolean {
  try {
    const competencies = getCompetencies()
    const rubrics = getRubrics()

    if (competencies.find((c) => c.id === competency.id)) {
      console.warn(`Competency already exists: ${competency.id}`)
      return false
    }

    // Add the new competency
    competencies.push(competency)

    // Create a default rubric for the new competency
    const defaultRubric: CompetencyRubric = {
      id: competency.id,
      name: competency.name,
      description: competency.description,
      rubric: {
        beginner: [
          { range: "0-4", description: "Needs significant improvement" },
          { range: "5-7", description: "Meets basic expectations" },
          { range: "8-9", description: "Exceeds expectations" },
          { range: "10", description: "Outstanding performance" },
        ],
        intermediate: [
          { range: "0-4", description: "Needs significant improvement" },
          { range: "5-7", description: "Meets basic expectations" },
          { range: "8-9", description: "Exceeds expectations" },
          { range: "10", description: "Outstanding performance" },
        ],
        advanced: [
          { range: "0-4", description: "Needs significant improvement" },
          { range: "5-7", description: "Meets basic expectations" },
          { range: "8-9", description: "Exceeds expectations" },
          { range: "10", description: "Outstanding performance" },
        ],
      },
    }

    rubrics.push(defaultRubric)

    saveCompetencies(competencies)
    saveRubrics(rubrics)

    return true
  } catch (error) {
    console.error("Error adding competency with rubric:", error)
    return false
  }
}

export function updateCompetency(id: string, competency: Competency): boolean {
  try {
    const competencies = getCompetencies()
    const index = competencies.findIndex((c) => c.id === id)

    if (index === -1) {
      console.warn(`Competency not found: ${id}`)
      return false
    }

    competencies[index] = competency
    saveCompetencies(competencies)
    return true
  } catch (error) {
    console.error("Error updating competency:", error)
    return false
  }
}

export function deleteCompetency(id: string): boolean {
  try {
    const competencies = getCompetencies()
    const rubrics = getRubrics()

    const competencyIndex = competencies.findIndex((c) => c.id === id)
    if (competencyIndex === -1) {
      console.warn(`Competency not found: ${id}`)
      return false
    }

    const rubricIndex = rubrics.findIndex((r) => r.id === id)
    if (rubricIndex === -1) {
      console.warn(`Rubric not found for competency: ${id}`)
    }

    // Remove the competency and its rubric
    competencies.splice(competencyIndex, 1)
    if (rubricIndex !== -1) {
      rubrics.splice(rubricIndex, 1)
    }

    saveCompetencies(competencies)
    saveRubrics(rubrics)

    return true
  } catch (error) {
    console.error("Error deleting competency:", error)
    return false
  }
}

// New function to update visible client details for a difficulty level
export function updateVisibleClientDetails(
  industry: string,
  difficultyLevel: "beginner" | "intermediate" | "advanced",
  visibleDetails: VisibleClientDetails,
): boolean {
  try {
    const difficultySettings = getDifficultySettings()

    if (!difficultySettings[industry]) {
      console.warn(`Industry not found in difficulty settings: ${industry}`)
      return false
    }

    if (!difficultySettings[industry][difficultyLevel]) {
      console.warn(`Difficulty level not found: ${difficultyLevel}`)
      return false
    }

    // Update the visible details
    difficultySettings[industry][difficultyLevel].visibleDetails = visibleDetails

    // Save the updated settings
    return saveDifficultySettings(difficultySettings)
  } catch (error) {
    console.error("Error updating visible client details:", error)
    return false
  }
}
