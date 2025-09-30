/**
 * User Interface Functions for Survey Data Processor
 * Handles form interactions and user feedback
 */

/**
 * Processes survey data from the UI form
 * Called by the HTML form via google.script.run
 * @param {Object} formData - Data from the HTML form
 */
function processFromUI(formData) {
  try {
    // Validate form data
    if (!formData.quarter || !formData.year) {
      throw new Error('Quarter and year are required');
    }
    
    // Convert form data to processing parameters
    const params = {
      quarter: formData.quarter,
      year: parseInt(formData.year),
      sourceSheetName: formData.sourceSheetName || CONFIG.DEFAULT_SOURCE_SHEET
    };
    
    // Start processing
    const result = processSurvey(params);
    
    return result;
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'UI processing failed', { error: error.toString(), formData });
    return {
      success: false,
      message: error.message,
      details: error.toString()
    };
  }
}

/**
 * Gets list of available sheets for the source dropdown
 * Called by the HTML form to populate the sheet selector
 */
function getAvailableSheets() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    
    const sheetNames = sheets.map(sheet => ({
      name: sheet.getName(),
      isDefault: sheet.getName() === CONFIG.DEFAULT_SOURCE_SHEET
    }));
    
    return {
      success: true,
      sheets: sheetNames
    };
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Failed to get available sheets', { error: error.toString() });
    return {
      success: false,
      message: 'Failed to load available sheets',
      sheets: []
    };
  }
}

/**
 * Validates API configuration
 * Called by the HTML form to check if API key is configured
 */
function validateApiConfiguration() {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    return {
      success: true,
      configured: !!apiKey,
      message: apiKey ? 'API key is configured' : 'API key needs to be set in Settings'
    };
    
  } catch (error) {
    return {
      success: false,
      configured: false,
      message: 'Failed to check API configuration'
    };
  }
}

/**
 * Gets processing status/history
 * Returns information about recent processing runs
 */
function getProcessingHistory() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const historyJson = properties.getProperty('PROCESSING_HISTORY') || '[]';
    const history = JSON.parse(historyJson);
    
    // Sort by timestamp, most recent first
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      history: history.slice(0, 10) // Return last 10 runs
    };
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Failed to get processing history', { error: error.toString() });
    return {
      success: false,
      history: [],
      message: 'Failed to load processing history'
    };
  }
}

/**
 * Saves processing run to history
 * @param {Object} runData - Data about the processing run
 */
function saveProcessingRun(runData) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const historyJson = properties.getProperty('PROCESSING_HISTORY') || '[]';
    const history = JSON.parse(historyJson);
    
    // Add new run
    history.push({
      timestamp: new Date().toISOString(),
      quarter: runData.quarter,
      year: runData.year,
      sourceSheetName: runData.sourceSheetName,
      success: runData.success,
      responseCount: runData.responseCount,
      message: runData.message
    });
    
    // Keep only last 50 runs
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    properties.setProperty('PROCESSING_HISTORY', JSON.stringify(history));
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Failed to save processing run', { error: error.toString() });
  }
}

/**
 * Gets current spreadsheet information
 * Returns details about the active spreadsheet
 */
function getSpreadsheetInfo() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    
    const sheetInfo = sheets.map(sheet => ({
      name: sheet.getName(),
      rowCount: sheet.getLastRow(),
      columnCount: sheet.getLastColumn(),
      isHidden: sheet.isSheetHidden()
    }));
    
    return {
      success: true,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetName: spreadsheet.getName(),
      sheets: sheetInfo,
      url: spreadsheet.getUrl()
    };
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Failed to get spreadsheet info', { error: error.toString() });
    return {
      success: false,
      message: 'Failed to load spreadsheet information'
    };
  }
}

/**
 * Validates source sheet data
 * Checks if the source sheet has the expected structure
 * @param {String} sheetName - Name of the sheet to validate
 */
function validateSourceSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `Sheet "${sheetName}" not found`
      };
    }
    
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow < 2) {
      return {
        success: false,
        message: 'Sheet must have at least a header row and one data row'
      };
    }
    
    if (lastColumn < 5) {
      return {
        success: false,
        message: 'Sheet must have at least 5 columns of survey data'
      };
    }
    
    // Get headers to check for expected survey questions
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const headerText = headers.join(' ').toLowerCase();
    
    // Look for key survey question patterns
    const expectedPatterns = [
      /satisfaction/,
      /year/,
      /mission/,
      /tools.*resources/,
      /empowered/
    ];
    
    const foundPatterns = expectedPatterns.filter(pattern => pattern.test(headerText));
    
    if (foundPatterns.length < 3) {
      return {
        success: false,
        message: 'Sheet does not appear to contain survey response data. Expected survey questions not found.',
        suggestion: 'Make sure you have selected the correct sheet with survey responses.'
      };
    }
    
    return {
      success: true,
      message: `Sheet "${sheetName}" looks good`,
      details: {
        rowCount: lastRow,
        columnCount: lastColumn,
        responseCount: lastRow - 1,
        foundPatterns: foundPatterns.length
      }
    };
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'Source sheet validation failed', { 
      error: error.toString(), 
      sheetName 
    });
    return {
      success: false,
      message: 'Failed to validate source sheet: ' + error.message
    };
  }
}

/**
 * Tests API connection
 * Makes a simple test call to verify API configuration
 */
function testApiConnection() {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!apiKey) {
      return {
        success: false,
        message: 'API key not configured'
      };
    }
    
    // Make a simple test request
    const payload = {
      contents: [{
        parts: [{
          text: 'Respond with just the word "SUCCESS" if you can process this request.'
        }]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 10
      }
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.GEMINI_API_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      return {
        success: true,
        message: 'API connection successful'
      };
    } else {
      const errorData = JSON.parse(response.getContentText());
      return {
        success: false,
        message: `API test failed: ${errorData.error?.message || 'Unknown error'}`,
        responseCode: responseCode
      };
    }
    
  } catch (error) {
    logMessage(LOGGER.ERROR, 'API connection test failed', { error: error.toString() });
    return {
      success: false,
      message: 'API connection test failed: ' + error.message
    };
  }
}

/**
 * Clears processing history
 * Removes all stored processing run data
 */
function clearProcessingHistory() {
  try {
    PropertiesService.getScriptProperties().deleteProperty('PROCESSING_HISTORY');
    return {
      success: true,
      message: 'Processing history cleared'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear history: ' + error.message
    };
  }
}

/**
 * Gets error log for debugging
 * Returns recent error entries
 */
function getErrorLog() {
  try {
    const errorLogJson = PropertiesService.getScriptProperties().getProperty('ERROR_LOG') || '[]';
    const errorLog = JSON.parse(errorLogJson);
    
    return {
      success: true,
      errors: errorLog
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Failed to load error log',
      errors: []
    };
  }
}

/**
 * Exports processing configuration
 * Returns current configuration for backup/sharing
 */
function exportConfiguration() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const config = {
      hasApiKey: !!properties.getProperty('GEMINI_API_KEY'),
      history: JSON.parse(properties.getProperty('PROCESSING_HISTORY') || '[]'),
      errorLog: JSON.parse(properties.getProperty('ERROR_LOG') || '[]'),
      exportedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      config: config
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Failed to export configuration'
    };
  }
}