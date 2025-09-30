/**
 * Debug Tools for Analyzing Prompt Size and Token Usage
 * Helps identify exactly what's consuming tokens in our prompts
 */

const PromptDebugger = {
  
  /**
   * Analyzes and breaks down prompt size by component
   * @param {Array} cleanedData - Cleaned survey data
   * @param {String} quarterId - Quarter identifier
   * @returns {Object} - Detailed size breakdown
   */
  analyzePromptSize: function(cleanedData, quarterId) {
    console.log("=== PROMPT SIZE BREAKDOWN ANALYSIS ===");
    
    const analysis = {
      input: {
        totalRows: cleanedData.length,
        quarterId: quarterId
      },
      components: {},
      textExtraction: {},
      totalSize: 0
    };
    
    // 1. Analyze text extraction first - but handle potential function call issues
    console.log("\n1. TEXT EXTRACTION ANALYSIS:");
    
    let textResponses = [];
    try {
      textResponses = PromptBuilder.extractTextResponses(cleanedData);
    } catch (error) {
      console.log("Error calling PromptBuilder.extractTextResponses:", error.toString());
      // Fallback analysis
      console.log("Using fallback analysis...");
      return this.quickAnalysis(cleanedData, quarterId);
    }
    
    analysis.textExtraction = {
      originalRows: cleanedData.length,
      textResponsesFound: textResponses.length,
      rawTextDataSize: JSON.stringify(textResponses).length,
      avgBytesPerTextResponse: textResponses.length > 0 ? Math.round(JSON.stringify(textResponses).length / textResponses.length) : 0
    };
    
    console.log(`Original rows: ${analysis.textExtraction.originalRows}`);
    console.log(`Text responses extracted: ${analysis.textExtraction.textResponsesFound}`);
    console.log(`Raw text data size: ${analysis.textExtraction.rawTextDataSize.toLocaleString()} chars`);
    console.log(`Average per text response: ${analysis.textExtraction.avgBytesPerTextResponse} chars`);
    
    // 2. Break down individual prompt components
    console.log("\n2. PROMPT COMPONENT ANALYSIS:");
    
    // Build components separately to measure each
    const components = this.buildComponentseparately(textResponses, quarterId);
    
    Object.entries(components).forEach(([name, content]) => {
      const size = content.length;
      analysis.components[name] = {
        size: size,
        percentage: 0 // Will calculate after total
      };
      analysis.totalSize += size;
      console.log(`${name}: ${size.toLocaleString()} chars`);
    });
    
    // Calculate percentages
    Object.keys(analysis.components).forEach(name => {
      analysis.components[name].percentage = ((analysis.components[name].size / analysis.totalSize) * 100).toFixed(1);
    });
    
    console.log(`\nTOTAL PROMPT SIZE: ${analysis.totalSize.toLocaleString()} chars`);
    
    // 3. Show percentage breakdown
    console.log("\n3. PERCENTAGE BREAKDOWN:");
    Object.entries(analysis.components).forEach(([name, data]) => {
      console.log(`${name}: ${data.percentage}% (${data.size.toLocaleString()} chars)`);
    });
    
    // 4. Analyze text response structure
    console.log("\n4. TEXT RESPONSE STRUCTURE ANALYSIS:");
    if (textResponses.length > 0) {
      const sampleResponse = textResponses[0];
      console.log("Sample text response structure:");
      
      Object.keys(sampleResponse).forEach(key => {
        const value = sampleResponse[key];
        const fieldSize = JSON.stringify({[key]: value}).length;
        console.log(`  ${key}: ${fieldSize} chars - "${typeof value === 'string' ? value.substring(0, 50) + '...' : value}"`);
      });
      
      // Analyze JSON overhead
      const plainTextSize = textResponses.reduce((sum, r) => {
        // Handle different response structures
        if (r.text) {
          return sum + r.text.length;
        } else if (r.responses) {
          return sum + Object.values(r.responses).join('').length;
        }
        return sum;
      }, 0);
      const jsonOverhead = analysis.textExtraction.rawTextDataSize - plainTextSize;
      console.log(`\nJSON formatting overhead: ${jsonOverhead.toLocaleString()} chars (${((jsonOverhead / analysis.textExtraction.rawTextDataSize) * 100).toFixed(1)}%)`);
    }
    
    // 5. Scaling projection
    console.log("\n5. SCALING PROJECTION TO 1000 ROWS:");
    const scalingFactor = 1000 / cleanedData.length;
    const projectedTextResponses = textResponses.length * scalingFactor;
    const projectedTextDataSize = analysis.textExtraction.rawTextDataSize * scalingFactor;
    const projectedTotalSize = analysis.totalSize + (projectedTextDataSize - analysis.textExtraction.rawTextDataSize);
    
    console.log(`Projected text responses: ${Math.round(projectedTextResponses)}`);
    console.log(`Projected text data size: ${Math.round(projectedTextDataSize / 1024)}KB`);
    console.log(`Projected total prompt: ${Math.round(projectedTotalSize / 1024)}KB`);
    
    return analysis;
  },
  
  /**
   * Builds prompt components separately to measure each one
   * @param {Array} textResponses - Extracted text responses
   * @param {String} quarterId - Quarter identifier
   * @returns {Object} - Individual components
   */
  buildComponentseparately: function(textResponses, quarterId) {
    const components = {};
    
    // Static instruction text
    components.staticInstructions = `Analyze survey text responses and extract themes + valuable feedback.

QUARTER: ${quarterId}
RESPONSES: ${textResponses.length}`;
    
    // Output structure template
    components.outputStructure = `OUTPUT STRUCTURE:
{
  "qualitativeInsights": [
    {"quarter": "${quarterId}", "insight_type": "themes", "category": "fulfilling_work", "rank": 1, "content": "Theme name", "frequency": 25, "sample_responses": "Quote1; Quote2; Quote3", "question_reference": "Original question"},
    {"quarter": "${quarterId}", "insight_type": "top_feedback", "category": "top_20_valuable", "rank": 1, "content": "Valuable feedback text", "frequency": 85, "sample_responses": null, "question_reference": "Multiple questions combined"}
  ]
}`;
    
    // Processing instructions
    components.processingInstructions = `INSTRUCTIONS:
1. Extract top 10 themes per category: fulfilling_work, empowerment_changes, leadership_support, obstacles, bold_ideas, role_clarity
2. Identify top 20 most valuable feedback pieces (score by specificity 30%, impact scope 25%, business value 20%, feasibility 15%, frequency 10%)
3. For themes: count frequency, select 3 representative quotes
4. For valuable feedback: put impact score (1-100) in frequency field`;
    
    // Analysis guidelines
    components.analysisGuidelines = `GUIDELINES:
- Group similar concepts under broader themes
- Prioritize actionable suggestions over complaints  
- Exclude vague responses like "more money", "better management"
- Focus on specific, implementable ideas with business impact`;
    
    // The actual data being sent to AI (new ultra-minimal format)
    components.textResponseData = `DATA:
${PromptBuilder.extractTextOnlyForAI(cleanedData)}`;
  },
  
  /**
   * Analyzes JSON formatting overhead specifically
   * @param {Array} textResponses - Text responses
   * @returns {Object} - JSON overhead analysis
   */
  analyzeJsonOverhead: function(textResponses) {
    console.log("\n=== JSON FORMATTING OVERHEAD ANALYSIS ===");
    
    if (textResponses.length === 0) {
      console.log("No text responses to analyze");
      return {};
    }
    
    // Calculate different data formats
    const formats = {
      currentJson: JSON.stringify(textResponses),
      compactJson: JSON.stringify(textResponses, null, 0),
      plainTextOnly: textResponses.map(r => r.text || '').join('\n'),
      csvLike: textResponses.map(r => `${r.category}|${r.text}|${r.leader}|${r.dept}`).join('\n')
    };
    
    console.log("Different format sizes:");
    Object.entries(formats).forEach(([format, content]) => {
      console.log(`${format}: ${content.length.toLocaleString()} chars`);
    });
    
    const baselineSize = formats.plainTextOnly.length;
    console.log(`\nOverhead compared to plain text:`);
    Object.entries(formats).forEach(([format, content]) => {
      if (format !== 'plainTextOnly') {
        const overhead = content.length - baselineSize;
        const overheadPercent = ((overhead / content.length) * 100).toFixed(1);
        console.log(`${format}: +${overhead.toLocaleString()} chars (+${overheadPercent}%)`);
      }
    });
    
    return formats;
  },
  
  /**
   * Quick analysis function that can be called from the main processing
   * @param {Array} cleanedData - Cleaned survey data
   * @param {String} quarterId - Quarter identifier
   */
  quickAnalysis: function(cleanedData, quarterId) {
    // Use a simplified approach since PromptBuilder.extractTextResponses might not be available
    let textResponseCount = 0;
    let totalTextSize = 0;
    
    cleanedData.forEach(response => {
      Object.keys(response).forEach(key => {
        const value = response[key];
        if (typeof value === 'string' && value.trim().length > 5) {
          textResponseCount++;
          totalTextSize += value.length;
        }
      });
    });
    
    console.log("QUICK SIZE ANALYSIS:");
    console.log(`Rows: ${cleanedData.length} → Estimated text responses: ${textResponseCount}`);
    console.log(`Total text size: ${Math.round(totalTextSize / 1024)}KB`);
    console.log(`Average per row: ${Math.round(totalTextSize / cleanedData.length)} chars`);
    
    return {
      textResponses: textResponseCount,
      totalTextSizeKB: Math.round(totalTextSize / 1024),
      avgPerRow: Math.round(totalTextSize / cleanedData.length)
    };
  }
};