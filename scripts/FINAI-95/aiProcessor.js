const AIProcessor = {
  
  /**
   * Main processing function with optimized approach
   * @param {Array} surveyData - Array of survey response objects
   * @param {Object} params - Processing parameters (quarter, year, etc.)
   * @returns {Object} - Processed data ready for sheets
   */
  processWithGemini: function(surveyData, params) {
    try {
      logMessage(LOGGER.INFO, `Starting optimized processing for ${surveyData.length} responses`);
      
      // Initialize statistics tracking
      const stats = {
        categoriesProcessed: 0,
        totalClusters: 0,
        compressionRatio: '0%',
        apiCalls: 0,
        estimatedTokens: 0
      };
      
      const validationErrors = validateParams(params);
      if (validationErrors.length > 0) {
        throw new Error('Validation failed: ' + validationErrors.join(', '));
      }
      
      const quarterId = createQuarterId(params);
      
      // STEP 1: Calculate quantitative metrics with AppScript
      logMessage(LOGGER.INFO, 'Calculating quantitative metrics...');
      const quantitativeResults = MetricsCalculator.calculateAllMetrics(surveyData, quarterId);
      
      // STEP 2: Pre-aggregate text responses before AI processing
      logMessage(LOGGER.INFO, 'Pre-aggregating text responses...');
      const aggregatedData = TextAggregator.aggregateResponses(quantitativeResults.cleanedData);
      
      // Collect aggregation stats
      const aggStats = TextAggregator.getAggregationStats(aggregatedData);
      stats.totalClusters = aggStats.totalClusters;
      stats.compressionRatio = aggStats.compressionRatio;
      
      // STEP 3: Process each question category separately with IMPROVED prompts
      logMessage(LOGGER.INFO, 'Processing qualitative insights with improved prompts...');
      const qualitativeResults = this.processAggregatedInsights(aggregatedData, quarterId);
      stats.categoriesProcessed = Object.keys(aggregatedData.byCategory).filter(
        cat => aggregatedData.byCategory[cat].clusters.length > 0
      ).length;
      stats.apiCalls += stats.categoriesProcessed;
      
      // STEP 4: Process leader insights only for leaders with sufficient data
      logMessage(LOGGER.INFO, 'Processing leader-specific insights...');
      const leaderResults = this.processLeaderInsights(aggregatedData, quarterId);
      const leaderBatchCount = Math.ceil(
        Object.entries(aggregatedData.byLeader)
          .filter(([_, data]) => data.responseCount >= 10).length / 5
      );
      stats.apiCalls += leaderBatchCount;
      
      // Estimate total tokens (rough approximation)
      stats.estimatedTokens = stats.apiCalls * 800; // Increased estimate due to fuller examples
      
      // STEP 5: Combine all results
      const combinedResults = {
        metrics: quantitativeResults.metrics,
        segmentMetrics: quantitativeResults.segmentMetrics,
        qualitativeInsights: qualitativeResults,
        leaderInsights: leaderResults,
        _aggregationStats: stats // Add stats for main.gs to use
      };
      
      this.validateProcessedData(combinedResults);
      
      logMessage(LOGGER.INFO, 'Optimized processing completed', {
        metrics: combinedResults.metrics.length,
        segmentMetrics: combinedResults.segmentMetrics.length,
        qualitativeInsights: combinedResults.qualitativeInsights.length,
        leaderInsights: combinedResults.leaderInsights.length,
        stats: stats
      });
      
      return combinedResults;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'Processing failed', { error: error.toString(), params });
      throw error;
    }
  },
  
  /**
   * Process aggregated insights using improved PromptBuilder
   * @param {Object} aggregatedData - Pre-aggregated response data
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Qualitative insights with specific titles and full examples
   */
  processAggregatedInsights: function(aggregatedData, quarterId) {
    const allInsights = [];
    const questionCategories = [
      'fulfilling_work',
      'empowerment_changes', 
      'leadership_support',
      'obstacles',
      'bold_ideas',
      'role_clarity'
    ];
    
    // Process each category separately using improved prompts
    questionCategories.forEach(category => {
      if (aggregatedData.byCategory[category] && aggregatedData.byCategory[category].clusters.length > 0) {
        try {
          logMessage(LOGGER.INFO, `Processing category: ${category} with improved prompt`);
          const categoryInsights = this.processSingleCategory(
            aggregatedData.byCategory[category],
            category,
            quarterId
          );
          allInsights.push(...categoryInsights);
        } catch (error) {
          logMessage(LOGGER.WARN, `Failed to process category ${category}`, { error: error.toString() });
        }
      }
    });
    
    // Sort insights by frequency (highest first) within each category
    allInsights.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return (b.frequency || 0) - (a.frequency || 0);
    });
    
    return allInsights;
  },
  
  /**
   * Process a single question category using PromptBuilder
   * @param {Object} categoryData - Aggregated data for this category
   * @param {String} category - Category name
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Insights for this category with specific titles and full examples
   */
  processSingleCategory: function(categoryData, category, quarterId) {
    // USE IMPROVED PROMPTBUILDER instead of internal method
    const prompt = PromptBuilder.buildCategoryPrompt(categoryData, category, quarterId);
    
    // Skip if no prompt (no data for this category)
    if (!prompt) {
      return [];
    }
    
    // Validate prompt before sending
    const validation = PromptBuilder.validatePromptSize(prompt);
    logMessage(LOGGER.INFO, `Category ${category} prompt validation`, {
      sizeKB: validation.sizeKB,
      estimatedTokens: validation.estimatedTokens,
      valid: validation.valid
    });
    
    if (!validation.valid) {
      logMessage(LOGGER.WARN, `Prompt too large for category ${category}, skipping`);
      return [];
    }
    
    try {
      const response = this.callGeminiAPI(prompt, `category_analysis_${category}`);
      
      // Parse using PromptBuilder's improved parser
      const insights = PromptBuilder.parseCategoryResponse(response, category, quarterId);
      
      logMessage(LOGGER.INFO, `Category ${category}: Generated ${insights.length} insights with specific titles`);
      
      return insights;
    } catch (error) {
      logMessage(LOGGER.ERROR, `Failed to process category ${category}`, { error: error.toString() });
      return [];
    }
  },
  
  /**
   * Process leader insights for leaders with sufficient data
   * Uses PromptBuilder for consistency
   * @param {Object} aggregatedData - Pre-aggregated response data
   * @param {String} quarterId - Quarter identifier
   * @returns {Array} - Leader insights
   */
  processLeaderInsights: function(aggregatedData, quarterId) {
    const leaderInsights = [];
    
    // Only process leaders with 10+ responses for meaningful insights
    const significantLeaders = Object.entries(aggregatedData.byLeader)
      .filter(([leader, data]) => data.responseCount >= 10)
      .sort((a, b) => b[1].responseCount - a[1].responseCount)
      .slice(0, 10); // Top 10 leaders by response count
    
    if (significantLeaders.length === 0) {
      logMessage(LOGGER.INFO, 'No leaders with sufficient data for insights');
      return leaderInsights;
    }
    
    // Process in batches of 5 leaders to keep prompts focused
    const leaderBatches = [];
    for (let i = 0; i < significantLeaders.length; i += 5) {
      leaderBatches.push(significantLeaders.slice(i, i + 5));
    }
    
    leaderBatches.forEach((batch, batchIndex) => {
      try {
        // Use PromptBuilder for leader prompts too
        const batchPrompt = PromptBuilder.buildLeaderPrompt(batch, quarterId);
        if (!batchPrompt) {
          logMessage(LOGGER.WARN, `No prompt generated for leader batch ${batchIndex}`);
          return;
        }
        
        const response = this.callGeminiAPI(batchPrompt, `leader_analysis_batch_${batchIndex}`);
        const batchInsights = PromptBuilder.parseLeaderResponse(response, quarterId);
        
        logMessage(LOGGER.INFO, `Leader batch ${batchIndex}: Generated ${batchInsights.length} insights`);
        
        leaderInsights.push(...batchInsights);
      } catch (error) {
        logMessage(LOGGER.WARN, `Failed to process leader batch ${batchIndex}`, { error: error.toString() });
      }
    });
    
    return leaderInsights;
  },
  
  /**
   * Make API call to Gemini with optimized settings
   * @param {String} prompt - The prompt to send
   * @param {String} analysisType - Type of analysis for logging
   * @returns {String} - AI response text
   */
  callGeminiAPI: function(prompt, analysisType) {
    try {
      const apiKey = getApiKey();
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistency
          topK: 10,
          topP: 0.7,
          maxOutputTokens: 40096 // Increased for full examples
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
      
      logMessage(LOGGER.INFO, `API call for ${analysisType}`, {
        promptSize: prompt.length,
        promptSizeKB: Math.round(prompt.length / 1024)
      });
      
      const response = UrlFetchApp.fetch(CONFIG.GEMINI_API_URL, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      logMessage(LOGGER.INFO, 'API Response received', {
        statusCode: responseCode,
        responseLength: responseText.length,
        analysisType: analysisType
      });
      
      if (responseCode !== 200) {
        logMessage(LOGGER.ERROR, 'API returned non-200 status', {
          statusCode: responseCode,
          response: responseText.substring(0, 500)
        });
        throw new Error(`API Error ${responseCode}: ${responseText.substring(0, 200)}`);
      }
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        logMessage(LOGGER.ERROR, 'Failed to parse API response', {
          error: parseError.toString(),
          responsePreview: responseText.substring(0, 500)
        });
        throw new Error('Invalid JSON response from API');
      }
      
      // Check for API errors in response
      if (responseData.error) {
        logMessage(LOGGER.ERROR, 'API returned error', {
          error: responseData.error
        });
        throw new Error(`API Error: ${responseData.error.message || 'Unknown error'}`);
      }
      
      // Validate response structure
      if (!responseData.candidates) {
        logMessage(LOGGER.ERROR, 'Response missing candidates', {
          responseKeys: Object.keys(responseData),
          response: JSON.stringify(responseData).substring(0, 500)
        });
        throw new Error('API response missing candidates array');
      }
      
      if (!Array.isArray(responseData.candidates) || responseData.candidates.length === 0) {
        logMessage(LOGGER.ERROR, 'Candidates array is empty or invalid', {
          candidatesType: typeof responseData.candidates,
          candidatesLength: Array.isArray(responseData.candidates) ? responseData.candidates.length : 'N/A'
        });
        throw new Error('API response has no valid candidates');
      }
      
      const firstCandidate = responseData.candidates[0];
      if (!firstCandidate.content || !firstCandidate.content.parts || 
          !Array.isArray(firstCandidate.content.parts) || 
          firstCandidate.content.parts.length === 0) {
        logMessage(LOGGER.ERROR, 'Invalid candidate structure', {
          candidate: JSON.stringify(firstCandidate).substring(0, 500)
        });
        throw new Error('Invalid candidate content structure');
      }
      
      const generatedText = firstCandidate.content.parts[0].text;
      if (!generatedText) {
        logMessage(LOGGER.ERROR, 'No text in response', {
          parts: JSON.stringify(firstCandidate.content.parts).substring(0, 500)
        });
        throw new Error('No text content in API response');
      }
      
      logMessage(LOGGER.INFO, 'Successfully extracted AI response', {
        textLength: generatedText.length,
        analysisType: analysisType
      });
      
      return generatedText;
      
    } catch (error) {
      logMessage(LOGGER.ERROR, 'API call failed', { 
        error: error.toString(),
        analysisType: analysisType,
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * Validates the combined processed data
   * @param {Object} data - Combined data to validate
   */
  validateProcessedData: function(data) {
    const requiredSections = ['metrics', 'segmentMetrics', 'qualitativeInsights'];
    const missingSections = [];
    
    requiredSections.forEach(section => {
      if (!data[section] || !Array.isArray(data[section])) {
        missingSections.push(section);
      }
    });
    
    if (missingSections.length > 0) {
      throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Additional validation for improved qualitative insights
    if (data.qualitativeInsights.length > 0) {
      const invalidInsights = data.qualitativeInsights.filter(insight => {
        const titleWordCount = (insight.title || '').split(' ').filter(w => w.length > 0).length;
        const hasSampleResponses = (insight.sample_responses || '').includes(' | ');
        return titleWordCount < 2 || titleWordCount > 5 || !hasSampleResponses;
      });
      
      if (invalidInsights.length > 0) {
        logMessage(LOGGER.WARN, `Found ${invalidInsights.length} insights with invalid titles or examples`);
      }
    }
    
    logMessage(LOGGER.INFO, 'Data validation passed', {
      metrics: data.metrics.length,
      segmentMetrics: data.segmentMetrics.length,
      qualitativeInsights: data.qualitativeInsights.length,
      leaderInsights: (data.leaderInsights || []).length
    });
  }
};