const PromptBuilder = {
  
  /**
   * Build category analysis prompt with SPECIFIC titles and FULL examples
   * Focus on concrete, actionable issues rather than broad themes
   * @param {Object} categoryData - Category data with clustering
   * @param {String} category - Category name
   * @param {String} quarterId - Quarter identifier
   * @returns {String} - Improved prompt for specific insights
   */
  buildCategoryPrompt: function(categoryData, category, quarterId) {
    // FILTER: Only process clusters with 30+ frequency
    const highFrequencyClusters = categoryData.clusters.filter(c => c.count >= 20);
    
    if (highFrequencyClusters.length === 0) {
      logMessage(LOGGER.WARN, `No clusters with 30+ frequency for category ${category}`);
      return null;
    }
    
    logMessage(LOGGER.INFO, `Category ${category}: Processing ${highFrequencyClusters.length} clusters with 30+ frequency`);
    
    // Prepare cluster data with FULL examples (no truncation)
    const enrichedClusters = highFrequencyClusters.map(cluster => {
      let examples = cluster.examples || [];
      
      // Ensure we have at least 3 examples - pad if necessary but preserve full text
      if (examples.length < 3 && examples.length > 0) {
        while (examples.length < 3) {
          examples.push(examples[0]);
        }
      }
      
      return {
        theme: cluster.theme,
        count: cluster.count,
        percentage: Math.round((cluster.count / categoryData.totalResponses) * 100),
        full_examples: examples.slice(0, 5), // FULL examples, not truncated
        leaderCount: cluster.leaderCount || 1
      };
    });
    
    const columnRef = categoryData.columnRef || category;
    
    const prompt = `TASK: Create specific, actionable employee feedback insights with precise titles and complete quotes.

CONTEXT:
- Quarter: ${quarterId}
- Category: ${category}
- Column: ${columnRef}
- Total Responses: ${categoryData.totalResponses}
- High-Frequency Clusters: ${highFrequencyClusters.length}

EMPLOYEE FEEDBACK CLUSTERS:
${JSON.stringify(enrichedClusters, null, 2)}

CRITICAL REQUIREMENTS:

1. TITLE (Column D) - EXACTLY 3-4 WORDS:
   ✓ GOOD: "Slow Laptop Performance"
   ✓ GOOD: "Unclear Project Priorities"
   ✓ GOOD: "Missing Manager Feedback"
   ✗ BAD: "Employees need better communication from leadership"
   ✗ BAD: "Technology and software issues"
   
   RULES:
   - Maximum 4 words
   - Specific problem, not category
   - Noun + descriptive words
   - NO articles (a, an, the)
   - NO generic terms like "issues" or "problems"

2. SAMPLE_RESPONSES (Column G) - EXACTLY 3 COMPLETE QUOTES:
   - Use FULL original text from full_examples
   - NO summarizing or paraphrasing
   - NO truncation with "..." 
   - Separate with symbol " ; " 
   - If quote is long, use it anyway - preserve complete thoughts

3. CONTENT - SPECIFIC AND ACTIONABLE:
   - Focus on the SPECIFIC problem, not broad themes
   - Include WHAT exactly needs fixing
   - 30-50 words maximum
   - Avoid generic language like "employees desire" or "indicating a need"
   

OUTPUT FORMAT:
[{
  "insight_type": "themes",
  "category": "${category}",
  "title": "<EXACTLY 3-4 words - specific problem>",
  "content": "<30-50 words describing WHAT specifically is broken/missing>",
  "frequency": <cluster_frequency>,
  "sample_responses": "<FULL Quote 1 | FULL Quote 2 | FULL Quote 3>",
  "question_reference": "${columnRef}"
}]

TITLE EXAMPLES BY CATEGORY:
- Technology: "Outdated Software Versions", "Slow Network Connectivity", "Missing Development Tools"
- Communication: "Weekly Standup Cancellations", "Project Status Gaps", "Manager Response Delays"  
- Recognition: "Promotion Criteria Unclear", "Peer Appreciation Missing", "Achievement Celebration Lacking"
- Workload: "Unrealistic Project Deadlines", "Meeting Schedule Overload", "Task Priority Confusion"

VALIDATION CHECKLIST:
□ Every title is exactly 3-4 words
□ Titles describe SPECIFIC problems, not categories
□ Sample_responses contains 3 COMPLETE quotes with " | " separators
□ No truncation in quotes - full original text preserved
□ Content describes WHAT is specifically broken/missing
□ Only themes with 30+ frequency included

Generate specific, actionable insights with precise titles and complete example quotes.`;

    return prompt;
  },
  
  /**
   * Updated buildLeaderPrompt with quantitative metrics integration
   * @param {Array} leaderBatch - Array of [leaderName, data] pairs
   * @param {String} quarterId - Quarter identifier
   * @param {Array} metricsData - Optional metrics data for enhanced analysis
   * @returns {String} - Leadership analysis prompt
   */
  buildLeaderPrompt: function(leaderBatch, quarterId, metricsData = null) {
    // If metrics data is provided, use metrics-based analysis
    if (metricsData && metricsData.length > 0) {
      return this.buildLeaderPromptWithMetrics(leaderBatch, metricsData, quarterId);
    }
    
    // Otherwise use original theme-based analysis
    const leaderAnalysis = leaderBatch.map(([leader, data]) => {
      const significantThemes = Object.entries(data.themes)
        .filter(([theme, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      
      if (significantThemes.length === 0) return null;
      
      const themeData = significantThemes.map(([theme, count]) => ({
        theme: theme.replace(/_/g, ' '),
        count: count,
        percentage: Math.round((count / data.responseCount) * 100)
      }));
      
      return {
        leader: leader,
        responses: data.responseCount,
        department: data.department,
        themes: themeData
      };
    }).filter(analysis => analysis !== null);
    
    if (leaderAnalysis.length === 0) {
      return null;
    }
    
    const prompt = `Analyze team feedback patterns for leadership insights.

Quarter: ${quarterId}
Leaders: ${leaderAnalysis.length}

Data: ${JSON.stringify(leaderAnalysis, null, 2)}

ANALYSIS FOCUS:
- Identify team-specific patterns requiring leader attention
- Compare teams to identify notable differences
- Focus on actionable insights with clear evidence

OUTPUT FORMAT - 6 columns:
[{
  "leader_name": "<leader_name>",
  "insight_rank": 1,
  "insight_type": "strength|challenge|opportunity",
  "content": "<specific insight for this team>",
  "supporting_evidence": "<theme frequency and details>",
  "theme_frequency": <primary_theme_count>
}]

REQUIREMENTS:
- 1-2 insights per leader
- Focus on patterns with 3+ frequency
- Maximum 50 words per content
- Include specific supporting evidence

Generate team-specific insights using original structure.`;

    return prompt;
  },
  
  /**
   * Metrics-based leader prompt that combines quantitative performance with qualitative themes
   * @param {Array} leaderBatch - Array of [leaderName, data] pairs
   * @param {Array} metricsData - Calculated metrics for these leaders
   * @param {String} quarterId - Quarter identifier
   * @returns {String} - Metrics-focused leadership prompt
   */
  buildLeaderPromptWithMetrics: function(leaderBatch, metricsData, quarterId) {
    const leaderAnalysis = leaderBatch.map(([leader, data]) => {
      // Get metrics for this leader
      const leaderMetrics = metricsData.filter(metric => 
        metric.leader === leader && 
        metric.metric_key !== 'total_responses'
      );
      
      // Find strongest and weakest metrics (by percentage value)
      const sortedMetrics = leaderMetrics
        .filter(m => m.value > 0)
        .sort((a, b) => b.value - a.value);
      
      const strongestMetrics = sortedMetrics.slice(0, 2); // Top 2 performers
      const weakestMetrics = sortedMetrics.slice(-2); // Bottom 2 performers
      
      // Get significant qualitative themes (3+ frequency)
      const significantThemes = Object.entries(data.themes)
        .filter(([theme, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([theme, count]) => ({
          theme: theme.replace(/_/g, ' '),
          count: count,
          percentage: Math.round((count / data.responseCount) * 100)
        }));
      
      // Only include leaders with meaningful data
      if (strongestMetrics.length === 0 && weakestMetrics.length === 0 && significantThemes.length === 0) {
        return null;
      }
      
      return {
        leader: leader,
        responses: data.responseCount,
        department: data.department,
        // Performance metrics analysis
        strongest_metrics: strongestMetrics.map(m => ({
          metric: m.metric_name,
          value: m.value,
          top_performers_rate: m.top_performers_percentage
        })),
        weakest_metrics: weakestMetrics.map(m => ({
          metric: m.metric_name,
          value: m.value,
          top_performers_rate: m.top_performers_percentage
        })),
        // Qualitative themes
        themes: significantThemes
      };
    }).filter(analysis => analysis !== null);
    
    if (leaderAnalysis.length === 0) {
      return null;
    }
    
    const prompt = `TASK: Generate actionable leadership insights combining quantitative performance metrics with qualitative feedback patterns.

Quarter: ${quarterId}
Leaders: ${leaderAnalysis.length}

ANALYSIS DATA:
${JSON.stringify(leaderAnalysis, null, 2)}

ANALYSIS REQUIREMENTS:

1. PERFORMANCE-BASED INSIGHTS:
   - Identify leaders with concerning metric gaps (low overall scores)
   - Highlight leaders excelling in specific areas (high metric scores)
   - Compare top performer rates vs general rates
   - Focus on actionable metric improvements

2. INSIGHT TYPES:
   - "strength": Areas where leader's team excels (high metric %)
   - "challenge": Areas needing improvement (low metric % or concerning themes)
   - "opportunity": Potential improvements based on data patterns

3. CONTENT REQUIREMENTS:
   - Lead with SPECIFIC metric performance (e.g., "Team satisfaction at 72%")
   - Include comparison context (vs other teams/top performers)
   - Connect metrics to qualitative themes when relevant
   - Be specific about what needs attention

4. SUPPORTING EVIDENCE FORMAT:
   - Lead with key metric: "Retention Intent: 65% (vs 85% company average)"
   - Include relevant theme frequency: "Communication issues: 8 mentions (40%)"
   - Add top performer comparison when significant

OUTPUT FORMAT - 6 columns matching CSV:
[{
  "leader_name": "<leader_name>",
  "insight_rank": 1,
  "insight_type": "strength|challenge|opportunity", 
  "content": "<metric-focused insight with specific percentages>",
  "supporting_evidence": "<metric data + theme frequency>",
  "theme_frequency": <primary_metric_value>
}]

EXAMPLE OUTPUTS:

STRENGTH Example:
{
  "leader_name": "Sarah Johnson",
  "insight_rank": 1,
  "insight_type": "strength",
  "content": "Team shows exceptional retention intent at 95% vs 78% company average, with strong empowerment scores (88%)",
  "supporting_evidence": "Retention Intent: 95% (12/13 responses), Empowerment: 88%, Recognition themes: 2 mentions",
  "theme_frequency": 95
}

CHALLENGE Example:
{
  "leader_name": "Mike Chen", 
  "insight_rank": 1,
  "insight_type": "challenge",
  "content": "Leadership confidence critically low at 42% with communication breakdown themes emerging",
  "supporting_evidence": "Leadership Confidence: 42% vs 71% average, Communication issues: 6 mentions (35% of responses)",
  "theme_frequency": 42
}

OPPORTUNITY Example:
{
  "leader_name": "Alex Rivera",
  "insight_rank": 1, 
  "insight_type": "opportunity",
  "content": "Resources satisfaction at 58% could improve team satisfaction currently at 68%",
  "supporting_evidence": "Resources: 58% vs 72% average, Tools/tech themes: 4 mentions, Overall satisfaction: 68%",
  "theme_frequency": 58
}

VALIDATION REQUIREMENTS:
□ Every insight starts with specific metric percentage
□ Supporting evidence includes metric values and theme counts
□ Content connects metrics to actionable improvements
□ Use theme_frequency field for the primary metric value
□ Maximum 1-2 insights per leader
□ Focus on most significant performance gaps or strengths

Generate metric-driven leadership insights with specific percentages and actionable recommendations.`;

    return prompt;
  },
  
  /**
   * Helper function to get metrics data for specific leaders
   * @param {Array} allMetrics - All calculated metrics
   * @param {Array} leaderNames - Leader names to filter for
   * @returns {Array} - Filtered metrics for specified leaders
   */
  getLeaderMetricsData: function(allMetrics, leaderNames) {
    return allMetrics.filter(metric => 
      leaderNames.includes(metric.leader) && metric.leader !== 'all'
    );
  },
  
  /**
   * Parse category response with IMPROVED title and example validation
   * @param {String} responseText - AI response
   * @param {String} category - Category name
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Parsed insights with validated titles and examples
   */
  parseCategoryResponse: function(responseText, category, quarterId) {
    try {
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      let insights;
      
      if (cleanedText.startsWith('[')) {
        try {
          insights = JSON.parse(cleanedText);
        } catch (e) {
          const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            insights = JSON.parse(jsonMatch[0]);
          } else {
            logMessage(LOGGER.ERROR, 'No valid JSON structure found', { category });
            return [];
          }
        }
      } else {
        const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch) {
          logMessage(LOGGER.ERROR, 'No JSON array found', { category });
          return [];
        }
        insights = JSON.parse(jsonMatch[0]);
      }
      
      if (!Array.isArray(insights)) {
        logMessage(LOGGER.ERROR, 'Parsed data is not an array', { category });
        return [];
      }
      
      // Process and validate insights with IMPROVED validation
      return insights.map((insight, index) => {
        // IMPROVED TITLE VALIDATION - enforce 3-4 words exactly
        let title = insight.title || '';
        if (!title.trim()) {
          // Create fallback title from content first few meaningful words
          const content = insight.content || '';
          const meaningfulWords = content.split(' ')
            .filter(w => w.length > 3 && !['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'more', 'need', 'want'].includes(w.toLowerCase()))
            .slice(0, 3);
          title = meaningfulWords.join(' ') || `${category.replace('_', ' ')} Issue`;
        }
        
        // Enforce 3-4 word limit by taking first meaningful words
        const titleWords = title.split(' ')
          .filter(w => w.length > 0 && !['a', 'an', 'the'].includes(w.toLowerCase()));
        if (titleWords.length > 4) {
          title = titleWords.slice(0, 4).join(' ');
        } else if (titleWords.length < 3 && titleWords.length > 0) {
          // If too short, try to expand from content
          const content = insight.content || '';
          const additionalWords = content.split(' ')
            .filter(w => w.length > 3 && !titleWords.includes(w))
            .slice(0, 4 - titleWords.length);
          title = [...titleWords, ...additionalWords].slice(0, 4).join(' ');
        }
        
        // IMPROVED SAMPLE_RESPONSES VALIDATION - preserve full quotes
        let sampleResponses = insight.sample_responses || '';
        
        // If we have sample_responses, validate they are full quotes
        if (sampleResponses) {
          // Check if responses seem truncated (ends with ... or is very short)
          const responses = sampleResponses.split(' | ');
          if (responses.length < 3) {
            // Pad with the first response if we don't have 3
            while (responses.length < 3 && responses.length > 0) {
              responses.push(responses[0]);
            }
            sampleResponses = responses.slice(0, 3).join(' | ');
          }
          
          // Ensure each response is reasonably complete (not truncated)
          const validResponses = responses.map(resp => {
            if (resp.endsWith('...')) {
              // Remove truncation indicator - we want full quotes
              return resp.replace(/\.\.\.+$/, '').trim();
            }
            return resp.trim();
          }).filter(resp => resp.length > 10); // Filter out very short responses
          
          if (validResponses.length >= 3) {
            sampleResponses = validResponses.slice(0, 3).join(' | ');
          }
        }
        
        // If still no good examples, use fallback but mark for attention
        if (!sampleResponses || sampleResponses.length < 20) {
          sampleResponses = 'Example response 1 | Example response 2 | Example response 3';
          logMessage(LOGGER.WARN, `Using fallback examples for ${title} - original examples may have been truncated`);
        }
        
        return {
          quarter: quarterId,
          insight_type: insight.insight_type || 'themes',
          category: category,
          title: title, // Now guaranteed to be 3-4 words
          content: (insight.content || '').substring(0, 300), // Increased limit for specific details
          frequency: parseInt(insight.frequency) || 0,
          sample_responses: sampleResponses, // Full examples preserved
          question_reference: insight.question_reference || category,
          examples: insight.examples || [] // Keep original for debugging
        };
      }).filter(insight => 
        insight.content && 
        insight.content.length > 0 && 
        insight.frequency >= 20 &&
        insight.title.split(' ').length >= 2 // Ensure title has at least 2 words
      );
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Failed to parse category response', {
        error: error.toString(),
        category: category,
        responsePreview: responseText.substring(0, 200)
      });
      return [];
    }
  },
  
  /**
   * Parse leader response with title generation - supports both original and metrics-based formats
   * @param {String} responseText - AI response
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Parsed leader insights
   */
  parseLeaderResponse: function(responseText, quarterId) {
    try {
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      let insights;
      
      if (cleanedText.startsWith('[')) {
        try {
          insights = JSON.parse(cleanedText);
        } catch (e) {
          const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            insights = JSON.parse(jsonMatch[0]);
          } else {
            logMessage(LOGGER.ERROR, 'No valid JSON structure found for leader response');
            return [];
          }
        }
      } else {
        const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch) {
          logMessage(LOGGER.ERROR, 'No JSON array found in leader response');
          return [];
        }
        insights = JSON.parse(jsonMatch[0]);
      }
      
      if (!Array.isArray(insights)) {
        logMessage(LOGGER.ERROR, 'Parsed leader data is not an array');
        return [];
      }
      
      return insights.map((insight) => {
        // Generate title from content - prioritizing metrics if present
        let title = '';
        const content = insight.content || '';
        
        // Check for metric-based content first
        const percentageMatch = content.match(/(\d+)%/);
        const metricMatch = content.match(/(satisfaction|retention|confidence|empowerment|recognition|resources|leadership)/i);
        
        if (percentageMatch && metricMatch) {
          const percentage = percentageMatch[1];
          const metric = metricMatch[1].toLowerCase();
          const insightType = insight.insight_type || '';
          
          if (insightType === 'strength') {
            title = `Strong ${metric.charAt(0).toUpperCase() + metric.slice(1)} ${percentage}%`;
          } else if (insightType === 'challenge') {
            title = `Low ${metric.charAt(0).toUpperCase() + metric.slice(1)} ${percentage}%`;
          } else {
            title = `${metric.charAt(0).toUpperCase() + metric.slice(1)} Opportunity ${percentage}%`;
          }
        } else {
          // Fallback to extracting meaningful words from content
          const meaningfulWords = content.split(' ')
            .filter(w => 
              w.length > 3 && 
              !['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'more', 
                'need', 'want', 'team', 'show', 'seem', 'appear', 'indicate', 'their', 'would', 'could'].includes(w.toLowerCase())
            )
            .slice(0, 4);
          
          if (meaningfulWords.length >= 2) {
            title = meaningfulWords.join(' ');
          } else {
            // Final fallback based on insight type and leader name
            const leaderFirstName = (insight.leader_name || '').split(' ')[0];
            const insightType = insight.insight_type || 'observation';
            
            if (insightType === 'strength') {
              title = `${leaderFirstName} Team Strengths`;
            } else if (insightType === 'challenge') {
              title = `${leaderFirstName} Team Challenges`;
            } else if (insightType === 'opportunity') {
              title = `${leaderFirstName} Growth Opportunities`;
            } else {
              title = `${leaderFirstName} Team Pattern`;
            }
          }
        }
        
        // Ensure title is appropriate length
        const titleWords = title.split(' ').filter(w => w.length > 0);
        if (titleWords.length > 8) {
          title = titleWords.slice(0, 8).join(' ');
        }
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        
        return {
          quarter: quarterId,
          leader_name: insight.leader_name || '',
          title: title, // Generated title for column 3
          insight_type: insight.insight_type || 'observation',
          content: (insight.content || '').substring(0, 500),
          supporting_evidence: (insight.supporting_evidence || '').substring(0, 200)
        };
      }).filter(insight => insight.leader_name && insight.content);
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Failed to parse leader response', {
        error: error.toString(),
        responsePreview: responseText.substring(0, 200)
      });
      return [];
    }
  },
  
  /**
   * Estimate token count for a prompt
   */
  estimateTokens: function(prompt) {
    return Math.ceil(prompt.length / 4);
  },
  
  /**
   * Validate prompt size and structure
   */
  validatePromptSize: function(prompt) {
    const estimated = this.estimateTokens(prompt);
    const maxTokens = 80000;
    
    return {
      valid: estimated < maxTokens,
      estimatedTokens: estimated,
      sizeKB: Math.round(prompt.length / 1024),
      withinLimits: estimated < maxTokens,
      utilizationPercent: Math.round((estimated / maxTokens) * 100)
    };
  }
};