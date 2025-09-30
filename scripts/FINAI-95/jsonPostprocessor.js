/**
 * JSON Post-processor for Survey Data - COMPLETE UPDATED VERSION
 * Updated to handle title fields and corrected CSV column structure
 */

const JSONPostprocessor = {
  
  /**
   * Generates comprehensive executive summary using LLM only
   */
  generateExecutiveSummary: function(payload) {
    const prompt = this.buildExecutiveSummaryPrompt(payload);
    
    logMessage(LOGGER.INFO, 'Generating executive summary via LLM');
    const response = this.callGeminiAPI(prompt, payload);
    const parsed = this.parseJsonResponse(response);
    
    if (parsed && parsed.overview) {
      return {
        llm_generated: true,
        ...parsed
      };
    } else {
      throw new Error('Invalid LLM response structure for executive summary');
    }
  },
  
  /**
   * Generates leader-specific narrative using LLM only
   */
  generateLeaderNarrative: function(payload) {
    const prompt = this.buildLeaderNarrativePrompt(payload);
    
    logMessage(LOGGER.INFO, `Generating leader narrative for ${payload.leader}`);
    const response = this.callGeminiAPI(prompt, payload);
    const parsed = this.parseJsonResponse(response);
    
    if (parsed && parsed.summary) {
      return {
        llm_generated: true,
        ...parsed
      };
    } else {
      throw new Error('Invalid LLM response structure for leader narrative');
    }
  },
  
  /**
   * Builds comprehensive executive summary prompt with emphasis on qualitative insights
   */
  buildExecutiveSummaryPrompt: function(payload) {
    const quarterComparison = this.buildQuarterComparisonContext(payload);
    const qualitativeContext = this.buildQualitativeContext(payload);
    const metricsInsights = this.buildMetricsInsightsContext(payload);
    const leadershipContext = this.buildLeadershipContext(payload);
    
    return `You are a senior analytics consultant analyzing employee survey data. Generate a comprehensive executive summary formatted as valid JSON.

## SURVEY DATA CONTEXT
${quarterComparison}

## PRIMARY: EMPLOYEE VOICE & QUALITATIVE THEMES
${qualitativeContext}

## SUPPORTING: QUANTITATIVE METRICS ANALYSIS  
${metricsInsights}

## LEADERSHIP INSIGHTS
${leadershipContext}

## TASK - FOCUS ON TOP 5 CONSOLIDATED EMPLOYEE THEMES
Create an executive summary that synthesizes employee voice with quantitative evidence:

1. **Lead with Employee Themes**: Focus on the 5 highest-frequency, most impactful themes from qualitative feedback
2. **Validate with Metrics**: Connect each theme to relevant quantitative metrics that explain the scale and impact
3. **Show Cause and Effect**: Link employee feedback to performance outcomes (e.g., "Low tools satisfaction (19.6%) directly explains productivity obstacles mentioned by 144+ employees")
4. **Consolidate Strategically**: Group similar concerns (e.g., "Technology Infrastructure" includes tools, systems, and engineering support)
5. **Balance Urgency with Impact**: Prioritize themes that are both frequent AND tied to critical metrics (retention, satisfaction, performance)

## KEY GUIDANCE FOR THEME CONSOLIDATION:
- **Technology & Infrastructure**: Tools, systems, engineering support, outdated equipment, platform issues
- **Leadership & Trust**: Management support, decision autonomy, strategic clarity, confidence in leadership
- **Communication & Alignment**: Information sharing, role clarity, priority setting, expectation management
- **Growth & Development**: Career progression, training, skill development, mentorship opportunities
- **Recognition & Rewards**: Compensation, acknowledgment, fairness, work-life balance policies

## ANALYTICAL APPROACH:
1. **Identify Pattern Clusters**: Look for themes that appear across multiple qualitative categories
2. **Quantify the Voice**: For each major theme, find the most relevant supporting metric
3. **Explain the Gap**: Where qualitative themes highlight issues, show if metrics confirm low scores
4. **Surface Hidden Insights**: Note when employee feedback reveals issues not obvious from metrics alone

## PRIORITIZATION CRITERIA:
1. **Frequency + Consensus**: Themes mentioned by 30+ employees across different roles/levels
2. **Metric Validation**: Themes that correspond to low-performing metrics (<40% positive)
3. **Business Impact**: Themes directly affecting retention (<70%), satisfaction (<3.5/5), or leadership confidence (<20%)
4. **Actionability**: Themes leadership can address in 1-2 quarters with specific interventions
5. **Root Cause Clarity**: Themes where employee feedback explains the "why" behind metric performance

## OUTPUT FORMAT - MUST BE VALID JSON:
{
  "llm_generated": true,
  "overview": "Comprehensive HTML-formatted analysis (400-600 words) that STARTS with qualitative insights about what employees are saying, then uses quantitative metrics to support and contextualize these findings. Use <span class='metric-value'> for numbers, <span class='trend-positive'>, <span class='trend-negative'> for trends, <span class='employee-voice'> for qualitative themes.",
  "keyFindings": [
    "<div class='analysis-paragraph'><b>**Theme Title with Frequency**</b>: Lead with what employees are saying, then validate with metric (e.g., 'Resources score of <span class='metric-value'>19.6%</span> confirms concerns'). Explain the impact and include sample employee quote using <span class='employee-voice'>quote</span>.</div>",
    "<div class='analysis-paragraph'><b>**Theme 2**</b>: Connect qualitative pattern to quantitative outcome. Show trends using <span class='trend-negative'>↓7.2pp</span>. Explain why this matters for business.</div>",
    "<div class='analysis-paragraph'><b>**Theme 3**</b>: Identify root causes from employee feedback. Link to multiple related metrics. Describe cascading effects.</div>",
    "<div class='analysis-paragraph'><b>**Theme 4**</b>: Surface hidden insights where qualitative reveals issues metrics alone wouldn't show. Provide context about 'why' behind numbers.</div>",
    "<div class='analysis-paragraph'><b>**Theme 5**</b>: Show divergence or alignment between segments (top performers vs general). Highlight retention or performance risks.</div>"
  ],
  "strategicImplication": "HTML-formatted strategic guidance (150-200 words) that emphasizes actions based on employee voice insights, validated by quantitative trends"
}

## CONTENT PRIORITIES & ANALYTICAL DEPTH:
1. **Employee Voice First**: What are the most frequent concerns in employees' own words? What specific pain points are they describing?
2. **Quantitative Validation**: Which metrics confirm these themes? What's the severity (e.g., "Only 12.6% confident in leadership")?
3. **Connect Dots**: Show causality (e.g., "Ineffective engineering support theme validates why Resources score is 19.6%")
4. **Identify Multiplier Effects**: Which themes cascade into multiple problems? (e.g., "Poor tools → productivity loss → frustration → retention risk")
5. **Actionable Intelligence**: What specific actions would address root causes rather than symptoms?
6. **Segment Insights**: Are top performers experiencing issues differently than general?

## FORMATTING REQUIREMENTS:
- ALL output must be valid JSON - escape quotes properly
- Use HTML tags with CSS classes: <div class='analysis-paragraph'>, <span class='employee-voice'>, <span class='metric-value'>
- Start analysis with qualitative themes, then add quantitative support
- Use human-readable terms for all metrics and concepts
- Write for executive audience requiring actionable insights from employee voice
- NO markdown formatting - only HTML tags
- NO system variable names - use natural language

RESPOND ONLY WITH THE JSON OBJECT - NO ADDITIONAL TEXT OR MARKDOWN BLOCKS.`;
  },
  
  /**
   * Builds enhanced leader narrative prompt with better structure
   */
  buildLeaderNarrativePrompt: function(payload) {
    const leaderMetrics = this.buildLeaderMetricsContext(payload);
    const teamComparison = this.buildTeamComparisonContext(payload);
    const qualitativeEvidence = this.buildLeaderQualitativeContext(payload);
    const leaderInsights = this.buildLeaderInsightsContext(payload);
    
    return `You are an organizational analyst creating a leader-specific assessment. Generate valid JSON output.

## LEADER: ${payload.leader}
## REPORTING PERIOD: ${payload.quarter}${payload.previousQuarter ? ` vs ${payload.previousQuarter}` : ''}

## TEAM METRICS PERFORMANCE
${leaderMetrics}

## COMPARATIVE CONTEXT
${teamComparison}

## LEADER-SPECIFIC INSIGHTS
${leaderInsights}

## QUALITATIVE EVIDENCE
${qualitativeEvidence}

## TASK
Generate a data-driven leader assessment that combines metrics with qualitative evidence:
1. **Performance Trajectory**: Analyze trends across quarters - what's improving, declining, or stable?
2. **Comparative Context**: How does this team perform vs organizational averages? Where are the gaps?
3. **Root Cause Analysis**: What specific feedback explains metric performance? Connect the dots.
4. **Top 2 Priorities**: Most impactful focus areas based on severity, frequency, and business impact

## CRITICAL ANALYSIS GUIDELINES:
- **Metric Interpretation**: Use human-readable names ("Leadership Confidence" not "leadershipConfidence"). Always include specific values and trends.
- **Evidence-Based**: Every claim must be supported by either a metric or qualitative feedback example
- **Comparative Analysis**: Compare current vs previous quarter AND vs organizational average where available
- **Segment Differences**: Highlight how top performers' experience differs from general on this team
- **Root Cause Focus**: Don't just report low scores - explain WHY based on employee feedback
- **Prioritization Logic**: Choose focus areas that:
  a) Have clear metric evidence of underperformance (<40% or declining >5pp)
  b) Are mentioned frequently in qualitative feedback (5+ mentions)
  c) Have defined, actionable remediation paths
  d) Will create measurable improvement in 1-2 quarters

## OUTPUT FORMAT - MUST BE VALID JSON:
{
  "llm_generated": true,
  "summary": "<div class='leader-summary'><p>Start with headline: team performance direction (improving/declining/stable). Reference 2-3 key metrics with specific values and trends (e.g., <span class='metric-value'>63.3%</span> retention, <span class='trend-negative'>↓7.2pp</span>).</p><p>Identify the PRIMARY STRENGTH using <span class='strength-indicator'>strength term</span> with metric evidence. Then describe the MOST CRITICAL CHALLENGE using <span class='challenge-indicator'>challenge term</span>, linking to both quantitative and qualitative data.</p><p>Explain the 'why' behind metrics - what employee feedback reveals about root causes. Connect multiple data points to show patterns (e.g., 'Low <span class='metric-value'>19.6%</span> Resources score validates employee concerns about ineffective engineering support').</p><p>End with strategic context: what this means for retention/performance risk, and where intervention will have highest impact. Note any top performer flight risk.</p></div>",
  "focusAreas": [
    "HTML-formatted priority area #1 with clear title, description, specific actions, and expected impact using proper div and span tags",
    "HTML-formatted priority area #2 with supporting metrics, rationale, and actionable steps"
  ]
}

## FORMATTING REQUIREMENTS:
- ALL output must be valid JSON - escape quotes properly  
- Use HTML tags: <div class='focus-area-item'>, <span class='metric-value'>, <span class='priority-high'>
- Reference specific metrics using human-readable names
- Provide actionable, leader-specific guidance
- Balance recognition of strengths with development opportunities
- NO markdown formatting - only HTML tags
- EXACTLY 2 focus areas only

RESPOND ONLY WITH THE JSON OBJECT - NO ADDITIONAL TEXT OR MARKDOWN BLOCKS.`;
  },
  
  /**
   * Builds quarter comparison context with better data handling
   */
  buildQuarterComparisonContext: function(payload) {
    const currentQuarter = payload.quarter || payload.metadata?.quarter;
    const previousQuarter = payload.previousQuarter;
    
    // Handle case where keyMetrics might not exist
    const topStats = payload.keyMetrics && payload.keyMetrics.topStats ? payload.keyMetrics.topStats : [];
    const hasComparison = previousQuarter && topStats.length > 0;
    
    if (!hasComparison) {
      const responseCount = topStats.find(s => s.label.includes('Response'))?.values?.[0] || 
                           (payload.metadata && payload.metadata.totalResponses) || 'N/A';
      return `Current Quarter: ${currentQuarter}
Survey Participation: ${responseCount} responses
Note: No previous quarter data available for trend analysis.`;
    }
    
    const responseComparison = topStats.find(s => s.label.includes('Response'));
    const trendDirection = this.calculateTrendDirection(topStats);
    
    return `Current Quarter: ${currentQuarter} | Previous Quarter: ${previousQuarter}
Survey Participation: ${responseComparison?.values?.[0] || 'N/A'} responses (${responseComparison?.values?.[1] || 'N/A'} previous)
Overall Trend Direction: ${trendDirection}`;
  },
  
  /**
   * Builds metrics insights context with null safety
   */
  buildMetricsInsightsContext: function(payload) {
    if (!payload.keyMetrics) return 'No quantitative metrics available.';
    
    const topStats = payload.keyMetrics.topStats || [];
    const strengths = payload.keyMetrics.keyStrengths || [];
    const improvements = payload.keyMetrics.improvementAreas || [];
    
    let context = 'KEY METRICS PERFORMANCE:\n';
    
    // Top stats with trend analysis
    topStats.forEach(stat => {
      const current = stat.values?.[0];
      const previous = stat.values?.[1];
      const trend = previous ? (current - previous > 0 ? '↑' : current - previous < 0 ? '↓' : '→') : '';
      const change = previous ? ` (${trend}${Math.abs(current - previous).toFixed(1)}pp)` : '';
      context += `- ${stat.label}: ${current}${stat.unit || ''}${change}\n`;
    });
    
    if (strengths.length > 0) {
      context += '\nTOP PERFORMING AREAS:\n';
      strengths.forEach(strength => {
        context += `- ${strength.description}: ${strength.values?.[0] || 'N/A'}${strength.context ? ` (${strength.context})` : ''}\n`;
      });
    }
    
    if (improvements.length > 0) {
      context += '\nIMPROVEMENT PRIORITIES:\n';
      improvements.forEach(area => {
        context += `- ${area.description}: ${area.values?.[0] || 'N/A'} (Priority: ${area.priority || 'N/A'})\n`;
      });
    }
    
    return context;
  },
  
  /**
   * Builds qualitative context with updated structure including titles
   */
  buildQualitativeContext: function(payload) {
    if (!payload.qualitativeInsights || !Array.isArray(payload.qualitativeInsights) || payload.qualitativeInsights.length === 0) {
      return 'No qualitative insights available for this reporting period.';
    }
    
    let context = 'EMPLOYEE VOICE THEMES (with titles and content):\n';
    
    // Sort by frequency and take top 5
    const topInsights = payload.qualitativeInsights
      .sort((a, b) => {
        const freqA = (a.timeseries && Object.values(a.timeseries)[0]?.frequency) || a.frequency || 0;
        const freqB = (b.timeseries && Object.values(b.timeseries)[0]?.frequency) || b.frequency || 0;
        return freqB - freqA;
      })
      .slice(0, 5);
    
    const totalFrequency = topInsights.reduce((sum, insight) => {
      const freq = (insight.timeseries && Object.values(insight.timeseries)[0]?.frequency) || insight.frequency || 0;
      return sum + freq;
    }, 0);
    
    context += `Total feedback analyzed: ${totalFrequency} employee responses\n\n`;
    
    topInsights.forEach((insight, index) => {
      const frequency = (insight.timeseries && Object.values(insight.timeseries)[0]?.frequency) || insight.frequency || 0;
      const percentage = totalFrequency > 0 ? Math.round((frequency / totalFrequency) * 100) : 0;
      const category = (insight.category || 'general').replace(/_/g, ' ').toUpperCase();
      const title = insight.title || 'Untitled Theme';
      
      context += `${index + 1}. TITLE: "${title}" | CATEGORY: ${category}\n`;
      context += `   CONTENT: ${insight.content} (${frequency} mentions, ${percentage}% of feedback)\n`;
      
      // Add sample responses if available
      if (insight.sampleResponses && insight.sampleResponses.length > 0) {
        context += `   EXAMPLES: "${insight.sampleResponses.slice(0, 2).join('", "')}"\n`;
      }
      
      context += '\n';
    });
    
    return context;
  },
  
  /**
   * Builds leadership context with better data handling
   */
  buildLeadershipContext: function(payload) {
    if (!payload.leaders || !Array.isArray(payload.leaders) || payload.leaders.length === 0) {
      return 'No leadership data available.';
    }
    
    let context = 'LEADERSHIP TEAM PERFORMANCE:\n';
    
    // Sort leaders by available key metrics
    const sortedLeaders = payload.leaders
      .filter(leader => leader.keyStats && Object.keys(leader.keyStats).length > 0)
      .sort((a, b) => {
        const aRetention = a.keyStats.retention?.values?.[0] || 0;
        const bRetention = b.keyStats.retention?.values?.[0] || 0;
        return bRetention - aRetention;
      })
      .slice(0, 8);
    
    if (sortedLeaders.length === 0) {
      context += 'No detailed leader metrics available for analysis.\n';
    } else {
      sortedLeaders.forEach(leader => {
        const retention = leader.keyStats.retention?.values?.[0] || 'N/A';
        const tools = leader.keyStats.tools?.values?.[0] || 'N/A';
        const teamSize = leader.metrics?.find(m => m.metricKey === 'total_survey_responses')?.values?.[0] || 'N/A';
        
        context += `- ${leader.name}: ${teamSize} responses, ${retention}% retention, ${tools}% tools satisfaction`;
        
        // Add insights if available
        if (leader.insights && leader.insights.length > 0) {
          const insightTitles = leader.insights.map(insight => insight.title).slice(0, 2);
          context += ` | Key insights: ${insightTitles.join(', ')}`;
        }
        
        context += '\n';
      });
    }
    
    return context;
  },
  
  /**
   * Builds leader insights context with title field
   */
  buildLeaderInsightsContext: function(payload) {
    if (!payload.insights || !Array.isArray(payload.insights) || payload.insights.length === 0) {
      return 'No specific insights available for this leader.';
    }
    
    let context = 'LEADER-SPECIFIC INSIGHTS:\n';
    
    payload.insights.forEach((insight, index) => {
      context += `${index + 1}. TITLE: "${insight.title}"\n`;
      context += `   TYPE: ${insight.insightType || 'observation'}\n`;
      context += `   CONTENT: ${insight.content}\n`;
      if (insight.supportingEvidence) {
        context += `   EVIDENCE: ${insight.supportingEvidence}\n`;
      }
      context += '\n';
    });
    
    return context;
  },
  
  /**
   * Builds leader-specific metrics context with human-readable terms
   */
  buildLeaderMetricsContext: function(payload) {
    if (!payload.keyStats || Object.keys(payload.keyStats).length === 0) {
      return 'No metrics data available for this leader.';
    }
    
    let context = 'TEAM METRICS:\n';
    
    // Map system keys to human-readable names
    const metricNameMap = {
      'retention': 'Retention Intent',
      'leadershipConfidence': 'Leadership Confidence', 
      'tools': 'Tools and Resources',
      'empowerment': 'Empowerment',
      'recognition': 'Recognition'
    };
    
    Object.entries(payload.keyStats).forEach(([metric, data]) => {
      const current = data.values?.[0];
      const previous = data.values?.[1];
      const trend = previous ? (current - previous > 0 ? '↑' : current - previous < 0 ? '↓' : '→') : '';
      const change = previous ? ` (${trend}${Math.abs(current - previous).toFixed(1)}pp)` : '';
      
      const humanReadableName = metricNameMap[metric] || metric;
      context += `- ${humanReadableName}: ${current}${data.unit || ''}${change}\n`;
      
      // Include top performer data if available
      if (data.topPerformerValues && data.topPerformerValues[0] !== null) {
        context += `  Top Performers: ${data.topPerformerValues[0]}${data.unit || ''}\n`;
      }
    });
    
    return context;
  },
  
  /**
   * Builds team comparison context
   */
  buildTeamComparisonContext: function(payload) {
    return 'Team comparison to organizational benchmarks: Data being processed for comparative analysis.';
  },
  
  /**
   * Builds leader qualitative context
   */
  buildLeaderQualitativeContext: function(payload) {
    if (!payload.bullets || !Array.isArray(payload.bullets) || payload.bullets.length === 0) {
      return 'No specific qualitative feedback available for this leader.';
    }
    
    let context = 'TEAM-SPECIFIC FEEDBACK THEMES:\n';
    payload.bullets.forEach((bullet, index) => {
      context += `${index + 1}. ${bullet}\n`;
    });
    
    return context;
  },
  
  /**
   * Calculates overall trend direction with null safety
   */
  calculateTrendDirection: function(topStats) {
    if (!topStats || !Array.isArray(topStats) || topStats.length === 0) return 'No trend data available';
    
    let positive = 0, negative = 0, neutral = 0;
    
    topStats.forEach(stat => {
      const current = stat.values?.[0];
      const previous = stat.values?.[1];
      if (current !== null && previous !== null && typeof current === 'number' && typeof previous === 'number') {
        const change = current - previous;
        if (change > 1) positive++;
        else if (change < -1) negative++;
        else neutral++;
      }
    });
    
    if (positive > negative) return 'Improving';
    else if (negative > positive) return 'Declining';
    else return 'Stable';
  },
  
  /**
   * Calls Gemini API with better error handling
   */
  callGeminiAPI: function(prompt, inputData) {
    // Truncate input data for API call to avoid token limits
    const truncatedData = {
      quarter: inputData.quarter,
      keyMetrics: inputData.keyMetrics,
      performanceMetrics: inputData.performanceMetrics ? inputData.performanceMetrics.slice(0, 5) : [],
      qualitativeInsights: inputData.qualitativeInsights ? inputData.qualitativeInsights.slice(0, 10).map(insight => ({
        title: insight.title,
        category: insight.category,
        content: insight.content, // DO NOT TRUNCATE - preserve full content for LLM context
        timeseries: insight.timeseries,
        sampleResponses: insight.sampleResponses ? insight.sampleResponses.slice(0, 2) : []
      })) : [],
      leaders: inputData.leaders ? inputData.leaders.slice(0, 5).map(leader => ({
        name: leader.name,
        keyStats: leader.keyStats,
        metrics: leader.metrics ? leader.metrics.slice(0, 5) : [],
        insights: leader.insights ? leader.insights.slice(0, 3).map(insight => ({
          title: insight.title,
          insightType: insight.insightType,
          content: insight.content && insight.content.length > 150 ? insight.content.substring(0, 150) + '...' : insight.content
        })) : []
      })) : []
    };
    
    const fullPrompt = prompt + '\n\nDATA:\n' + JSON.stringify(truncatedData, null, 2);
    
    // Call the existing API processor
    const response = AIProcessor.callGeminiAPI(fullPrompt, 'json_postprocessing');
    
    logMessage(LOGGER.DEBUG, 'LLM Response received', { 
      responseStart: response.substring(0, 200),
      responseLength: response.length 
    });
    
    return response;
  },
  
  /**
   * Parses JSON response with enhanced error handling
   */
  parseJsonResponse: function(responseText) {
    // Remove markdown code blocks and extra whitespace
    let cleanedText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/\s*```/g, '')
      .replace(/^\s*json\s*/gi, '')
      .trim();
    
    // Try to find JSON object boundaries
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
      
      // Parse the JSON
      const parsed = JSON.parse(jsonText);
      
      // Validate required fields
      if (parsed && (parsed.overview || parsed.summary)) {
        return parsed;
      } else {
        throw new Error('Missing required fields in LLM response');
      }
    } else {
      // Try parsing the entire cleaned text as fallback
      const parsed = JSON.parse(cleanedText);
      if (parsed && (parsed.overview || parsed.summary)) {
        return parsed;
      } else {
        throw new Error('Missing required fields in parsed response');
      }
    }
  }
};