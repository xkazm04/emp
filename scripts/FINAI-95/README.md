# Employee Survey Data Processor - FINAI-95

## Overview

This is a comprehensive Google Apps Script system that processes employee survey data and generates structured JSON output for analysis and visualization. The system combines quantitative metrics calculation with AI-powered qualitative analysis to provide actionable insights for leadership.

### Key Features
- ✅ **Automated Metrics Calculation**: Processes survey responses to calculate key performance metrics (satisfaction, retention, engagement, etc.)
- ✅ **Top Performer Segmentation**: Automatically identifies and segments top performers for comparative analysis
- ✅ **AI-Powered Insights**: Uses Google's Gemini API to analyze qualitative feedback and generate executive summaries
- ✅ **Leader-Specific Analysis**: Creates detailed performance assessments for each team leader
- ✅ **Historical Comparison**: Maintains time-series data for trend analysis across quarters
- ✅ **JSON Export**: Generates structured JSON output for integration with visualization dashboards

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE SHEETS (Input)                         │
│  - responses: Raw survey data with Top Performer column          │
│  - Previous quarters data (optional)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DATA PROCESSING PIPELINE                         │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Config    │───▶│   Metrics    │───▶│  Qualitative │       │
│  │  (config.js)│    │  Calculator  │    │  Processing  │       │
│  └─────────────┘    └──────────────┘    └──────────────┘       │
│                            │                      │               │
│                            │                      │               │
│                            ▼                      ▼               │
│                    ┌──────────────────────────────────┐          │
│                    │   JSON Post-Processor (LLM)      │          │
│                    │   - Executive Summary            │          │
│                    │   - Leader Narratives            │          │
│                    └──────────────────────────────────┘          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OUTPUT (JSON File)                           │
│  - Structured metrics with time-series                           │
│  - AI-generated insights and narratives                          │
│  - Leader-specific performance analysis                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. **config.js** - Configuration Hub
Central configuration file containing:
- **API Settings**: Gemini API configuration
- **Metric Definitions**: All survey metrics and their calculation methods
- **Column Mappings**: Expected survey structure with Top Performer identification
- **Calculation Methods**: Defines how each metric type is calculated

**Key Configurations:**
```javascript
METRIC_DEFINITIONS: Array of metric configurations
CALCULATION_METHODS: Calculation logic for each metric type
TOP_PERFORMER_CONFIG: Settings for identifying top performers
```

### 2. **metricsCalculator.js** - Quantitative Analysis Engine
Processes raw survey data and calculates all metrics.

**Main Functions:**
- `calculateAllMetrics()`: Master function orchestrating metric calculation
- `cleanSurveyData()`: Standardizes and validates survey responses
- `calculateMetricsForSegment()`: Calculates metrics for specific segments (overall, per leader, top performers)
- `calculateMetric()`: Core calculation logic for individual metrics

**Output Structure:**
```javascript
{
  metrics: [
    {
      quarter: "Q3_2025",
      leader: "all" | "Leader Name",
      metric_key: "retention_intent",
      metric_name: "Retention Intent",
      value: 63.3,
      total_responses: 199,
      top_performers_percentage: 58.0,  // % of top performers agreeing
      total_responses_managers: 45,      // Count of top performers
      total_responses_ics: 154,          // Count of non-top performers
      category: "retention"
    }
  ]
}
```

### 3. **metricsParsers.js** - Data Parsing Utilities
Supporting functions for data extraction and validation.

**Key Functions:**
- `parseTopPerformerStatus()`: Identifies top performers from Column B
- `parseSatisfactionScore()`: Extracts 1-5 satisfaction ratings
- `parseRetentionIntent()`: Parses Yes/No retention responses
- `isPositiveResponse()`: Determines if a response is positive
- `isPositiveNumericResponse()`: For 1-5 scale questions (4-5 are positive)

### 4. **jsonPostprocessor.js** - AI Analysis Layer
Uses Gemini API to generate insights from quantitative and qualitative data.

**Main Functions:**
- `generateExecutiveSummary()`: Creates organization-wide summary with top 5 themes
- `generateLeaderNarrative()`: Generates leader-specific performance analysis
- `buildExecutiveSummaryPrompt()`: Constructs prompt emphasizing employee voice
- `buildLeaderNarrativePrompt()`: Creates targeted leader assessment prompt

**AI Processing Flow:**
1. Aggregates quantitative metrics
2. Processes qualitative responses
3. Identifies top themes by frequency
4. Generates HTML-formatted insights
5. Validates JSON output structure

### 5. **jsonExporter.js** - Output Generation
Creates final JSON file with complete survey analysis.

**Export Process:**
1. Reads processed metrics from sheets
2. Builds time-series structure
3. Generates AI-powered summaries
4. Combines all data into structured JSON
5. Saves to Google Drive

### 6. **qualPromptBuilder.js** - Qualitative Analysis
Processes open-ended survey responses and categorizes feedback.

**Functions:**
- Extracts qualitative responses by category
- Builds context for AI analysis
- Generates sample responses for insights

---

## Metric Calculation Details

### Calculation Types

#### 1. **percentage_positive_yes_no**
Used for: Yes/No questions (Retention, Empowerment, Recognition)
```
Positive = % responding "Yes", "Y", "Agree", "Strongly Agree"
```

#### 2. **percentage_positive_1_2_scale** ⚠️ 
Used for: 1-5 scale questions (Satisfaction, Leadership, Tools)
```
CURRENT (INCORRECT): Positive = responses of 1-2 on 1-5 scale
SHOULD BE (CORRECTED): Positive = responses of 4-5 on 1-5 scale
```
**Note**: This needs to be fixed - see "Updating Metrics" section below.

#### 3. **average_1_5_scale**
Used for: Overall satisfaction score (eSAT)
```
Average = Sum of all responses / Total responses
```

### Top Performer Segmentation

The system automatically segments data by Top Performer status:
- **Column B** contains Top Performer designation
- Each metric includes both overall and top-performer specific values
- Enables comparative analysis between top performers and general votes

---

## How to Use the System

### Initial Setup

1. **Configure API Key** 
  Add property
  
   ```javascript
   GEMINI_API_KEY: 'YOUR_API_KEY_HERE'
   ```

2. **Prepare Survey Data Sheet**
   - Sheet name: `responses`
   - Column A: Timestamp
   - **Column B: Top Performer** (Values: "Top Performer" or "General")
   - Column C+: Survey questions and responses

3. **Required Column Structure**:
   ```
   A: Timestamp
   B: Top Performer
   C: Steam Leader
   D: Department
   E: Line Manager
   F: Overall Satisfaction (1-5)
   G: See yourself here next year (Yes/No)
   H: Open-ended questions...
   ```

### Processing Survey Data

#### Option 1: Complete Processing (Recommended)
```
1. Open the Google Sheet with survey data
2. Custom Menu → "Survey Analysis" → "Process Full Survey"
3. Select Quarter (Q1, Q2, Q3, Q4) and Year
4. Click "Process"
5. Wait for completion (may take several minutes)
```

This will:
- Calculate all quantitative metrics
- Process qualitative responses
- Generate AI insights
- Export complete JSON file

#### Option 2: Metrics Only (Faster)
```
1. Custom Menu → "Survey Analysis" → "Calculate Metrics Only"
2. Select Quarter and Year
3. Click "Calculate"
```

Use this for:
- Quick metric updates
- Testing calculations
- When you don't need AI analysis

### Output Sheets Created

After processing, the following sheets are created/updated:

| Sheet Name | Content | Purpose |
|-----------|---------|---------|
| `metrics` | All calculated metrics with time-series | Source data for JSON export |
| `qualitative_insights` | Categorized qualitative feedback | Input for AI analysis |
| `leader_insights` | Leader-specific qualitative data | Leader narrative generation |

---

## Updating Metrics & Business Logic

### Adding a New Metric

1. **Add Metric Definition** in `config.js`:
```javascript
METRIC_DEFINITIONS.push({
  key: 'new_metric_key',
  name: 'Display Name',
  category: CONFIG.METRIC_CATEGORIES.ENGAGEMENT,
  question_pattern: /regex to match question/i,
  calculation: 'percentage_positive_yes_no', // or other type
  description: 'Human-readable description'
});
```

2. **Add Parser Function** in `metricsParsers.js`:
```javascript
parseNewMetric(response) {
  const field = Object.keys(response).find(key => 
    /pattern to find question/i.test(key)
  );
  if (field) {
    return response[field];
  }
  return null;
}
```

3. **Add to cleanSurveyData** in `metricsCalculator.js`:
```javascript
cleaned._newMetric = MetricsParsers.parseNewMetric(cleaned);
```

4. **Add Metric Config** in `calculateMetricsForSegment()`:
```javascript
{
  key: 'new_metric_key',
  name: 'Display Name',
  field: '_newMetric',
  calculationType: 'percentage_yes_no',
  category: 'engagement'
}
```

### Changing Calculation Logic

To modify how metrics are calculated:

1. **Update CALCULATION_METHODS** in `config.js`
2. **Modify calculateMetric()** in `metricsCalculator.js`
3. **Update parser logic** in `metricsParsers.js` if needed

### Fixing the 1-5 Scale Issue (REQUIRED)

**Current Problem**: System treats 1-2 as positive on 1-5 scale (lower is better)
**Should Be**: 4-5 are positive (higher is better) - standard satisfaction scale

**Fix Required in 3 Files:**

1. **config.js** (Line 193-196):
```javascript
'percentage_positive_1_2_scale': {
  description: '% of responses with 4-5 on scale of 1-5 ratings',
  method: 'percentage',
  positiveValues: [4, 5],  // CHANGE FROM [1, 2]
  scale: [1, 5]
}
```

2. **metricsParsers.js** (Line 44-47):
```javascript
isPositiveNumericResponse(value) {
  const num = typeof value === 'string' ? parseInt(value) : value;
  return num === 4 || num === 5;  // CHANGE FROM: num === 1 || num === 2
}
```

3. **metricsCalculator.js** (Line 184):
```javascript
calculationNote = '% of responses with 4-5 on scale of 1-5 ratings';
// CHANGE FROM: '% of responses with 1-2 on scale of 1-5 ratings'
```

### Modifying AI Prompts

To improve insight quality, edit prompts in `jsonPostprocessor.js`:

**Executive Summary** (Line 51-122):
- Adjust theme consolidation guidance
- Modify prioritization criteria
- Change HTML formatting requirements

**Leader Narrative** (Line 127-183):
- Update assessment framework
- Adjust number of focus areas
- Modify actionability requirements

**Best Practices for Prompt Updates:**
- Keep JSON structure requirements unchanged
- Maintain HTML class names for styling compatibility
- Test with sample data before production use
- Preserve metric name formatting guidelines

---

## JSON Output Structure

```javascript
{
  "metadata": {
    "quarter": "Q3_2025",
    "surveyTitle": "Employee Survey",
    "generatedDate": "2025-09-30",
    "totalResponses": 199,
    "previousQuarter": "Q2_2025"
  },
  
  "timeseriesIndex": ["Q3_2025", "Q2_2025"],
  
  "executiveSummary": {
    "llm_generated": true,
    "overview": "HTML-formatted overview",
    "keyFindings": ["Finding 1", "Finding 2", ...],
    "strategicImplication": "HTML-formatted recommendations"
  },
  
  "keyMetrics": {
    "topStats": [...],
    "keyStrengths": [...],
    "improvementAreas": [...]
  },
  
  "performanceMetrics": [
    {
      "metricKey": "retention_intent",
      "metricName": "Retention Intent",
      "overall": { "values": [63.3, 70.5] },
      "topPerformers": { "values": [58.0, 65.0] },
      "generalPopulation": { "values": [65.0, 72.0] }
    }
  ],
  
  "qualitativeInsights": [...],
  
  "leaders": [
    {
      "id": "leader_id",
      "name": "Leader Name",
      "keyStats": {...},
      "metrics": [...],
      "narrative": {
        "summary": "HTML-formatted",
        "focusAreas": [...]
      }
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

**Problem**: "Top Performer column not found"
- **Solution**: Ensure Column B contains "Top Performer" or "General"
- Check column position hasn't shifted

**Problem**: Low metric values (10-20%)
- **Solution**: Check if 1-5 scale calculation is reversed (see fix above)
- Verify question patterns match your survey

**Problem**: LLM fails to generate insights
- **Solution**: 
  - Check API key is valid
  - Verify internet connection
  - Review API usage limits
  - Check prompt token length (<100k)

**Problem**: Missing leader metrics
- **Solution**: Ensure "Steam Leader" column has consistent names
- Leaders need minimum 3 responses to appear

### Debug Mode

Enable detailed logging:
```javascript
// In any file, increase logging level
logMessage(LOGGER.DEBUG, 'Your message', dataObject);
```

View logs:
```
View → Logs (Ctrl+Enter)
```

---

## File Dependencies

```
config.js
├── metricsCalculator.js
│   └── metricsParsers.js
├── jsonPostprocessor.js
│   ├── qualPromptBuilder.js
│   └── qualTextAggregator.js
├── jsonExporter.js
│   ├── jsonMetricsBuilder.js
│   └── JSONPostprocessor
└── main.js (UI bindings)
```

---

## API Usage & Costs

**Gemini API (Google)**:
- Model: `gemini-2.5-flash`
- Average tokens per survey: ~50,000-80,000
- Cost: Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)

**Optimization Tips**:
- Use "Metrics Only" mode for testing
- Process qualitative insights separately
- Cache results for repeated analysis

---

## Maintenance Checklist

### Quarterly
- [ ] Verify API key is active
- [ ] Test with sample data
- [ ] Review metric definitions for relevance
- [ ] Update calculation methods if survey changes

### After Survey Changes
- [ ] Update question patterns in config.js
- [ ] Add/remove metrics as needed
- [ ] Test parsing logic
- [ ] Regenerate previous quarter for consistency

### Before Major Updates
- [ ] Backup current configuration
- [ ] Test on copy of production sheet
- [ ] Verify JSON output structure
- [ ] Check dashboard compatibility

---

## Support & Contact

For issues or questions:
1. Check this README first
2. Review inline code comments
3. Check execution logs for errors
4. Test with sample data to isolate issues

---

## Version History

**Current Version**: 2.0 (Updated 2025-09-30)
- Added Top Performer segmentation
- Improved AI prompt engineering
- Enhanced metric calculation logic
- Fixed column mapping issues

**Previous**: 1.0
- Initial implementation
- Basic metric calculation
- Simple AI integration
