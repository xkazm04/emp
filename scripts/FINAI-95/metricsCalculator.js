/**
 * Quantitative Metrics Calculator - Fixed Version
 * REMOVED: Separate top performer segment generation to prevent duplicate rows
 * Top performer data is already included in the regular metric rows via calculateMetric function
 */

const MetricsCalculator = {
  
  /**
   * Calculates all quantitative metrics from survey data
   * @param {Array} surveyData - Cleaned survey response data
   * @param {String} quarterId - Quarter identifier
   * @returns {Object} - Calculated metrics and cleaned data
   */
  calculateAllMetrics(surveyData, quarterId) {
    try {
      logMessage(LOGGER.INFO, `Calculating metrics for ${surveyData.length} responses`);
      
      // Clean and validate data first
      const cleanData = this.cleanSurveyData(surveyData);
      
      // Calculate unified metrics (overall + by leader only - NO separate top performer rows)
      const unifiedMetrics = this.calculateUnifiedMetrics(cleanData, quarterId);
      
      logMessage(LOGGER.INFO, `Calculated ${unifiedMetrics.length} unified metrics`);
      
      return {
        metrics: unifiedMetrics,
        segmentMetrics: [], // Deprecated - keeping for backward compatibility
        cleanedData: cleanData
      };
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Metrics calculation failed', { error: error.toString() });
      throw error;
    }
  },
  
  /**
   * Cleans and standardizes survey data
   * @param {Array} surveyData - Raw survey data
   * @returns {Array} - Cleaned data with standardized fields
   */
  cleanSurveyData(surveyData) {
    logMessage(LOGGER.INFO, `Starting to clean ${surveyData.length} survey responses`);
    
    let topPerformersCount = 0;
    let managerFoundCount = 0;
    
    const cleaned = surveyData.map((response, index) => {
      const cleaned = {};
      
      // Standardize all fields
      Object.keys(response).forEach(key => {
        const cleanKey = key.trim();
        let value = response[key];
        
        // Standardize null/empty values
        if (value === null || value === undefined || value === '') {
          value = null;
        } else if (typeof value === 'string') {
          value = value.trim();
        }
        
        cleaned[cleanKey] = value;
      });
      
      // Add computed fields using MetricsParsers
      cleaned._isTopPerformer = MetricsParsers.parseTopPerformerStatus(cleaned);
      cleaned._satisfactionScore = MetricsParsers.parseSatisfactionScore(cleaned);
      cleaned._toolsScore = MetricsParsers.parseToolsScore(cleaned);
      cleaned._steamLeader = MetricsParsers.parseLeaderName(cleaned);
      cleaned._department = MetricsParsers.parseDepartment(cleaned);
      cleaned._retentionIntent = MetricsParsers.parseRetentionIntent(cleaned);
      cleaned._missionUnderstanding = MetricsParsers.parseMissionUnderstanding(cleaned);
      cleaned._leadershipConfidence = MetricsParsers.parseLeadershipConfidence(cleaned);
      cleaned._empowerment = MetricsParsers.parseEmpowerment(cleaned);
      cleaned._ideasValued = MetricsParsers.parseIdeasValued(cleaned);
      cleaned._recognition = MetricsParsers.parseRecognition(cleaned);
      
      // Debug logging for first few responses
      if (index < 5) {
        logMessage(LOGGER.DEBUG, `Response ${index}: isTopPerformer=${cleaned._isTopPerformer}`);
      }
      
      // Count top performers
      if (cleaned._isTopPerformer === true) {
        topPerformersCount++;
      }
      
      return cleaned;
    }).filter(response => {
      // Filter out completely empty responses
      return Object.values(response).some(value => 
        value !== null && value !== undefined && value !== ''
      );
    });
    
    logMessage(LOGGER.INFO, `Identified ${topPerformersCount} top performers from column B`);
    
    return cleaned;
  },
  
  /**
   * FIXED: Calculates unified metrics (overall + per leader ONLY)
   * REMOVED: Separate top performer segment creation to prevent duplicate rows
   * Top performer data is already included within each metric via calculateMetric function
   * @param {Array} cleanData - Cleaned survey data
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Array of unified metric objects
   */
  calculateUnifiedMetrics(cleanData, quarterId) {
    const metrics = [];
    
    // Calculate overall metrics (leader = "all")
    const overallMetrics = this.calculateMetricsForSegment(cleanData, quarterId, "all");
    metrics.push(...overallMetrics);
    
    
    // Calculate metrics by leader (top performer data included within each leader's metrics)
    const leaderGroups = MetricsParsers.groupBy(cleanData, '_steamLeader');
    Object.keys(leaderGroups).forEach(leaderName => {
      if (leaderName && leaderName !== 'null' && leaderName !== 'undefined') {
        const leaderData = leaderGroups[leaderName];
        // Only include leaders with meaningful sample sizes (3+ responses)
        if (leaderData.length >= 3) {
          const leaderMetrics = this.calculateMetricsForSegment(leaderData, quarterId, leaderName);
          metrics.push(...leaderMetrics);
          
          // REMOVED: Separate top performer rows for each leader
          // Top performer data is already included in the leader's regular metrics
        }
      }
    });
    
    return metrics;
  },
  
  /**
   * Reusable function to calculate a metric for a segment
   * This function ALREADY includes top performer data in each row
   * @param {Array} segmentData - Data for this segment
   * @param {String} fieldName - Field name to extract values from
   * @param {String} calculationType - Type of calculation
   * @returns {Object} - Calculated metric data with proper top_performers values
   */
  calculateMetric(segmentData, fieldName, calculationType) {
    const data = segmentData.filter(r => r[fieldName] !== null);
    if (data.length === 0) {
      return { value: 0, topPerformersValue: 0, topPerformersCount: 0, totalResponses: 0 };
    }
    
    const topPerformersData = data.filter(r => r._isTopPerformer === true);
    
    let value = 0;
    let topPerformersValue = 0; // This will be the PERCENTAGE for Column G
    let calculationNote = '';
    
    switch (calculationType) {
      case 'percentage_yes_no':
        const positiveResponses = data.filter(r => MetricsParsers.isPositiveResponse(r[fieldName])).length;
        value = (positiveResponses / data.length) * 100;
        
        if (topPerformersData.length > 0) {
          const topPerformersPositive = topPerformersData.filter(r => MetricsParsers.isPositiveResponse(r[fieldName])).length;
          topPerformersValue = (topPerformersPositive / topPerformersData.length) * 100;
        }
        calculationNote = '% of positive responses (Yes responses)';
        break;
        
      case 'percentage_1_2_scale':
        const positiveNumeric = data.filter(r => MetricsParsers.isPositiveNumericResponse(r[fieldName])).length;
        value = (positiveNumeric / data.length) * 100;
        
        if (topPerformersData.length > 0) {
          const topPerformersPositiveNumeric = topPerformersData.filter(r => MetricsParsers.isPositiveNumericResponse(r[fieldName])).length;
          topPerformersValue = (topPerformersPositiveNumeric / topPerformersData.length) * 100;
        }
        calculationNote = '% of responses with 4-5 on scale of 1-5 ratings';
        break;
        
      case 'percentage_confidence':
        // Special handling for confidence which can be numeric or text
        let positiveConfidence = 0;
        
        const numericResponses = data.filter(r => {
          const parsed = parseInt(r[fieldName]);
          return !isNaN(parsed) && parsed >= 1 && parsed <= 5;
        });
        
        if (numericResponses.length > data.length * 0.5) {
          // Majority are numeric - use 4-5 as positive
          positiveConfidence = data.filter(r => MetricsParsers.isPositiveNumericResponse(r[fieldName])).length;
          calculationNote = '% of responses with 4-5 on scale of 1-5 ratings';
          
          if (topPerformersData.length > 0) {
            const topPerformersPositiveNumeric = topPerformersData.filter(r => MetricsParsers.isPositiveNumericResponse(r[fieldName])).length;
            topPerformersValue = (topPerformersPositiveNumeric / topPerformersData.length) * 100;
          }
        } else {
          // Use text-based confidence responses
          positiveConfidence = data.filter(r => MetricsParsers.isConfidentResponse(r[fieldName])).length;
          calculationNote = '% answering confidently (Confident + Very Confident)';
          
          if (topPerformersData.length > 0) {
            const topPerformersConfident = topPerformersData.filter(r => MetricsParsers.isConfidentResponse(r[fieldName])).length;
            topPerformersValue = (topPerformersConfident / topPerformersData.length) * 100;
          }
        }
        
        value = (positiveConfidence / data.length) * 100;
        break;
        
      case 'average':
        const scores = data.map(r => r[fieldName]).filter(v => v !== null);
        if (scores.length > 0) {
          value = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
        
        if (topPerformersData.length > 0) {
          const topPerformersScores = topPerformersData.map(r => r[fieldName]).filter(v => v !== null);
          if (topPerformersScores.length > 0) {
            topPerformersValue = topPerformersScores.reduce((sum, score) => sum + score, 0) / topPerformersScores.length;
          }
        }
        calculationNote = 'Average of 1-5 scale responses';
        break;
    }
    
    return {
      value: Math.round(value * 10) / 10,
      topPerformersValue: Math.round(topPerformersValue * 10) / 10, // Column G: percentage
      topPerformersCount: topPerformersData.length, // Column H: count
      totalResponses: data.length,
      calculationNote: calculationNote
    };
  },
  
  /**
   * Helper to create a metric object with correct column mapping
   * @param {String} quarterId - Quarter identifier
   * @param {String} leaderName - Leader name
   * @param {String} metricKey - Metric key
   * @param {String} metricName - Metric display name
   * @param {Object} metricData - Calculated metric data
   * @param {Array} segmentData - Segment data for additional counts
   * @param {String} category - Metric category
   * @returns {Object} - Complete metric object
   */
  createMetricObject(quarterId, leaderName, metricKey, metricName, metricData, segmentData, category) {
    const totalTopPerformers = segmentData.filter(r => r._isTopPerformer === true).length;
    const totalNonTopPerformers = segmentData.length - totalTopPerformers;
    
    return {
      quarter: quarterId,
      leader: leaderName,
      metric_key: metricKey,
      metric_name: metricName,
      value: metricData.value,
      total_responses: metricData.totalResponses,
      top_performers_percentage: metricData.topPerformersValue, // Column G: percentage of top performers agreeing
      total_responses_managers: metricData.topPerformersCount, // Column H: count of top performers (was managers)
      total_responses_ics: totalNonTopPerformers, // Column I: count of non-top performers (was ICs)
      category: category,
      calculation_note: metricData.calculationNote
    };
  },
  
  /**
   * Calculates all metrics for a specific segment
   * Each metric row ALREADY contains top performer data in columns G and H
   * @param {Array} segmentData - Data for this segment
   * @param {String} quarterId - Quarter identifier  
   * @param {String} leaderName - Leader name or "all" for overall
   * @returns {Array} - Metrics for this segment
   */
  calculateMetricsForSegment(segmentData, quarterId, leaderName) {
    const metrics = [];
    const totalCount = segmentData.length;
    const topPerformersCount = segmentData.filter(r => r._isTopPerformer === true).length;
    const nonTopPerformersCount = totalCount - topPerformersCount;
    
    if (totalCount === 0) return metrics;
    
    // Define all metrics with their configurations
    const metricConfigs = [
      {
        key: 'overall_satisfaction',
        name: 'Overall Satisfaction (ESAT Score)',
        field: '_satisfactionScore',
        calculationType: 'average',
        category: 'satisfaction'
      },
      {
        key: 'satisfaction_positive',
        name: 'Satisfaction - % Positive Responses',
        field: '_satisfactionScore',
        calculationType: 'percentage_1_2_scale',
        category: 'satisfaction'
      },
      {
        key: 'retention_intent',
        name: 'Retention Intent',
        field: '_retentionIntent',
        calculationType: 'percentage_yes_no',
        category: 'retention'
      },
      {
        key: 'mission_understanding',
        name: 'Mission Alignment',
        field: '_missionUnderstanding',
        calculationType: 'percentage_yes_no',
        category: 'engagement'
      },
      {
        key: 'leadership_confidence',
        name: 'Leadership Confidence',
        field: '_leadershipConfidence',
        calculationType: 'percentage_confidence',
        category: 'engagement'
      },
      {
        key: 'tools_resources',
        name: 'Resources',
        field: '_toolsScore',
        calculationType: 'percentage_1_2_scale',
        category: 'engagement'
      },
      {
        key: 'empowerment',
        name: 'Empowerment',
        field: '_empowerment',
        calculationType: 'percentage_yes_no',
        category: 'engagement'
      },
      {
        key: 'ideas_valued',
        name: 'Value of Ideas',
        field: '_ideasValued',
        calculationType: 'percentage_yes_no',
        category: 'engagement'
      },
      {
        key: 'recognition',
        name: 'Recognition',
        field: '_recognition',
        calculationType: 'percentage_yes_no',
        category: 'engagement'
      }
    ];
    
    // Calculate all configured metrics using reusable function
    // Each metric ALREADY includes top performer data within the row
    metricConfigs.forEach(config => {
      const metricData = this.calculateMetric(segmentData, config.field, config.calculationType);
      if (metricData.totalResponses > 0) {
        const metricObject = this.createMetricObject(
          quarterId, leaderName, config.key, config.name, 
          metricData, segmentData, config.category
        );
        metrics.push(metricObject);
      }
    });
    
    // Add response volume metric (special case)
    metrics.push({
      quarter: quarterId,
      leader: leaderName,
      metric_key: 'total_responses',
      metric_name: 'Total Survey Responses',
      value: totalCount,
      total_responses: totalCount,
      top_performers_percentage: topPerformersCount, // For count metrics, show the actual count
      total_responses_managers: topPerformersCount, // Count of top performers
      total_responses_ics: nonTopPerformersCount, // Count of non-top performers
      category: 'demographic',
      calculation_note: 'Total completed surveys'
    });
    
    return metrics;
  }
};