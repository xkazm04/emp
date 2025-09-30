const SheetProcessor = {
  
  /**
   * Creates or updates target sheets with corrected structure
   * @param {Spreadsheet} spreadsheet - Target spreadsheet
   * @param {Object} processedData - Processed data from AI
   * @param {Object} params - Processing parameters
   * @returns {Object} - Creation result details
   */
  createOrUpdateSheetsUnified: function(spreadsheet, processedData, params) {
    try {
      const results = {
        metrics: 0,
        qualitativeInsights: 0,
        leaderInsights: 0,
        timestamp: new Date().toISOString()
      };
      
      // Create or update unified metrics sheet (unchanged)
      if (processedData.metrics && processedData.metrics.length > 0) {
        const metricsSheet = this.getOrCreateUnifiedMetricsSheet(spreadsheet, 'metrics');
        this.updateUnifiedMetricsSheet(metricsSheet, processedData.metrics);
        results.metrics = processedData.metrics.length;
        Logger.log(`Updated unified metrics sheet with ${results.metrics} metrics`);
      }
      
      // Create or update qualitative insights sheet - WITH CLIP WRAPPING
      if (processedData.qualitativeInsights && processedData.qualitativeInsights.length > 0) {
        // Filter for high-frequency insights only (20+)
        const highFrequencyInsights = processedData.qualitativeInsights.filter(insight => 
          insight.frequency && insight.frequency >= 20
        );
        
        Logger.log(`Filtered qualitative insights: ${processedData.qualitativeInsights.length} → ${highFrequencyInsights.length} (20+ frequency)`);
        
        if (highFrequencyInsights.length > 0) {
          const insightsSheet = this.getOrCreateQualitativeInsightsSheet(spreadsheet, 'qualitative_insights');
          this.updateQualitativeInsightsSheetWithClip(insightsSheet, highFrequencyInsights);
          results.qualitativeInsights = highFrequencyInsights.length;
          Logger.log(`Updated qualitative insights sheet with ${results.qualitativeInsights} high-frequency insights (clip wrapping)`);
        } else {
          Logger.log('No insights with 20+ frequency found');
          results.qualitativeInsights = 0;
        }
      }
      
      // Create or update leader insights sheet - FIXED STRUCTURE WITH TITLES
      if (processedData.leaderInsights && processedData.leaderInsights.length > 0) {
        const leaderInsightsSheet = this.getOrCreateFixedLeaderInsightsSheet(spreadsheet, 'leader_insights');
        this.updateFixedLeaderInsightsSheet(leaderInsightsSheet, processedData.leaderInsights);
        results.leaderInsights = processedData.leaderInsights.length;
        Logger.log(`Updated leader insights sheet with ${results.leaderInsights} insights (fixed structure with titles)`);
      }
      
      return results;
      
    } catch (error) {
      Logger.log('Error creating/updating sheets: ' + error.toString());
      throw new Error('Failed to update sheets: ' + error.message);
    }
  },
  
  /**
   * Gets existing unified metrics sheet or creates new one (unchanged)
   */
  getOrCreateUnifiedMetricsSheet: function(spreadsheet, sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      sheet.getRange(1, 1, 1, 11).setValues([[
        'quarter', 'leader', 'metric_key', 'metric_name', 'value', 'calculation_note', 'total_responses',
        'top_performers_percentage', 'total_responses_managers', 'total_responses_ics', 'category' 
      ]]);
      
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setWrap(true);
      
      for (let i = 1; i <= 11; i++) {
        sheet.autoResizeColumn(i);
      }
    }
    
    return sheet;
  },
  
  /**
   * Gets existing qualitative insights sheet or creates new one (unchanged structure)
   */
  getOrCreateQualitativeInsightsSheet: function(spreadsheet, sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Headers: quarter, insight_type, category, title, content, frequency, sample_responses, question_reference
      sheet.getRange(1, 1, 1, 8).setValues([[
        'quarter', 'insight_type', 'category', 'title', 'content',
        'frequency', 'sample_responses', 'question_reference'
      ]]);
      
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setWrap(true);
      
      for (let i = 1; i <= 8; i++) {
        sheet.autoResizeColumn(i);
      }
      
      sheet.setColumnWidth(4, 250); // title column (D)
      sheet.setColumnWidth(5, 300); // content column (E)
      sheet.setColumnWidth(7, 500); // sample_responses column (G)
      
    } else {
      // Check if sheet has old structure and update if needed
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (headers[3] === 'rank') {
        sheet.getRange(1, 4).setValue('title');
        Logger.log('Updated qualitative insights sheet header from rank to title');
      }
    }
    
    return sheet;
  },
  
  /**
   * Structure: quarter, leader_name, title, insight_type, content, supporting_evidence
   */
  getOrCreateFixedLeaderInsightsSheet: function(spreadsheet, sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // CORRECT structure based on CSV: quarter, leader_name, title, insight_type, content, supporting_evidence
      sheet.getRange(1, 1, 1, 6).setValues([[
        'quarter', 'leader_name', 'title', 'insight_type', 'content', 'supporting_evidence'
      ]]);
      
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setWrap(true);
      
      for (let i = 1; i <= 6; i++) {
        sheet.autoResizeColumn(i);
      }
      
      sheet.setColumnWidth(3, 200); // title column
      sheet.setColumnWidth(5, 300); // content column
      sheet.setColumnWidth(6, 250); // supporting_evidence column
      
    } else {
      // Check if we need to update headers from old format
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (headers[2] === 'insight_rank') {
        // Update from old structure: quarter, leader_name, insight_rank, insight_type, content, supporting_evidence
        // To new structure: quarter, leader_name, title, insight_type, content, supporting_evidence  
        sheet.getRange(1, 3).setValue('title');
        Logger.log('Updated leader insights sheet header from insight_rank to title');
      }
    }
    
    return sheet;
  },
  
  /**
   * Updates the unified metrics sheet (unchanged)
   */
  updateUnifiedMetricsSheet: function(sheet, metrics) {
    if (!metrics || metrics.length === 0) return;
    
    const dataRows = metrics.map(metric => [
      metric.quarter || '',
      metric.leader || '',
      metric.metric_key || '',
      metric.metric_name || '',
      metric.value || 0,
      metric.calculation_note || '',
      metric.total_responses || 0,
      metric.top_performers_percentage || 0,
      metric.total_responses_managers || 0,
      metric.total_responses_ics || 0,
      metric.category || '',
    ]);
    
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, dataRows.length, 11).setValues(dataRows);
    
    logMessage(LOGGER.INFO, `Added ${dataRows.length} metrics rows to sheet`);
  },
  
  /**
   * UPDATED: Updates qualitative insights sheet with CLIP wrapping for columns D and G
   * @param {Sheet} sheet - Target insights sheet
   * @param {Array} insights - Array of insight objects (20+ frequency only)
   */
  updateQualitativeInsightsSheetWithClip: function(sheet, insights) {
    if (!insights || insights.length === 0) return;
    
    const dataRows = insights.map(insight => {
      // Ensure title is populated - create fallback if empty
      let title = insight.title || '';
      if (!title || title.trim() === '') {
        // Create title from content or theme
        const content = insight.content || '';
        if (content.length > 0) {
          title = content.substring(0, 50).replace(/[^\w\s]/g, '').trim();
          if (title.length > 40) title = title.substring(0, 37) + '...';
        } else {
          title = `${insight.category || 'Theme'} Issue`;
        }
      }
      
      // Ensure sample_responses has full examples - minimum 3 if available
      let sampleResponses = insight.sample_responses || '';
      if (sampleResponses.length === 0 && insight.examples) {
        // Fallback to examples array if sample_responses is empty
        sampleResponses = Array.isArray(insight.examples) 
          ? insight.examples.slice(0, 3).join(' | ')
          : insight.examples.toString();
      }
      
      return [
        insight.quarter || '',
        insight.insight_type || '',
        insight.category || '',
        title, // Guaranteed to have a title
        insight.content || '',
        insight.frequency || 0,
        sampleResponses, // Full examples without truncation
        insight.question_reference || ''
      ];
    });
    
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, dataRows.length, 8).setValues(dataRows);
    
    // SET CLIP WRAPPING for content (column D) and sample_responses (column G)
    const contentRange = sheet.getRange(startRow, 5, dataRows.length, 1); // Column E (content)
    const samplesRange = sheet.getRange(startRow, 7, dataRows.length, 1); // Column G (sample_responses)
    
    // Set to CLIP instead of WRAP
    contentRange.setWrap(false);
    samplesRange.setWrap(false);
    
    logMessage(LOGGER.INFO, `Added ${dataRows.length} high-frequency qualitative insights with CLIP wrapping for columns D and G`);
  },
  
  /**
   * FIXED: Updates leader insights sheet with correct structure and title generation
   * Structure: quarter, leader_name, title, insight_type, content, supporting_evidence
   * @param {Sheet} sheet - Target leader insights sheet
   * @param {Array} leaderInsights - Array of leader insight objects
   */
  updateFixedLeaderInsightsSheet: function(sheet, leaderInsights) {
    if (!leaderInsights || leaderInsights.length === 0) return;
    
    const dataRows = leaderInsights.map(insight => {
      // GENERATE TITLE from content (3-4 words like qualitative insights)
      let title = '';
      const content = insight.content || '';
      
      if (content.length > 0) {
        // Extract meaningful words from content to create title
        const meaningfulWords = content.split(' ')
          .filter(w => 
            w.length > 3 && 
            !['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'more', 
              'need', 'want', 'team', 'show', 'seem', 'appear', 'indicate'].includes(w.toLowerCase())
          )
          .slice(0, 4);
        
        if (meaningfulWords.length >= 2) {
          title = meaningfulWords.join(' ');
        } else {
          // Fallback based on insight type
          const insightType = insight.insight_type || 'observation';
          if (insightType === 'strength') {
            title = `${insight.leader_name || 'Team'} Strength`;
          } else if (insightType === 'challenge') {
            title = `${insight.leader_name || 'Team'} Challenge`;
          } else if (insightType === 'opportunity') {
            title = `${insight.leader_name || 'Team'} Opportunity`;
          } else {
            title = `${insight.leader_name || 'Team'} Pattern`;
          }
        }
      } else {
        title = `${insight.insight_type || 'Team'} Insight`;
      }
      
      // Ensure title is not too long (max 50 chars)
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      return [
        insight.quarter || '',
        insight.leader_name || '',
        title, // Generated title in column 3
        insight.insight_type || '',
        insight.content || '',
        insight.supporting_evidence || ''
      ];
    });
    
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, dataRows.length, 6).setValues(dataRows);
    
    // Set text wrapping for content column (column 5)
    const contentRange = sheet.getRange(startRow, 5, dataRows.length, 1);
    contentRange.setWrap(true);
    
    logMessage(LOGGER.INFO, `Added ${dataRows.length} leader insights with generated titles (correct 6-column structure)`);
  },
  
  // Keep other methods unchanged
  readSurveyData: function(sheet) {
    try {
      const range = sheet.getDataRange();
      const values = range.getValues();
      
      if (values.length < 2) {
        throw new Error('Source sheet must have at least header row and one data row');
      }
      
      const headers = values[0];
      const dataRows = values.slice(1);
      
      const surveyData = dataRows.map(row => {
        const responseObj = {};
        headers.forEach((header, index) => {
          const cleanHeader = header.toString().trim();
          responseObj[cleanHeader] = row[index];
        });
        return responseObj;
      }).filter(response => {
        return Object.values(response).some(value => 
          value !== null && value !== '' && value !== undefined
        );
      });
      
      Logger.log(`Converted ${surveyData.length} valid survey responses`);
      return surveyData;
      
    } catch (error) {
      Logger.log('Error reading survey data: ' + error.toString());
      throw new Error('Failed to read survey data: ' + error.message);
    }
  },
  
  readSheetAsObjects: function(spreadsheet, tabName) {
    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) {
      logMessage(LOGGER.WARN, `Sheet tab not found: ${tabName}`);
      return [];
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    if (values.length < 2) return [];
    
    const headers = values[0].map(h => String(h).trim());
    const rows = values.slice(1);
    
    return rows
      .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
  },
  
  getAvailableQuarters: function(spreadsheet) {
    try {
      const sheet = spreadsheet.getSheetByName('metrics');
      if (!sheet) {
        logMessage(LOGGER.WARN, 'Metrics sheet not found');
        return [];
      }
      
      const range = sheet.getRange('A:A');
      const values = range.getValues();
      
      const quarters = new Set();
      for (let i = 1; i < values.length; i++) {
        const quarter = values[i][0];
        if (quarter && quarter !== '') {
          const quarterStr = String(quarter).trim().replace('_', ' ');
          quarters.add(quarterStr);
        }
      }
      
      const sortedQuarters = Array.from(quarters).sort((a, b) => {
        const [qA, yearA] = a.split(' ');
        const [qB, yearB] = b.split(' ');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return qA.localeCompare(qB);
      });
      
      return sortedQuarters;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Error reading available quarters', { error: error.toString() });
      return [];
    }
  },
  
  createSummarySheet: function(spreadsheet, results, params) {
    let summarySheet = spreadsheet.getSheetByName('processing_summary');
    
    if (!summarySheet) {
      summarySheet = spreadsheet.insertSheet('processing_summary');
    }
    
    summarySheet.clear();
    
    const summaryData = [
      ['Processing Summary - FIXED VERSION'],
      [''],
      ['Quarter:', `${params.quarter} ${params.year}`],
      ['Processed:', results.timestamp],
      [''],
      ['Results:'],
      ['Metrics:', results.metrics],
      ['Qualitative Insights (20+ freq):', results.qualitativeInsights],
      ['Leader Insights (with titles):', results.leaderInsights],
      [''],
      ['Fixes Applied:'],
      ['- Qualitative insights: CLIP wrapping for columns D and G'],
      ['- Leader insights: Title generation in column 3'],
      ['- Leader insights: Correct 6-column structure'],
      ['- Column D/G: No text wrapping (prevents cell expansion)'],
      ['- Titles: Generated from meaningful words in content']
    ];
    
    summarySheet.getRange(1, 1, summaryData.length, 2).setValues(summaryData);
    
    summarySheet.getRange(1, 1, 1, 2).mergeAcross()
      .setFontWeight('bold')
      .setFontSize(14)
      .setBackground('#4285f4')
      .setFontColor('white');
  },
  
  getSpreadsheetParentFolderId: function(spreadsheet) {
    try {
      const file = DriveApp.getFileById(spreadsheet.getId());
      const parents = file.getParents();
      
      if (parents.hasNext()) {
        return parents.next().getId();
      } else {
        return DriveApp.getRootFolder().getId();
      }
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Error getting parent folder ID', { error: error.toString() });
      throw new Error('Unable to determine spreadsheet parent folder: ' + error.message);
    }
  }
};