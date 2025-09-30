/**
 * MetricsBuilder.js - UPDATED VERSION
 * Functions for building performance metrics and key metrics for JSON export
 * Updated to match actual CSV column structure and current metric mappings
 */

const MetricsBuilder = {

  /**
   * Builds performance metrics with historical values for overall, top performers, and general votes
   * UPDATED: Uses actual metric keys from CSV data
   * @param {Array} allMetrics - All metrics from CSV
   * @param {Array} timeseriesIndex - Array of quarters in chronological order
   * @returns {Array} - Performance metrics with historical values
   */
  buildPerformanceMetrics(allMetrics, timeseriesIndex) {
    const performanceMetrics = [];
    
    // Updated to match ACTUAL metric keys from CSV
    const performanceMetricKeys = [
      'retention_intent',
      'mission_understanding', 
      'tools_resources',
      'empowerment',
      'recognition',
      'leadership_confidence',
      'satisfaction_positive' // Added this metric that exists in CSV
    ];
    
    performanceMetricKeys.forEach(metricKey => {
      const overallData = this.getMetricHistoryForLeader(allMetrics, metricKey, 'all', timeseriesIndex);
      const topPerformersData = this.getMetricHistoryForLeader(allMetrics, metricKey, 'top_performers', timeseriesIndex);
      const generalPopData = this.getMetricHistoryForLeader(allMetrics, metricKey, 'general', timeseriesIndex);
      
      if (overallData.values.length > 0) {
        performanceMetrics.push({
          metricKey: this.convertMetricKeyToSnakeCase(metricKey),
          metricName: this.getMetricDisplayName(metricKey),
          overall: {
            values: overallData.values
          },
          topPerformers: {
            values: topPerformersData.values
          },
          generalPopulation: {
            values: generalPopData.values
          }
        });
      }
    });
    
    return performanceMetrics;
  },

  /**
   * Builds key metrics (top stats, strengths, improvement areas)
   * UPDATED: Uses actual metric structure from CSV
   * @param {Array} allMetrics - All metrics from CSV
   * @param {Array} timeseriesIndex - Array of quarters in chronological order
   * @returns {Object} - Key metrics object
   */
  buildKeyMetrics(allMetrics, timeseriesIndex) {
    // Get current quarter metrics (first in timeseries)
    const currentQuarter = timeseriesIndex[0];
    const currentMetrics = allMetrics.filter(m => m.quarter === currentQuarter && m.leader === 'all');
    
    // Build top stats
    const topStats = this.buildTopStats(allMetrics, timeseriesIndex);
    
    // Build key strengths and improvement areas
    const strengths = this.identifyKeyStrengths(currentMetrics, allMetrics, timeseriesIndex);
    const improvementAreas = this.identifyImprovementAreas(currentMetrics, allMetrics, timeseriesIndex);
    
    return {
      topStats,
      esatScore: null,
      esatScoreOutOf: null,
      keyStrengths: strengths,
      improvementAreas
    };
  },

  /**
   * Gets metric history for a specific leader across all quarters
   * UNCHANGED - this method works correctly
   * @param {Array} allMetrics - All metrics
   * @param {String} metricKey - Metric key to look for
   * @param {String} leader - Leader name ('all', 'top_performers', etc.)
   * @param {Array} timeseriesIndex - Quarters in order
   * @returns {Object} - Object with values array
   */
  getMetricHistoryForLeader(allMetrics, metricKey, leader, timeseriesIndex) {
    const values = [];
    
    timeseriesIndex.forEach(quarter => {
      const metric = allMetrics.find(m => 
        m.quarter === quarter && 
        m.leader === leader && 
        m.metric_key === metricKey
      );
      
      if (metric) {
        values.push(Math.round(metric.value * 10) / 10); // Round to 1 decimal
      } else {
        // If no data for this quarter, use null or skip
        values.push(null);
      }
    });
    
    // Filter out null values for cleaner arrays
    return { values: values.filter(v => v !== null) };
  },

  /**
   * Builds top stats for key metrics section
   * UPDATED: Uses actual metric keys
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarters in order
   * @returns {Array} - Top stats array
   */
  buildTopStats(allMetrics, timeseriesIndex) {
    const topStatMetrics = [
      'total_responses',
      'retention_intent', 
      'mission_understanding',
      'overall_satisfaction' // Added this key metric from CSV
    ];
    
    return topStatMetrics.map(metricKey => {
      const history = this.getMetricHistoryForLeader(allMetrics, metricKey, 'all', timeseriesIndex);
      const displayName = this.getMetricDisplayName(metricKey);
      
      const stat = {
        label: displayName,
        values: history.values
      };
      
      // Add unit for percentage metrics (but not satisfaction score which is 1-5 scale)
      if (!metricKey.includes('total_responses') && !metricKey.includes('overall_satisfaction') && !metricKey.includes('manager_percentage')) {
        stat.unit = '%';
      }
      
      return stat;
    }).filter(stat => stat.values.length > 0);
  },

  /**
   * Identifies key strengths from current metrics
   * UNCHANGED - logic works correctly
   * @param {Array} currentMetrics - Current quarter metrics for 'all'
   * @param {Array} allMetrics - All historical metrics
   * @param {Array} timeseriesIndex - Quarters in order
   * @returns {Array} - Key strengths array
   */
  identifyKeyStrengths(currentMetrics, allMetrics, timeseriesIndex) {
    // Sort metrics by value (descending) to find top performers
    const sortedMetrics = currentMetrics
      .filter(m => !['manager_percentage', 'total_responses', 'overall_satisfaction'].includes(m.metric_key))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Top 3
    
    return sortedMetrics.map(metric => {
      const history = this.getMetricHistoryForLeader(allMetrics, metric.metric_key, 'all', timeseriesIndex);
      
      return {
        description: metric.metric_name.toLowerCase(),
        context: 'strong performance indicator',
        values: history.values
      };
    });
  },

  /**
   * Identifies improvement areas from current metrics
   * UNCHANGED - logic works correctly
   * @param {Array} currentMetrics - Current quarter metrics for 'all'
   * @param {Array} allMetrics - All historical metrics
   * @param {Array} timeseriesIndex - Quarters in order
   * @returns {Array} - Improvement areas array
   */
  identifyImprovementAreas(currentMetrics, allMetrics, timeseriesIndex) {
    // Sort metrics by value (ascending) to find lowest performers
    const sortedMetrics = currentMetrics
      .filter(m => !['manager_percentage', 'total_responses', 'overall_satisfaction'].includes(m.metric_key))
      .sort((a, b) => a.value - b.value)
      .slice(0, 2); // Bottom 2
    
    return sortedMetrics.map(metric => {
      const history = this.getMetricHistoryForLeader(allMetrics, metric.metric_key, 'all', timeseriesIndex);
      
      return {
        description: metric.metric_name.toLowerCase(),
        context: 'requires attention and improvement',
        priority: metric.value < 30 ? 'critical' : 'high',
        impact: 'high',
        values: history.values
      };
    });
  },

  /**
   * Converts metric key to snake_case for JSON output
   * UPDATED: Uses actual metric keys from CSV
   * @param {String} metricKey - Original metric key
   * @returns {String} - Snake case version
   */
  convertMetricKeyToSnakeCase(metricKey) {
    const conversions = {
      'retention_intent': 'see_themselves_here_next_year',
      'mission_understanding': 'understand_mission_and_role',
      'tools_resources': 'have_tools_and_resources',
      'empowerment': 'feel_empowered_to_make_decisions',
      'recognition': 'feel_recognized_for_contributions',
      'leadership_confidence': 'confidence_in_leadership',
      'satisfaction_positive': 'satisfaction_positive_responses',
      'overall_satisfaction': 'overall_satisfaction_score'
    };
    
    return conversions[metricKey] || metricKey;
  },

  /**
   * Gets display name for metric key
   * UPDATED: Matches actual metric names from CSV
   * @param {String} metricKey - Metric key
   * @returns {String} - Human readable name
   */
  getMetricDisplayName(metricKey) {
    const displayNames = {
      'total_responses': 'Total Survey Responses',
      'retention_intent': 'Retention Intent',
      'mission_understanding': 'Mission Alignment',
      'tools_resources': 'Resources',
      'empowerment': 'Empowerment',
      'recognition': 'Recognition',
      'leadership_confidence': 'Leadership Confidence',
      'overall_satisfaction': 'Overall Satisfaction (ESAT Score)',
      'satisfaction_positive': 'Satisfaction - % Positive Responses',
      'manager_percentage': 'Manager Percentage'
    };
    
    return displayNames[metricKey] || metricKey;
  },

  /**
   * Calculates delta between two quarters for a specific metric
   * UNCHANGED - works correctly
   * @param {Array} allMetrics - All metrics
   * @param {String} currentQuarter - Current quarter
   * @param {String} previousQuarter - Previous quarter
   * @param {String} metricKey - Metric to compare
   * @param {String} leader - Leader name (default 'all')
   * @returns {Number} - Delta value (current - previous)
   */
  calculateDelta(allMetrics, currentQuarter, previousQuarter, metricKey, leader = 'all') {
    const currentMetric = allMetrics.find(m => 
      m.quarter === currentQuarter && 
      m.leader === leader && 
      m.metric_key === metricKey
    );
    
    const previousMetric = allMetrics.find(m => 
      m.quarter === previousQuarter && 
      m.leader === leader && 
      m.metric_key === metricKey
    );
    
    if (!currentMetric || !previousMetric) return 0;
    
    return Math.round((currentMetric.value - previousMetric.value) * 10) / 10;
  }
};