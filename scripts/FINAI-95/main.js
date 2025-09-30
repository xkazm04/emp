/**
 * Main orchestration script for Survey Data Processing
 * Updated to use separate HTML template files
 */

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Survey Processor')
    .addItem('Process Survey Data', 'showProcessorDialog')
    .addItem('Export JSON Report', 'showJsonExportDialog')
    .addSeparator()
    .addItem('Process Quantitative Metrics', 'showMetricsOnlyDialog')
    .addItem('Test API Connection', 'testAPIConnection')
    .addSeparator()
    .addItem('Settings', 'showSettingsDialog')
    .addItem('View Processing Stats', 'showProcessingStats')
    .addToUi();
}

/**
 * Shows the main processor dialog
 */
function showProcessorDialog() {
  try {
    const html = HtmlService.createTemplateFromFile('aiProcessorForm');
    const htmlOutput = html.evaluate()
      .setWidth(500)
      .setHeight(450)
      .setTitle('Survey Data Processor - Optimized');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Process Survey Data');
  } catch (error) {
    Logger.log('Error showing processor dialog: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error opening dialog: ' + error.message);
  }
}

/**
 * Shows the JSON export dialog using separate HTML template file
 */
function showJsonExportDialog() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const availableQuarters = SheetProcessor.getAvailableQuarters(spreadsheet);
    
    if (availableQuarters.length === 0) {
      ui.alert('No Data', 'No quarters found in metrics sheet. Please process survey data first.', ui.ButtonSet.OK);
      return;
    }
    
    // Create HTML template and pass availableQuarters data
    const html = HtmlService.createTemplateFromFile('jsonExportForm');
    html.availableQuarters = availableQuarters;
    
    const htmlOutput = html.evaluate()
      .setWidth(520)
      .setHeight(550)
      .setTitle('Survey Data Export');
    
    ui.showModalDialog(htmlOutput, 'Survey Data Export');
    
  } catch (error) {
    Logger.log('Error showing JSON export dialog: ' + error.toString());
    ui.alert('Error opening export dialog: ' + error.message);
  }
}

/**
 * Shows the metrics-only processing dialog
 */
function showMetricsOnlyDialog() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const html = HtmlService.createHtmlOutputFromFile('metricsOnlyForm')
      .setWidth(450)
      .setHeight(300)
      .setTitle('Process Quantitative Metrics Only');
    
    ui.showModalDialog(html, 'Process Quantitative Metrics');
  } catch (error) {
    Logger.log('Error showing metrics-only dialog: ' + error.toString());
    ui.alert('Error opening dialog: ' + error.message);
  }
}

/**
 * Processes only quantitative metrics without LLM analysis
 * @param {Object} params - Processing parameters from the form
 * @returns {Object} - Processing result
 */
function processMetricsOnly(params) {
  const startTime = new Date();
  
  try {
    Logger.log('Starting quantitative metrics processing with params: ' + JSON.stringify(params));
    
    // Validate parameters
    if (!params.quarter || !params.year) {
      throw new Error('Quarter and year are required');
    }
    
    // Set default source sheet name
    const sourceSheetName = params.sourceSheetName || 'responses';
    
    // Get the spreadsheet and source sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = spreadsheet.getSheetByName(sourceSheetName);
    
    if (!sourceSheet) {
      throw new Error(`Source sheet "${sourceSheetName}" not found`);
    }
    
    // Read the survey data using SheetProcessor
    const data = SheetProcessor.readSurveyData(sourceSheet);
    if (data.length === 0) {
      throw new Error('No data found in source sheet');
    }
    
    Logger.log(`Found ${data.length} survey responses`);
    
    // Show progress
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Calculating metrics for ${data.length} responses...`,
      'Metrics Processor',
      -1
    );
    
    // Create quarter ID
    const quarterId = `${params.quarter} ${params.year}`;
    
    // Process metrics using MetricsCalculator
    const metricsResult = MetricsCalculator.calculateAllMetrics(data, quarterId);
    
    // Create processed data object in expected format
    const processedData = {
      metrics: metricsResult.metrics,
      qualitativeInsights: [], // Empty for metrics-only processing
      leaderInsights: []       // Empty for metrics-only processing
    };
    
    // Create or update target sheets using SheetProcessor
    const result = SheetProcessor.createOrUpdateSheetsUnified(spreadsheet, processedData, params);
    
    // Calculate processing time
    const endTime = new Date();
    const processingTimeSeconds = Math.round((endTime - startTime) / 1000);
    
    // Clear progress toast
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Successfully calculated metrics for ${data.length} responses in ${processingTimeSeconds}s`,
      'Metrics Processor',
      5
    );
    
    Logger.log('Quantitative metrics processing completed successfully');
    
    return {
      success: true,
      message: `Successfully calculated metrics for ${data.length} responses\n` +
               `Metrics generated: ${result.metrics}\n` +
               `Time: ${processingTimeSeconds}s`,
      details: {
        metrics: result.metrics,
        responses: data.length,
        processingTime: processingTimeSeconds
      }
    };
    
  } catch (error) {
    Logger.log('Error in processMetricsOnly: ' + error.toString());
    
    // Clear progress toast on error
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Metrics processing failed: ' + error.message,
      'Metrics Processor',
      5
    );
    
    return {
      success: false,
      message: error.message,
      details: error.toString()
    };
  }
}

/**
 * Resolves quarter handling and parameter processing issues
 */
function executeJsonExportFromForm(params) {
  try {
    // Enhanced logging to debug parameter issues
    logMessage(LOGGER.INFO, 'executeJsonExportFromForm called with params:', JSON.stringify(params, null, 2));
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const parentFolderId = SheetProcessor.getSpreadsheetParentFolderId(spreadsheet);
    
    // CRITICAL FIX: Parse selected quarter correctly
    const selectedQuarter = params.selectedQuarter;
    if (!selectedQuarter || selectedQuarter.trim() === '') {
      throw new Error('No quarter selected');
    }
    
    logMessage(LOGGER.DEBUG, 'Selected quarter from form:', selectedQuarter);
    
    // Parse quarter format: "Q2 2025" -> quarter="Q2", year=2025
    const quarterParts = selectedQuarter.split(' ');
    if (quarterParts.length !== 2) {
      throw new Error('Invalid quarter format: ' + selectedQuarter + '. Expected format: "Q1 2025"');
    }
    
    const quarter = quarterParts[0]; // "Q2"
    const year = parseInt(quarterParts[1]); // 2025
    
    if (!quarter.match(/^Q[1-4]$/)) {
      throw new Error('Invalid quarter: ' + quarter + '. Expected Q1, Q2, Q3, or Q4');
    }
    
    if (isNaN(year) || year < 2020 || year > 2030) {
      throw new Error('Invalid year: ' + quarterParts[1]);
    }
    
    logMessage(LOGGER.INFO, 'Parsed quarter successfully', { quarter, year });
    
    // Handle all quarters array
    let allQuarters = [];
    if (params.allQuarters && Array.isArray(params.allQuarters)) {
      allQuarters = [...params.allQuarters]; // Copy the array
      logMessage(LOGGER.DEBUG, 'All quarters from params:', allQuarters);
    } else if (params.allQuarters) {
      allQuarters = [params.allQuarters];
      logMessage(LOGGER.DEBUG, 'Single quarter converted to array:', allQuarters);
    } else {
      allQuarters = [selectedQuarter];
      logMessage(LOGGER.DEBUG, 'Using selected quarter as fallback:', allQuarters);
    }
    
    // Handle previous quarter calculation
    let previousQuarter = null;
    let previousYear = null;
    
    if (params.includeComparison && allQuarters.length > 1) {
      const currentIndex = allQuarters.indexOf(selectedQuarter);
      logMessage(LOGGER.DEBUG, 'Finding previous quarter', { 
        currentIndex, 
        selectedQuarter,
        allQuarters
      });
      
      if (currentIndex > 0) {
        const prevQuarterStr = allQuarters[currentIndex - 1];
        const [prevQ, prevY] = prevQuarterStr.split(' ');
        previousQuarter = prevQ;
        previousYear = parseInt(prevY);
        
        logMessage(LOGGER.INFO, 'Previous quarter found', { 
          previousQuarter, 
          previousYear,
          fromString: prevQuarterStr
        });
      }
    }
    
    // Build final export parameters
    const exportParams = {
      quarter: quarter,           // "Q2"
      year: year,                // 2025
      outputFolderId: parentFolderId,
      previousQuarter: previousQuarter,  // "Q1" or null
      previousYear: previousYear,        // 2025 or null
      includeAllQuarters: params.includeComparison,
      allQuarters: params.includeComparison ? allQuarters : [selectedQuarter]
    };
    
    logMessage(LOGGER.INFO, 'Final export parameters:', JSON.stringify(exportParams, null, 2));
    
    // Execute export with enhanced error handling
    const result = JSONExporter.generateSurveyJsonFile(exportParams);
    
    if (result.success) {
      // Ensure proper quarters display for result
      const quartersToShow = Array.isArray(exportParams.allQuarters) ? 
        exportParams.allQuarters : [exportParams.allQuarters || selectedQuarter];
      
      result.quartersIncluded = quartersToShow.join(', ');
      
      logMessage(LOGGER.INFO, 'JSON export completed successfully', {
        fileName: result.fileName,
        quartersIncluded: result.quartersIncluded
      });
    } else {
      logMessage(LOGGER.ERROR, 'JSON export failed', {
        message: result.message,
        details: result.details
      });
    }
    
    return result;
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Error in executeJsonExportFromForm', { 
      error: error.toString(),
      stack: error.stack,
      params: JSON.stringify(params, null, 2)
    });
    
    return {
      success: false,
      message: error.message,
      details: error.toString()
    };
  }
}

/**
 * FIXED: Helper function for consistent quarter ID creation
 */
function createQuarterId(params) {
  return `${params.quarter}_${params.year}`;
}

/**
 * Test API connection with minimal call
 */
function testAPIConnection() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      ui.alert('API key not configured. Please set it in Settings.');
      return;
    }
    
    const testPrompt = PromptBuilder.buildTestPrompt();
    const response = AIProcessor.callGeminiAPI(testPrompt, 'test');
    
    ui.alert('Success', 'API connection successful!\n\nResponse: ' + response, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'API connection failed:\n' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Shows processing statistics from last run
 */
function showProcessingStats() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const stats = PropertiesService.getScriptProperties().getProperty('LAST_PROCESSING_STATS');
    if (!stats) {
      ui.alert('No processing statistics available. Run survey processing first.');
      return;
    }
    
    const statsObj = JSON.parse(stats);
    const message = `Last Processing Statistics:
    
Date: ${statsObj.timestamp}
Total Responses: ${statsObj.totalResponses}
Categories Processed: ${statsObj.categoriesProcessed}
Total Clusters: ${statsObj.totalClusters}
Compression Ratio: ${statsObj.compressionRatio}
API Calls Made: ${statsObj.apiCalls}
Total Tokens Used: ${statsObj.estimatedTokens}
Processing Time: ${statsObj.processingTimeSeconds}s`;
    
    ui.alert('Processing Statistics', message, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error displaying stats: ' + error.message);
  }
}

/**
 * Shows settings dialog for API configuration
 */
function showSettingsDialog() {
  const ui = SpreadsheetApp.getUi();
  
  // Show simple API key configuration
  const currentKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  
  const result = ui.prompt(
    'API Key Configuration',
    'Enter your Gemini API Key:\n(Current: ' + (currentKey ? '***' + currentKey.slice(-4) : 'Not set') + ')',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('API Key saved successfully!');
    }
  }
}

/**
 * Main processing function called from the UI
 * @param {Object} params - Processing parameters from the form
 * @returns {Object} - Processing result
 */
function processSurvey(params) {
  const startTime = new Date();
  const processingStats = {
    timestamp: startTime.toISOString(),
    totalResponses: 0,
    categoriesProcessed: 0,
    totalClusters: 0,
    compressionRatio: '0%',
    apiCalls: 0,
    estimatedTokens: 0,
    processingTimeSeconds: 0
  };
  
  try {
    Logger.log('Starting optimized survey processing with params: ' + JSON.stringify(params));
    
    // Validate parameters
    if (!params.quarter || !params.year) {
      throw new Error('Quarter and year are required');
    }
    
    // Check API key
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set it in Settings.');
    }
    
    // Set default source sheet name
    const sourceSheetName = params.sourceSheetName || 'responses';
    
    // Get the spreadsheet and source sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = spreadsheet.getSheetByName(sourceSheetName);
    
    if (!sourceSheet) {
      throw new Error(`Source sheet "${sourceSheetName}" not found`);
    }
    
    // Read the survey data using SheetProcessor
    const data = SheetProcessor.readSurveyData(sourceSheet);
    if (data.length === 0) {
      throw new Error('No data found in source sheet');
    }
    
    processingStats.totalResponses = data.length;
    Logger.log(`Found ${data.length} survey responses`);
    
    // Show progress
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Processing ${data.length} responses...`,
      'Survey Processor',
      -1
    );
    
    // Process data with optimized approach
    const processedData = AIProcessor.processWithGemini(data, params);
    
    // Collect statistics
    if (processedData._aggregationStats) {
      processingStats.categoriesProcessed = processedData._aggregationStats.categoriesProcessed || 0;
      processingStats.totalClusters = processedData._aggregationStats.totalClusters || 0;
      processingStats.compressionRatio = processedData._aggregationStats.compressionRatio || '0%';
      processingStats.apiCalls = processedData._aggregationStats.apiCalls || 0;
      processingStats.estimatedTokens = processedData._aggregationStats.estimatedTokens || 0;
    }
    
    // Create or update target sheets with unified structure using SheetProcessor
    const result = SheetProcessor.createOrUpdateSheetsUnified(spreadsheet, processedData, params);
    
    // Calculate processing time
    const endTime = new Date();
    processingStats.processingTimeSeconds = Math.round((endTime - startTime) / 1000);
    
    // Save statistics
    PropertiesService.getScriptProperties().setProperty(
      'LAST_PROCESSING_STATS',
      JSON.stringify(processingStats)
    );
    
    // Clear progress toast
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Successfully processed ${data.length} responses in ${processingStats.processingTimeSeconds}s`,
      'Survey Processor',
      5
    );
    
    Logger.log('Survey processing completed successfully');
    Logger.log('Processing stats: ' + JSON.stringify(processingStats));
    
    return {
      success: true,
      message: `Successfully processed ${data.length} responses\n` +
               `Compression: ${processingStats.compressionRatio}\n` +
               `API Calls: ${processingStats.apiCalls}\n` +
               `Time: ${processingStats.processingTimeSeconds}s`,
      details: result,
      stats: processingStats
    };
    
  } catch (error) {
    Logger.log('Error in processSurvey: ' + error.toString());
    
    // Clear progress toast on error
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Processing failed: ' + error.message,
      'Survey Processor',
      5
    );
    
    return {
      success: false,
      message: error.message,
      details: error.toString(),
      stats: processingStats
    };
  }
}

/**
 * Include HTML file content for HtmlService
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}