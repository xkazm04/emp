/**
 * Configuration and constants for the Survey Data Processor
 * Updated to reflect new Top Performer identification and aligned percentage calculations
 */

const CONFIG = {
  // Gemini API Configuration
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  
  // JSON Exporter Configuration
  JSON_EXPORT: {
    DEFAULT_SURVEY_TITLE: 'Employee Survey',
    OUTPUT_FILENAME_PATTERN: (quarter) => `employee_survey_${quarter.replace(/\s+/g, '_')}.json`
  },
  
  // Default settings
  DEFAULT_SOURCE_SHEET: 'responses',
  
  // Processing limits
  MAX_RESPONSES_PER_BATCH: 1500,
  API_TIMEOUT_MS: 520000,
  MAX_OUTPUT_TOKENS: 81920, 
  
  // Retry configuration
  MAX_RETRIES: 1,
  RETRY_DELAY_MS: 2000,
  
  // Sheet configuration
  SHEET_NAMES: {
    METRICS: 'metrics',
    QUALITATIVE_INSIGHTS: 'qualitative_insights',
    LEADER_INSIGHTS: 'leader_insights'
  },
  
  // Metric categories
  METRIC_CATEGORIES: {
    SATISFACTION: 'satisfaction',
    RETENTION: 'retention', 
    ENGAGEMENT: 'engagement',
    DEMOGRAPHIC: 'demographic',
    RESPONSE_RATE: 'response_rate'
  },
  
  // Segment types (deprecated - keeping for backward compatibility)
  SEGMENT_TYPES: {
    LEADER: 'leader',
    DEPARTMENT: 'department'
  },
  
  // Insight types
  INSIGHT_TYPES: {
    THEMES: 'themes',
    TOP_FEEDBACK: 'top_feedback'
  },
  
  // Question categories for qualitative analysis
  QUESTION_CATEGORIES: {
    FULFILLING_WORK: 'fulfilling_work',
    EMPOWERMENT_CHANGES: 'empowerment_changes',
    LEADERSHIP_SUPPORT: 'leadership_support',
    OBSTACLES: 'obstacles',
    BOLD_IDEAS: 'bold_ideas',
    ROLE_CLARITY: 'role_clarity'
  },
  
  // NEW: Top Performer identification configuration
  TOP_PERFORMER_CONFIG: {
    COLUMN_NAME: 'Top Performer', // Expected column name
    COLUMN_POSITION: 'B', // Expected column position
    POSITIVE_VALUES: ['Top Performer', 'High Performer', 'Yes', 'Y', 'True', '1']
  }
};

/**
 * UPDATED Metric definitions mapping survey questions to metrics
 * Aligned with definition.csv requirements for percentage calculations
 */
const METRIC_DEFINITIONS = [
  {
    key: 'overall_response_rate',
    name: 'Overall Response Rate',
    category: CONFIG.METRIC_CATEGORIES.RESPONSE_RATE,
    calculation: 'response_rate',
    description: '(Number of respondents / Total number of employees in group) * 100'
  },
  {
    key: 'overall_satisfaction',
    name: 'ESAT Score',
    category: CONFIG.METRIC_CATEGORIES.SATISFACTION,
    question_pattern: /satisfaction.*overall.*experience/i,
    calculation: 'average_1_5_scale',
    description: 'Total score on "Satisfied Working At Company" question / Number of respondents'
  },
  {
    key: 'satisfaction_positive',
    name: 'Satisfaction - % Positive',
    category: CONFIG.METRIC_CATEGORIES.SATISFACTION,
    question_pattern: /satisfaction.*overall.*experience/i,
    calculation: 'percentage_positive_1_2_scale',
    description: '% of positive responses (4-5 on scale of 1-5 ratings only)'
  },
  {
    key: 'retention_intent',
    name: 'Retention Intent',
    category: CONFIG.METRIC_CATEGORIES.RETENTION,
    question_pattern: /see yourself.*company.*year/i,
    calculation: 'percentage_positive_yes_no',
    description: '% of positive responses - See Themselves Here Next Year'
  },
  {
    key: 'mission_understanding',
    name: 'Mission Alignment',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /understand.*mission.*role/i,
    calculation: 'percentage_positive_yes_no',
    description: '% of positive responses - Understand Our Mission And Their Role'
  },
  {
    key: 'leadership_confidence',
    name: 'Leadership Confidence',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /confident.*leadership.*ability/i,
    calculation: 'percentage_positive_1_2_scale',
    description: '% of positive responses (4-5 on scale of 1-5 ratings) - Confident In the Leadership'
  },
  {
    key: 'tools_resources',
    name: 'Resources',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /tools.*resources.*job.*effectively/i,
    calculation: 'percentage_positive_1_2_scale',
    description: '% of positive responses (4-5 on scale of 1-5 ratings) - Have Tools And Resources'
  },
  {
    key: 'empowerment',
    name: 'Empowerment',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /empowered.*decisions.*results/i,
    calculation: 'percentage_positive_yes_no',
    description: '% of positive responses - Feel Empowered to Make Decisions'
  },
  {
    key: 'ideas_valued',
    name: 'Value of Ideas',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /ideas.*valued.*acted/i,
    calculation: 'percentage_positive_yes_no',
    description: '% of positive responses - Feel Their Ideas Are Valued'
  },
  {
    key: 'recognition',
    name: 'Recognition',
    category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
    question_pattern: /recognized.*contributions/i,
    calculation: 'percentage_positive_yes_no',
    description: '% of positive responses - Feel Recognized For Their Contributions'
  },
  {
    key: 'total_responses',
    name: 'Total Survey Responses',
    category: CONFIG.METRIC_CATEGORIES.DEMOGRAPHIC,
    calculation: 'count_total'
  },
  {
    key: 'manager_percentage',
    name: 'Manager Percentage',
    category: CONFIG.METRIC_CATEGORIES.DEMOGRAPHIC,
    question_pattern: /people manager/i,
    calculation: 'percentage_managers'
  },
  {
    key: 'top_performer_percentage',
    name: 'Top Performer Percentage',
    category: CONFIG.METRIC_CATEGORIES.DEMOGRAPHIC,
    calculation: 'percentage_top_performers',
    description: 'Percentage of responses from employees marked as Top Performers'
  }
];

/**
 * NEW: Calculation method definitions
 * Defines how each calculation type should be performed
 */
const CALCULATION_METHODS = {
  'average_1_5_scale': {
    description: 'Average of 1-5 scale responses',
    method: 'average',
    scale: [1, 5]
  },
  'percentage_positive_1_2_scale': {
    description: '% of responses with 4-5 on scale of 1-5 ratings',
    method: 'percentage',
    positiveValues: [4, 5],
    scale: [1, 5]
  },
  'percentage_positive_yes_no': {
    description: '% of positive responses (Yes/No questions)',
    method: 'percentage',
    positiveValues: ['yes', 'y', 'true', '1', 'agree', 'strongly agree']
  },
  'count_total': {
    description: 'Total count of responses',
    method: 'count'
  },
  'percentage_managers': {
    description: 'Percentage of respondents who are managers',
    method: 'percentage',
    positiveValues: ['yes', 'y', 'true', '1']
  },
  'percentage_top_performers': {
    description: 'Percentage of respondents who are top performers',
    method: 'percentage',
    positiveValues: CONFIG.TOP_PERFORMER_CONFIG.POSITIVE_VALUES
  },
  'response_rate': {
    description: '(Number of respondents / Total number of employees) * 100',
    method: 'response_rate'
  }
};

/**
 * Question mappings for qualitative analysis
 */
const QUALITATIVE_QUESTION_MAPPING = [
  {
    category: CONFIG.QUESTION_CATEGORIES.FULFILLING_WORK,
    pattern: /make.*work experience.*fulfilling/i,
    description: 'What could make work more fulfilling'
  },
  {
    category: CONFIG.QUESTION_CATEGORIES.EMPOWERMENT_CHANGES,
    pattern: /changes.*empowered.*role/i,
    description: 'Changes to feel more empowered'
  },
  {
    category: CONFIG.QUESTION_CATEGORIES.LEADERSHIP_SUPPORT,
    pattern: /support.*leadership.*provide.*succeed/i,
    description: 'Leadership support needed'
  },
  {
    category: CONFIG.QUESTION_CATEGORIES.OBSTACLES,
    pattern: /obstacles.*preventing.*highest level/i,
    description: 'Top performance obstacles'
  },
  {
    category: CONFIG.QUESTION_CATEGORIES.BOLD_IDEAS,
    pattern: /bold ideas.*propel.*forward/i,
    description: 'Bold ideas for progress'
  },
  {
    category: CONFIG.QUESTION_CATEGORIES.ROLE_CLARITY,
    pattern: /information.*support.*clarify.*role.*goals/i,
    description: 'Role and goal clarification needs'
  }
];

/**
 * Column mapping for new structure with Top Performer in Column B
 * This shifts all previous columns one position to the right
 */
const EXPECTED_COLUMN_MAPPING = {
  TIMESTAMP: 'A', // Column A: Timestamp
  TOP_PERFORMER: 'B', // Column B: Top Performer (NEW)
  STEAM_LEADER: 'C', // Column C: Steam Leader (was B)
  DEPARTMENT: 'D', // Column D: Department (was C)  
  LINE_MANAGER: 'E', // Column E: Line Manager (was D)
  SATISFACTION: 'F', // Column F: Satisfaction 1-5 (was E)
  RETENTION: 'G', // Column G: Retention Intent (was F)
  FULFILLING_WORK: 'H', // Column H: Fulfilling work suggestions (was G)
  MISSION_UNDERSTANDING: 'I', // Column I: Mission understanding (was H)
  // ... continue pattern for remaining columns
};

/**
 * Gets API key from config (fallback to script properties for backward compatibility)
 */
function getApiKey() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set it in config.gs or use the Settings menu.');
  }
  return apiKey;
}

/**
 * Gets configuration value with fallback
 */
function getConfig(key, fallback = null) {
  return CONFIG[key] || fallback;
}

/**
 * NEW: Gets calculation method definition
 */
function getCalculationMethod(calculationType) {
  return CALCULATION_METHODS[calculationType] || null;
}

/**
 * Validates processing parameters
 */
function validateParams(params) {
  const errors = [];
  
  if (!params.quarter) {
    errors.push('Quarter is required');
  }
  
  if (!params.year) {
    errors.push('Year is required');
  }
  
  if (params.quarter && !['Q1', 'Q2', 'Q3', 'Q4'].includes(params.quarter)) {
    errors.push('Quarter must be Q1, Q2, Q3, or Q4');
  }
  
  if (params.year && (params.year < 2020 || params.year > 2030)) {
    errors.push('Year must be between 2020 and 2030');
  }
  
  return errors;
}

/**
 * Creates quarter identifier from params
 */
function createQuarterId(params) {
  return `${params.quarter}_${params.year}`;
}

/**
 * NEW: Validates that the survey data has the expected Top Performer column
 */
function validateTopPerformerColumn(surveyData) {
  if (!surveyData || surveyData.length === 0) {
    return { isValid: false, message: 'No survey data provided' };
  }
  
  const sampleRow = surveyData[0];
  const columnNames = Object.keys(sampleRow);
  
  // Check if we have a Top Performer column
  const hasTopPerformerColumn = columnNames.some(col => {
    const colLower = col.toLowerCase();
    return colLower.includes('top performer') || 
           colLower.includes('topperformer') ||
           colLower.includes('high performer');
  });
  
  if (!hasTopPerformerColumn) {
    // Check if Column B contains Top Performer data
    if (columnNames.length > 1) {
      const secondColumn = sampleRow[columnNames[1]];
      if (typeof secondColumn === 'string') {
        const normalized = secondColumn.toLowerCase();
        if (normalized.includes('top performer') || normalized.includes('general')) {
          return { isValid: true, message: 'Top Performer data found in expected column' };
        }
      }
    }
    
    return { 
      isValid: false, 
      message: 'Top Performer column not found. Expected in Column B or column named "Top Performer"' 
    };
  }
  
  return { isValid: true, message: 'Top Performer column found' };
}

/**
 * Logging configuration
 */
const LOGGER = {
  INFO: 'INFO',
  WARN: 'WARN', 
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

/**
 * Enhanced logging function
 */
function logMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}`;
  
  Logger.log(logEntry);
  
  if (data) {
    Logger.log(`Data: ${JSON.stringify(data, null, 2)}`);
  }
  
  // Store in script properties for debugging if needed
  if (level === LOGGER.ERROR) {
    const errorLog = PropertiesService.getScriptProperties().getProperty('ERROR_LOG') || '[]';
    const errors = JSON.parse(errorLog);
    errors.push({
      timestamp: timestamp,
      message: message,
      data: data
    });
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    PropertiesService.getScriptProperties().setProperty('ERROR_LOG', JSON.stringify(errors));
  }
}