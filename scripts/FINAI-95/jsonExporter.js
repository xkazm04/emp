/**
 * JSON Exporter for Survey Results - COMPLETE UPDATED VERSION
 * Updated with title support and corrected CSV column mappings
 */

const JSONExporter = {
  
  /**
   * Generates survey JSON file and saves it to Drive
   * @param {Object} params - Export parameters
   * @returns {Object} - Export result with success/failure info
   */
  generateSurveyJsonFile(params) {
    try {
      logMessage(LOGGER.INFO, 'Starting JSON file generation', params);
      
      // Get the active spreadsheet
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      
      // Read metrics data from the spreadsheet
      const allMetrics = SheetProcessor.readSheetAsObjects(spreadsheet, 'metrics');
      
      if (!allMetrics || allMetrics.length === 0) {
        throw new Error('No metrics data found. Please process survey data first.');
      }
      
      // Create quarter ID
      const quarterId = `${params.quarter} ${params.year}`;
      
      // Export to JSON
      const jsonData = this.exportToJson(quarterId, allMetrics);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `survey_data_${params.quarter}_${params.year}_${timestamp}.json`;
      
      // Create JSON file content
      const jsonContent = JSON.stringify(jsonData, null, 2);
      
      // Save to Drive
      const folder = DriveApp.getFolderById(params.outputFolderId);
      const file = folder.createFile(fileName, jsonContent, 'application/json');
      
      logMessage(LOGGER.INFO, 'JSON file created successfully', { 
        fileName, 
        fileId: file.getId(),
        size: jsonContent.length 
      });
      
      return {
        success: true,
        message: `JSON export completed successfully`,
        fileName: fileName,
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        quartersIncluded: quarterId
      };
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'JSON file generation failed', { error: error.toString() });
      return {
        success: false,
        message: error.message,
        details: error.toString()
      };
    }
  },
  
  /**
   * Exports survey data to JSON format with historical metrics
   * @param {String} quarterId - Current quarter identifier
   * @param {Array} allMetrics - All metrics from CSV (historical + current)
   * @returns {Object} - Complete JSON export object
   */
  exportToJson(quarterId, allMetrics) {
    try {
      logMessage(LOGGER.INFO, `Exporting JSON for quarter ${quarterId}`);
      
      // Build timeseries index from available quarters
      const timeseriesIndex = this.buildTimeseriesIndex(allMetrics);
      
      // Get current quarter metrics
      const currentQuarter = timeseriesIndex[0]; // Most recent
      const currentMetrics = allMetrics.filter(m => m.quarter === currentQuarter);
      
      // Build basic JSON structure
      const jsonOutput = {
        metadata: this.buildMetadata(quarterId, allMetrics, timeseriesIndex),
        timeseriesIndex: timeseriesIndex,
        executiveSummary: null, // Will be populated by LLM
        keyMetrics: MetricsBuilder.buildKeyMetrics(allMetrics, timeseriesIndex),
        performanceMetrics: MetricsBuilder.buildPerformanceMetrics(allMetrics, timeseriesIndex),
        qualitativeInsights: this.buildQualitativeInsights(quarterId),
        leaders: this.buildLeaderMetrics(allMetrics, timeseriesIndex),
        comparison: this.buildComparison(allMetrics, timeseriesIndex)
      };
      
      // Generate executive summary using LLM
      try {
        logMessage(LOGGER.INFO, 'Generating executive summary via LLM');
        jsonOutput.executiveSummary = JSONPostprocessor.generateExecutiveSummary(jsonOutput);
      } catch (error) {
        logMessage(LOGGER.WARN, 'Executive summary generation failed, skipping', { error: error.toString() });
        jsonOutput.executiveSummary = null;
      }
      
      // Generate leader narratives using LLM
      if (jsonOutput.leaders && jsonOutput.leaders.length > 0) {
        jsonOutput.leaders.forEach((leader, index) => {
          try {
            logMessage(LOGGER.INFO, `Generating narrative for leader: ${leader.name}`);
            
            // Prepare payload for leader narrative
            const leaderPayload = {
              leader: leader.name,
              quarter: currentQuarter,
              previousQuarter: timeseriesIndex[1] || null,
              keyStats: leader.keyStats,
              metrics: leader.metrics,
              insights: leader.insights || [],
              bullets: [] // Keep for backward compatibility
            };
            
            logMessage(LOGGER.DEBUG, `Leader payload prepared for ${leader.name}`, {
              hasKeyStats: !!leaderPayload.keyStats,
              metricsCount: leaderPayload.metrics ? leaderPayload.metrics.length : 0,
              insightsCount: leaderPayload.insights ? leaderPayload.insights.length : 0
            });
            
            const narrative = JSONPostprocessor.generateLeaderNarrative(leaderPayload);
            jsonOutput.leaders[index].narrative = narrative;
            
            logMessage(LOGGER.INFO, `Successfully assigned narrative for ${leader.name}`, {
              narrativeAssigned: !!jsonOutput.leaders[index].narrative,
              hasSummary: narrative && narrative.summary ? true : false
            });
            
          } catch (error) {
            logMessage(LOGGER.ERROR, `Leader narrative generation failed for ${leader.name}`, { 
              errorMessage: error.message,
              errorType: error.constructor ? error.constructor.name : 'Unknown',
              errorStack: error.stack ? error.stack.substring(0, 500) : 'No stack trace',
              errorString: error.toString()
            });
            jsonOutput.leaders[index].narrative = null;
          }
        });
      }
      
      logMessage(LOGGER.INFO, 'JSON export completed successfully');
      return jsonOutput;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'JSON export failed', { error: error.toString() });
      throw error;
    }
  },
  
  /**
   * Builds timeseries index from available quarters in chronological order (newest first)
   * @param {Array} allMetrics - All metrics data
   * @returns {Array} - Sorted array of quarters
   */
  buildTimeseriesIndex(allMetrics) {
    const quarters = [...new Set(allMetrics.map(m => m.quarter))];
    
    // Sort quarters chronologically (newest first for timeseries display)
    return quarters.sort((a, b) => {
      // Assuming format like "Q1 2025", "Q2 2025" or "Q1_2025", "Q2_2025"
      const [periodA, yearA] = a.replace('_', ' ').split(' ');
      const [periodB, yearB] = b.replace('_', ' ').split(' ');
      
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA); // Newer years first
      }
      
      const quarterA = parseInt(periodA.replace('Q', ''));
      const quarterB = parseInt(periodB.replace('Q', ''));
      return quarterB - quarterA; // Newer quarters first within same year
    });
  },
  
  /**
   * Builds metadata section
   * @param {String} quarterId - Current quarter
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Object} - Metadata object
   */
  buildMetadata(quarterId, allMetrics, timeseriesIndex) {
    const currentQuarter = timeseriesIndex[0];
    const previousQuarter = timeseriesIndex[1] || null;
    
    const currentTotal = this.getTotalResponses(allMetrics, currentQuarter);
    const previousTotal = previousQuarter ? this.getTotalResponses(allMetrics, previousQuarter) : null;
    
    return {
      quarter: currentQuarter,
      surveyTitle: "Employee Survey",
      generatedDate: new Date().toISOString().split('T')[0],
      totalResponses: currentTotal,
      responseRatePercent: null,
      previousQuarter: previousQuarter,
      previousTotalResponses: previousTotal,
      previousResponseRate: null
    };
  },
  
  /**
   * Gets total responses for a quarter
   * @param {Array} allMetrics - All metrics
   * @param {String} quarter - Quarter to look for
   * @returns {Number} - Total responses
   */
  getTotalResponses(allMetrics, quarter) {
    const totalMetric = allMetrics.find(m => 
      m.quarter === quarter && 
      m.leader === 'all' && 
      m.metric_key === 'total_responses'
    );
    
    return totalMetric ? totalMetric.value : 0;
  },
  
  /**
   * Builds qualitative insights from qualitative_insights sheet
   * UPDATED: Now includes title field and removes unwanted attributes
   * @param {String} quarterId - Current quarter identifier
   * @returns {Array} - Structured qualitative insights with title and cleaned structure
   */
  buildQualitativeInsights(quarterId) {
    try {
      logMessage(LOGGER.INFO, `Building qualitative insights for quarter: ${quarterId}`);
      
      // Get the active spreadsheet to read qualitative insights
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const qualitativeData = SheetProcessor.readSheetAsObjects(spreadsheet, 'qualitative_insights');
      
      logMessage(LOGGER.INFO, `Found ${qualitativeData ? qualitativeData.length : 0} total qualitative records`);
      
      if (!qualitativeData || qualitativeData.length === 0) {
        logMessage(LOGGER.WARN, 'No qualitative insights data found in qualitative_insights sheet');
        return [];
      }
      
      // Debug: Log all unique quarters found in the data
      const uniqueQuarters = [...new Set(qualitativeData.map(row => row.quarter))];
      logMessage(LOGGER.INFO, `Available quarters in qualitative data: [${uniqueQuarters.join(', ')}]`);
      logMessage(LOGGER.INFO, `Target quarter: "${quarterId}"`);
      
      // Filter for current quarter - use strict matching to prevent Q2/Q3 confusion
      // Normalize both sides by replacing underscores with spaces and converting to uppercase
      const normalizeQuarter = (q) => {
        return q ? q.toString().trim().toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ') : '';
      };
      
      const targetQuarterNormalized = normalizeQuarter(quarterId);
      logMessage(LOGGER.INFO, `Normalized target quarter: "${targetQuarterNormalized}"`);
      
      let currentQuarterInsights = qualitativeData.filter(insight => {
        const recordQuarterNormalized = normalizeQuarter(insight.quarter);
        const matches = recordQuarterNormalized === targetQuarterNormalized;
        
        if (matches) {
          logMessage(LOGGER.DEBUG, `Match found: "${insight.quarter}" normalized to "${recordQuarterNormalized}" matches target "${targetQuarterNormalized}"`);
        }
        
        return matches;
      });
      
      logMessage(LOGGER.INFO, `Found ${currentQuarterInsights.length} insights after filtering`);
      
      if (currentQuarterInsights.length === 0) {
        logMessage(LOGGER.WARN, `No qualitative insights found for quarter "${quarterId}". Available quarters: [${uniqueQuarters.join(', ')}]`);
        return [];
      }
      
      // Structure the data with UPDATED format - include title, remove unwanted attributes
      const structuredInsights = currentQuarterInsights.map(insight => {
        // Parse sample responses if they exist
        let sampleResponses = [];
        if (insight.sample_responses && typeof insight.sample_responses === 'string') {
          try {
            // Try to parse as array or split by delimiter
            if (insight.sample_responses.startsWith('[')) {
              sampleResponses = JSON.parse(insight.sample_responses);
            } else {
              // Split by common delimiters and clean up
              sampleResponses = insight.sample_responses
                .split(/[|\n;]/)
                .map(s => s.trim())
                .filter(s => s.length > 5) // Filter out very short responses
                .slice(0, 3); // Keep top 3 examples
            }
          } catch (e) {
            // If parsing fails, treat as single response
            sampleResponses = [insight.sample_responses.substring(0, 200)];
          }
        }
        
        // UPDATED structure - includes title, removes insightType, rank, questionReference
        const structuredInsight = {
          title: insight.title || insight.content.substring(0, 50) || 'Untitled Insight', // Column D
          category: insight.category || 'general',
          content: insight.content || '',
          timeseries: {
            [quarterId]: {
              frequency: parseInt(insight.frequency) || 0
            }
          },
          sampleResponses: sampleResponses
        };
        
        return structuredInsight;
      }).sort((a, b) => {
        // Sort by frequency descending
        const aFreq = a.timeseries[quarterId]?.frequency || 0;
        const bFreq = b.timeseries[quarterId]?.frequency || 0;
        return bFreq - aFreq;
      });
      
      logMessage(LOGGER.INFO, `Successfully built ${structuredInsights.length} structured qualitative insights with titles`);
      
      // Log first insight as example
      if (structuredInsights.length > 0) {
        const sample = structuredInsights[0];
        logMessage(LOGGER.DEBUG, `Sample insight: "${sample.title}" - ${sample.category} - "${sample.content.substring(0, 100)}..." (${sample.sampleResponses.length} examples)`);
      }
      
      return structuredInsights;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Error building qualitative insights', { error: error.toString(), stack: error.stack });
      return [];
    }
  },
  
  /**
   * Builds leader metrics with historical values and LLM-generated narratives
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Array} - Leader metrics array
   */
  buildLeaderMetrics(allMetrics, timeseriesIndex) {
    const leaders = [];
    
    // Get all unique leaders (excluding 'all', 'top_performers', 'general')
    const leaderNames = [...new Set(allMetrics.map(m => m.leader))]
      .filter(leader => 
        leader !== 'all' && 
        leader !== 'top_performers' && 
        leader !== 'general' &&
        !leader.includes('_top_performers')
      );
    
    leaderNames.forEach(leaderName => {
      const leaderData = this.buildSingleLeaderMetrics(leaderName, allMetrics, timeseriesIndex);
      if (leaderData) {
        leaders.push(leaderData);
      }
    });
    
    return leaders;
  },
  
  /**
   * Builds metrics for a single leader
   * @param {String} leaderName - Leader name
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Object} - Leader metrics object
   */
  buildSingleLeaderMetrics(leaderName, allMetrics, timeseriesIndex) {
    const currentQuarter = timeseriesIndex[0];
    const leaderMetrics = allMetrics.filter(m => m.leader === leaderName);
    
    if (leaderMetrics.length === 0) return null;
    
    // Check if leader has metrics for current quarter - if not, exclude from export
    const currentQuarterMetrics = allMetrics.filter(m => m.leader === leaderName && m.quarter === currentQuarter);
    if (currentQuarterMetrics.length === 0) {
      logMessage(LOGGER.INFO, `Excluding leader ${leaderName} - no metrics for current quarter ${currentQuarter}`);
      return null;
    }
    
    // Build key stats with historical values
    const keyStats = this.buildLeaderKeyStats(leaderName, allMetrics, timeseriesIndex);
    
    // Build all metrics for this leader
    const metrics = this.buildLeaderAllMetrics(leaderName, allMetrics, timeseriesIndex);
    
    // Build leader insights with title field
    const leaderInsights = this.buildLeaderInsights(leaderName, currentQuarter);
    
    // Generate leader ID
    const leaderId = leaderName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    
    return {
      id: leaderId,
      name: leaderName,
      teamType: "mixed", // Default - could be enhanced based on data
      keyStats,
      metrics,
      insights: leaderInsights, // Leader-specific insights with titles
      narrative: null // Will be populated by LLM in exportToJson
    };
  },
  
  /**
   * Builds leader insights with title field from leader_insights sheet
   * @param {String} leaderName - Leader name
   * @param {String} currentQuarter - Current quarter
   * @returns {Array} - Leader insights with title field
   */
  buildLeaderInsights(leaderName, currentQuarter) {
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const leaderInsightsData = SheetProcessor.readSheetAsObjects(spreadsheet, 'leader_insights');
      
      if (!leaderInsightsData || leaderInsightsData.length === 0) {
        logMessage(LOGGER.WARN, `No leader insights data found for ${leaderName}`);
        return [];
      }
      
      // Filter for this leader and quarter
      const leaderSpecificInsights = leaderInsightsData.filter(insight => {
        const recordQuarter = insight.quarter ? insight.quarter.toString().trim() : '';
        const recordLeader = insight.leader_name ? insight.leader_name.toString().trim() : '';
        const targetQuarter = currentQuarter.toString().trim();
        
        // Match leader name and quarter (with flexible quarter matching)
        const quarterMatch = recordQuarter === targetQuarter || 
                           recordQuarter.replace(/_/g, ' ') === targetQuarter ||
                           recordQuarter.replace(/\s+/g, '_') === targetQuarter.replace(/\s+/g, '_');
        
        return recordLeader === leaderName && quarterMatch;
      });
      
      if (leaderSpecificInsights.length === 0) {
        logMessage(LOGGER.INFO, `No insights found for leader ${leaderName} in quarter ${currentQuarter}`);
        return [];
      }
      
      // Structure the insights with title field
      const structuredInsights = leaderSpecificInsights.map(insight => ({
        title: insight.title || insight.content.substring(0, 50) || 'Leadership Insight', // Column C
        insightType: insight.insight_type || 'observation',
        content: insight.content || '',
        supportingEvidence: insight.supporting_evidence || ''
      }));
      
      logMessage(LOGGER.INFO, `Built ${structuredInsights.length} insights for leader ${leaderName} with titles`);
      return structuredInsights;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, `Error building leader insights for ${leaderName}`, { error: error.toString() });
      return [];
    }
  },
  
  /**
   * Builds key stats for a leader with historical values including top performer data
   * UPDATED: Uses correct CSV column names (top_values instead of top_performers_percentage)
   * @param {String} leaderName - Leader name
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Object} - Key stats object
   */
  buildLeaderKeyStats(leaderName, allMetrics, timeseriesIndex) {
    const keyStatMetrics = [
      'retention_intent',
      'leadership_confidence', 
      'tools_resources',
      'empowerment',
      'recognition'
    ];
    
    const keyStats = {};
    
    keyStatMetrics.forEach(metricKey => {
      const regularHistory = MetricsBuilder.getMetricHistoryForLeader(allMetrics, metricKey, leaderName, timeseriesIndex);
      
      // Look for top performer data using correct column structure
      const leaderMetricsWithTopData = allMetrics.filter(m => 
        m.leader === leaderName && 
        m.metric_key === metricKey &&
        m.top_values !== null && 
        m.top_values !== undefined
      );
      
      const topPerformerValues = [];
      timeseriesIndex.forEach(quarter => {
        const metric = leaderMetricsWithTopData.find(m => m.quarter === quarter);
        if (metric && metric.top_values !== null) {
          topPerformerValues.push(Math.round(metric.top_values * 10) / 10);
        }
      });
      
      if (regularHistory.values.some(v => v !== null)) {
        const statKey = this.getKeyStatName(metricKey);
        keyStats[statKey] = {
          unit: "%",
          values: regularHistory.values.filter(v => v !== null),
          topPerformerValues: topPerformerValues.filter(v => v !== null)
        };
      }
    });
    
    return keyStats;
  },
  
  /**
   * Builds all metrics for a leader with historical values
   * @param {String} leaderName - Leader name
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Array} - All metrics array
   */
  buildLeaderAllMetrics(leaderName, allMetrics, timeseriesIndex) {
    const metrics = [];
    
    // Get all metric keys for this leader
    const leaderMetrics = allMetrics.filter(m => m.leader === leaderName);
    const metricKeys = [...new Set(leaderMetrics.map(m => m.metric_key))];
    
    metricKeys.forEach(metricKey => {
      const history = MetricsBuilder.getMetricHistoryForLeader(allMetrics, metricKey, leaderName, timeseriesIndex);
      const displayKey = MetricsBuilder.convertMetricKeyToSnakeCase(metricKey);
      const displayName = MetricsBuilder.getMetricDisplayName(metricKey);
      
      if (history.values.some(v => v !== null)) {
        metrics.push({
          metricKey: displayKey,
          metricName: displayName,
          values: history.values.filter(v => v !== null)
        });
      }
    });
    
    return metrics;
  },
  
  /**
   * Builds comparison section with deltas
   * @param {Array} allMetrics - All metrics
   * @param {Array} timeseriesIndex - Quarter order
   * @returns {Object} - Comparison object
   */
  buildComparison(allMetrics, timeseriesIndex) {
    const currentQuarter = timeseriesIndex[0];
    const previousQuarter = timeseriesIndex[1];
    
    if (!previousQuarter) {
      return {
        index: [currentQuarter],
        deltas: {}
      };
    }
    
    const currentTotal = this.getTotalResponses(allMetrics, currentQuarter);
    const previousTotal = this.getTotalResponses(allMetrics, previousQuarter);
    
    const currentRetention = this.getMetricValue(allMetrics, currentQuarter, 'retention_intent', 'all');
    const previousRetention = this.getMetricValue(allMetrics, previousQuarter, 'retention_intent', 'all');
    
    const currentMission = this.getMetricValue(allMetrics, currentQuarter, 'mission_understanding', 'all');
    const previousMission = this.getMetricValue(allMetrics, previousQuarter, 'mission_understanding', 'all');
    
    return {
      index: [currentQuarter, previousQuarter],
      deltas: {
        total_survey_responses_pp: currentTotal - previousTotal,
        see_themselves_here_next_year_pp: currentRetention - previousRetention,
        understand_mission_and_role_pp: currentMission - previousMission
      }
    };
  },
  
  /**
   * Gets a specific metric value
   * @param {Array} allMetrics - All metrics
   * @param {String} quarter - Quarter
   * @param {String} metricKey - Metric key
   * @param {String} leader - Leader name
   * @returns {Number} - Metric value
   */
  getMetricValue(allMetrics, quarter, metricKey, leader) {
    const metric = allMetrics.find(m => 
      m.quarter === quarter && 
      m.metric_key === metricKey && 
      m.leader === leader
    );
    
    return metric ? metric.value : 0;
  },
  
  /**
   * Gets key stat name for leader key stats
   * @param {String} metricKey - Original metric key
   * @returns {String} - Key stat name
   */
  getKeyStatName(metricKey) {
    const keyStatNames = {
      'retention_intent': 'retention',
      'leadership_confidence': 'leadershipConfidence',
      'tools_resources': 'tools',
      'empowerment': 'empowerment',
      'recognition': 'recognition'
    };
    
    return keyStatNames[metricKey] || metricKey;
  }
};