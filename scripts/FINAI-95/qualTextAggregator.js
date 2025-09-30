const TextAggregator = {
  
  /**
   * Enhanced aggregation with full example preservation
   * @param {Array} cleanedData - Cleaned survey data from MetricsCalculator
   * @returns {Object} - Aggregated data structure with full preserved examples
   */
  aggregateResponses: function(cleanedData) {
    logMessage(LOGGER.INFO, `Starting enhanced text aggregation for ${cleanedData.length} responses`);
    
    const aggregated = {
      byCategory: {},
      byLeader: {},
      totalResponses: cleanedData.length,
      metadata: {
        processingTime: new Date().toISOString(),
        uniqueLeaderCount: 0,
        uniqueDepartmentCount: 0,
        clusteringStats: {}
      }
    };
    
    // Enhanced question mappings with column references
    const questionMappings = [
      { 
        category: 'fulfilling_work', 
        patterns: [
          /make.*work.*fulfilling/i,
          /work.*experience.*fulfilling/i,
          /fulfilling.*work/i,
          /enjoy.*work/i,
          /satisfying.*work/i
        ],
        columnIndex: 7, // Column H
        columnRef: 'H'
      },
      { 
        category: 'role_clarity', 
        patterns: [
          /clarify.*role.*goals/i,
          /information.*support.*clarify/i,
          /understand.*role/i,
          /goals.*clear/i,
          /expectations/i
        ],
        columnIndex: 9, // Column J
        columnRef: 'J'
      },
      { 
        category: 'obstacles', 
        patterns: [
          /obstacles.*preventing/i,
          /preventing.*highest/i,
          /barriers/i,
          /challenges/i,
          /problems/i
        ],
        columnIndex: 12, // Column M
        columnRef: 'M'
      },
      { 
        category: 'empowerment_changes', 
        patterns: [
          /empowered.*role/i,
          /changes.*empowered/i,
          /feel.*empowered/i,
          /autonomy/i,
          /decision.*making/i
        ],
        columnIndex: 14, // Column O
        columnRef: 'O'
      },
      { 
        category: 'bold_ideas', 
        patterns: [
          /bold.*ideas/i,
          /ideas.*propel/i,
          /propel.*forward/i,
          /innovation/i,
          /suggestions/i
        ],
        columnIndex: 16, // Column Q
        columnRef: 'Q'
      },
      { 
        category: 'leadership_support', 
        patterns: [
          /support.*leadership/i,
          /leadership.*provide/i,
          /leadership.*support/i,
          /management.*support/i,
          /help.*succeed/i
        ],
        columnIndex: 19, // Column T
        columnRef: 'T'
      }
    ];
    
    // Initialize category structure with column references
    questionMappings.forEach(mapping => {
      aggregated.byCategory[mapping.category] = {
        clusters: [],
        totalResponses: 0,
        rawResponses: [],
        columnRef: mapping.columnRef, // Add column reference for prompts
        processingStats: {
          originalCount: 0,
          validCount: 0,
          clusteredCount: 0
        }
      };
    });
    
    // Collect unique leaders/departments
    const uniqueLeaders = new Set();
    const uniqueDepartments = new Set();
    
    // Process each response with FULL example preservation
    cleanedData.forEach(response => {
      const leaderName = this.extractLeaderName(response._steamLeader);
      const department = response._department || 'Unknown';
      
      if (leaderName) uniqueLeaders.add(leaderName);
      if (department) uniqueDepartments.add(department);
      
      // Initialize leader data if needed
      if (leaderName && !aggregated.byLeader[leaderName]) {
        aggregated.byLeader[leaderName] = {
          responseCount: 0,
          themes: {},
          department: department
        };
      }
      
      // Process each question category
      questionMappings.forEach(mapping => {
        const categoryData = aggregated.byCategory[mapping.category];
        
        // Extract text from the specific columns
        const textResponses = this.extractTextFromResponse(response, mapping);
        
        textResponses.forEach(textResponse => {
          categoryData.processingStats.originalCount++;
          
          if (this.isValidTextResponse(textResponse)) {
            categoryData.processingStats.validCount++;
            
            const cleanText = this.enhancedCleanTextResponse(textResponse);
            const normalizedText = this.normalizeForClustering(cleanText);
            
            // IMPORTANT: Store FULL original text for examples
            categoryData.rawResponses.push({
              text: cleanText,
              normalizedText: normalizedText,
              leader: leaderName,
              department: department,
              fullOriginal: textResponse, // PRESERVE COMPLETE ORIGINAL for examples
              semanticTokens: this.extractSemanticTokens(cleanText)
            });
            
            categoryData.totalResponses++;
            
            // Update leader themes with better theme extraction
            if (leaderName) {
              aggregated.byLeader[leaderName].responseCount++;
              const theme = this.enhancedExtractTheme(cleanText);
              aggregated.byLeader[leaderName].themes[theme] = 
                (aggregated.byLeader[leaderName].themes[theme] || 0) + 1;
            }
          }
        });
      });
    });
    
    // Update metadata
    aggregated.metadata.uniqueLeaderCount = uniqueLeaders.size;
    aggregated.metadata.uniqueDepartmentCount = uniqueDepartments.size;
    
    // Enhanced clustering for each category with FULL example preservation
    Object.keys(aggregated.byCategory).forEach(category => {
      const categoryData = aggregated.byCategory[category];
      if (categoryData.rawResponses.length > 0) {
        logMessage(LOGGER.INFO, `Clustering ${category}: ${categoryData.rawResponses.length} responses`);
        
        // Multi-pass clustering for higher frequency groups WITH full examples
        categoryData.clusters = this.enhancedClusterResponsesWithFullExamples(categoryData.rawResponses);
        categoryData.processingStats.clusteredCount = categoryData.clusters.length;
        
        // Log clustering effectiveness
        const avgClusterSize = categoryData.totalResponses / categoryData.clusters.length;
        const largeClusterCount = categoryData.clusters.filter(c => c.count >= 20).length;
        
        aggregated.metadata.clusteringStats[category] = {
          avgClusterSize: Math.round(avgClusterSize * 10) / 10,
          largeClusterCount: largeClusterCount,
          compressionRatio: Math.round((1 - categoryData.clusters.length / categoryData.totalResponses) * 100)
        };
        
        logMessage(LOGGER.INFO, `${category}: ${categoryData.clusters.length} clusters, ${largeClusterCount} with 20+ frequency`);
        
        delete categoryData.rawResponses; // Clean up memory
      }
    });
    
    const totalClusters = Object.values(aggregated.byCategory)
      .reduce((sum, cat) => sum + cat.clusters.length, 0);
    const totalLargeClusters = Object.values(aggregated.metadata.clusteringStats)
      .reduce((sum, stats) => sum + stats.largeClusterCount, 0);
    
    logMessage(LOGGER.INFO, `Enhanced text aggregation complete`, {
      categories: Object.keys(aggregated.byCategory).length,
      leaders: Object.keys(aggregated.byLeader).length,
      totalClusters: totalClusters,
      clustersWithTwentyPlus: totalLargeClusters
    });
    
    return aggregated;
  },
  
  /**
   * Enhanced clustering with FULL examples preservation
   * @param {Array} responses - Array of response objects
   * @returns {Array} - Array of cluster objects with COMPLETE examples
   */
  enhancedClusterResponsesWithFullExamples: function(responses) {
    if (responses.length === 0) return [];
    
    const clusters = [];
    const processed = new Set();
    
    // Sort responses by length (longer responses often more detailed/specific)
    const sortedResponses = responses.sort((a, b) => b.text.length - a.text.length);
    
    sortedResponses.forEach((response, idx) => {
      if (processed.has(idx)) return;
      
      const cluster = {
        theme: this.enhancedExtractTheme(response.text),
        count: 1,
        examples: [response.fullOriginal], // Store COMPLETE original text
        leaders: new Set([response.leader]),
        departments: new Set([response.department]),
        semanticSignature: response.semanticTokens,
        avgLength: response.text.length
      };
      
      processed.add(idx);
      
      // Multi-method similarity checking for better clustering
      sortedResponses.forEach((otherResponse, otherIdx) => {
        if (otherIdx <= idx || processed.has(otherIdx)) return;
        
        const similarities = {
          jaccard: this.calculateJaccardSimilarity(response.normalizedText, otherResponse.normalizedText),
          semantic: this.calculateSemanticSimilarity(response.semanticTokens, otherResponse.semanticTokens),
          theme: this.calculateThemeSimilarity(response.text, otherResponse.text)
        };
        
        // Combined similarity score with weights
        const combinedSimilarity = 
          (similarities.jaccard * 0.3) + 
          (similarities.semantic * 0.4) + 
          (similarities.theme * 0.3);
        
        // Lowered threshold for better grouping (20+ frequency target)
        if (combinedSimilarity > 0.45) {
          cluster.count++;
          processed.add(otherIdx);
          
          // Keep up to 8 examples for better prompt quality
          if (cluster.examples.length < 8) {
            cluster.examples.push(otherResponse.fullOriginal); // FULL original text
          }
          
          // Update cluster metadata
          if (otherResponse.leader) cluster.leaders.add(otherResponse.leader);
          if (otherResponse.department) cluster.departments.add(otherResponse.department);
          cluster.avgLength = (cluster.avgLength + otherResponse.text.length) / 2;
          
          // Merge semantic signatures
          cluster.semanticSignature = [...new Set([
            ...cluster.semanticSignature, 
            ...otherResponse.semanticTokens
          ])];
        }
      });
      
      // Convert Sets to counts for serialization
      cluster.leaderCount = cluster.leaders.size;
      cluster.departmentCount = cluster.departments.size;
      delete cluster.leaders;
      delete cluster.departments;
      
      clusters.push(cluster);
    });
    
    // Post-processing: Merge very similar clusters for even higher frequencies
    const mergedClusters = this.postProcessClustersWithExamples(clusters);
    
    // Sort by frequency (highest first)
    mergedClusters.sort((a, b) => b.count - a.count);
    
    // Return top 40 clusters (increased from 30)
    return mergedClusters.slice(0, 40);
  },
  
  /**
   * Post-process clusters to merge similar ones while preserving full examples
   * @param {Array} clusters - Initial clusters
   * @returns {Array} - Merged clusters with higher frequencies and preserved examples
   */
  postProcessClustersWithExamples: function(clusters) {
    if (clusters.length < 2) return clusters;
    
    const merged = [];
    const processed = new Set();
    
    clusters.forEach((cluster, idx) => {
      if (processed.has(idx)) return;
      
      let currentCluster = { 
        ...cluster,
        examples: [...cluster.examples] // Deep copy examples
      };
      processed.add(idx);
      
      // Look for similar clusters to merge
      clusters.forEach((otherCluster, otherIdx) => {
        if (otherIdx <= idx || processed.has(otherIdx)) return;
        
        // Check if themes are similar enough to merge
        const themeWords1 = new Set(cluster.theme.split('_'));
        const themeWords2 = new Set(otherCluster.theme.split('_'));
        const themeOverlap = [...themeWords1].filter(x => themeWords2.has(x)).length;
        const themeUnion = new Set([...themeWords1, ...themeWords2]).size;
        const themeJaccard = themeOverlap / themeUnion;
        
        // Merge if themes are very similar (60% overlap)
        if (themeJaccard > 0.6) {
          currentCluster.count += otherCluster.count;
          
          // Merge examples - keep the best ones and ensure diversity
          const allExamples = [
            ...currentCluster.examples,
            ...otherCluster.examples
          ];
          
          // Remove duplicates and keep up to 8 diverse examples
          const uniqueExamples = [...new Set(allExamples)];
          currentCluster.examples = uniqueExamples.slice(0, 8);
          
          currentCluster.leaderCount += otherCluster.leaderCount;
          currentCluster.departmentCount += otherCluster.departmentCount;
          
          // Use the theme from the larger cluster
          if (otherCluster.count > cluster.count) {
            currentCluster.theme = otherCluster.theme;
          }
          
          processed.add(otherIdx);
        }
      });
      
      merged.push(currentCluster);
    });
    
    return merged;
  },
  
  /**
   * Enhanced text cleaning that preserves MORE context for better examples
   * @param {String} text - Original text
   * @returns {String} - Cleaned but context-preserving text
   */
  enhancedCleanTextResponse: function(text) {
    let cleaned = text.trim();
    
    // MINIMAL cleaning to preserve context for examples
    // Only remove truly problematic elements
    const minimalFillers = [
      /\buh+\b/gi,
      /\bum+\b/gi,
      /\ber+\b/gi,
      /\s{2,}/g  // Multiple spaces
    ];
    
    minimalFillers.forEach(pattern => {
      if (pattern === /\s{2,}/g) {
        cleaned = cleaned.replace(pattern, ' ');
      } else {
        cleaned = cleaned.replace(pattern, '');
      }
    });
    
    cleaned = cleaned.trim();
    
    // INCREASED length limit to preserve full context for examples
    if (cleaned.length > 500) {
      // Find last complete sentence within 500 chars
      const truncated = cleaned.substring(0, 500);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');
      
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastSentenceEnd > 400) {
        cleaned = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        cleaned = truncated;
      }
    }
    
    return cleaned;
  },
  
  // Keep all other existing methods unchanged
  extractTextFromResponse: function(response, mapping) {
    const textResponses = [];
    
    // Look for fields matching the patterns
    Object.keys(response).forEach(key => {
      if (mapping.patterns.some(pattern => pattern.test(key))) {
        const value = response[key];
        if (value && typeof value === 'string') {
          textResponses.push(value);
        }
      }
    });
    
    return textResponses;
  },
  
  calculateJaccardSimilarity: function(text1, text2) {
    const tokens1 = new Set(text1.split(/\s+/));
    const tokens2 = new Set(text2.split(/\s+/));
    
    if (tokens1.size === 0 || tokens2.size === 0) return 0;
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  },
  
  calculateSemanticSimilarity: function(tokens1, tokens2) {
    if (!tokens1.length || !tokens2.length) return 0;
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = [...set1].filter(x => set2.has(x)).length;
    const union = new Set([...set1, ...set2]).size;
    
    return intersection / union;
  },
  
  calculateThemeSimilarity: function(text1, text2) {
    const theme1 = this.enhancedExtractTheme(text1);
    const theme2 = this.enhancedExtractTheme(text2);
    
    if (theme1 === theme2) return 1.0;
    
    // Check for theme word overlap
    const words1 = theme1.split('_');
    const words2 = theme2.split('_');
    const overlap = words1.filter(w => words2.includes(w)).length;
    const maxLength = Math.max(words1.length, words2.length);
    
    return maxLength > 0 ? overlap / maxLength : 0;
  },
  
  normalizeForClustering: function(text) {
    let normalized = text.toLowerCase();
    
    // Normalize common variations
    const normalizations = {
      'mgmt': 'management',
      'mgr': 'manager',
      'comm': 'communication',
      'dev': 'development',
      'info': 'information',
      'tech': 'technology',
      'sys': 'system',
      'proc': 'process',
      'dept': 'department',
      'org': 'organization'
    };
    
    Object.entries(normalizations).forEach(([short, full]) => {
      normalized = normalized.replace(new RegExp(`\\b${short}\\b`, 'g'), full);
    });
    
    return normalized;
  },
  
  extractSemanticTokens: function(text) {
    const words = text.toLowerCase().split(/\s+/);
    
    // Define semantic categories
    const semanticCategories = {
      communication: ['communication', 'talk', 'discuss', 'share', 'inform', 'update', 'meeting', 'feedback', 'transparency'],
      tools: ['tools', 'software', 'system', 'technology', 'platform', 'equipment', 'resources', 'application'],
      development: ['training', 'learning', 'development', 'skills', 'education', 'growth', 'course', 'mentor'],
      process: ['process', 'procedure', 'workflow', 'efficiency', 'streamline', 'bureaucracy', 'red_tape'],
      management: ['management', 'manager', 'leadership', 'supervisor', 'boss', 'lead', 'director'],
      culture: ['culture', 'environment', 'atmosphere', 'team', 'collaboration', 'morale', 'values'],
      recognition: ['recognition', 'appreciate', 'acknowledge', 'reward', 'praise', 'thanks', 'credit'],
      autonomy: ['autonomy', 'freedom', 'decision', 'empowered', 'control', 'choice', 'independence'],
      workload: ['workload', 'busy', 'overwhelmed', 'balance', 'time', 'bandwidth', 'capacity', 'stress'],
      clarity: ['clarity', 'clear', 'understand', 'direction', 'goals', 'expectations', 'vision', 'purpose']
    };
    
    const tokens = [];
    
    // Extract semantic tokens
    Object.entries(semanticCategories).forEach(([category, keywords]) => {
      if (keywords.some(keyword => words.includes(keyword))) {
        tokens.push(category);
      }
    });
    
    // Add important root words
    const importantWords = words.filter(w => 
      w.length > 5 && 
      !['better', 'would', 'could', 'should', 'really', 'think'].includes(w)
    );
    
    tokens.push(...importantWords.slice(0, 3));
    
    return [...new Set(tokens)]; // Remove duplicates
  },
  
  enhancedExtractTheme: function(text) {
    const words = text.toLowerCase().split(/\s+/);
    
    // Expanded theme keywords with better coverage
    const themeKeywords = {
      'communication_transparency': [
        'communication', 'communicate', 'talk', 'discuss', 'share', 'inform', 'update', 
        'transparency', 'information', 'feedback', 'meeting', 'clarity', 'clear'
      ],
      'tools_technology': [
        'tools', 'software', 'system', 'technology', 'equipment', 'resources', 'platform',
        'application', 'technical', 'tech', 'digital', 'infrastructure'
      ],
      'training_development': [
        'training', 'learn', 'development', 'skills', 'education', 'growth', 'course',
        'mentor', 'knowledge', 'professional', 'career', 'advancement'
      ],
      'recognition_appreciation': [
        'recognition', 'appreciate', 'acknowledge', 'reward', 'praise', 'thanks',
        'credit', 'valued', 'recognized', 'celebration'
      ],
      'autonomy_empowerment': [
        'autonomy', 'freedom', 'decision', 'empowered', 'control', 'choice', 'independence',
        'empower', 'decisions', 'authority', 'ownership'
      ],
      'process_efficiency': [
        'process', 'procedure', 'workflow', 'efficiency', 'streamline', 'bureaucracy',
        'improve', 'optimization', 'faster', 'easier', 'simple'
      ],
      'leadership_management': [
        'leadership', 'management', 'manager', 'leader', 'supervisor', 'boss',
        'direction', 'guidance', 'support', 'lead'
      ],
      'workload_balance': [
        'workload', 'busy', 'overwhelmed', 'balance', 'time', 'bandwidth', 'capacity',
        'stress', 'pressure', 'deadline', 'priorities'
      ],
      'culture_environment': [
        'culture', 'environment', 'atmosphere', 'team', 'collaboration', 'morale',
        'workplace', 'office', 'culture', 'values', 'belonging'
      ],
      'compensation_benefits': [
        'compensation', 'salary', 'pay', 'benefits', 'money', 'raise', 'bonus',
        'financial', 'wage', 'income', 'cost_of_living'
      ],
      'remote_flexibility': [
        'remote', 'hybrid', 'home', 'office', 'flexible', 'flexibility', 'location',
        'commute', 'work_from_home', 'telework'
      ]
    };
    
    // Find best matching theme with scoring
    let bestTheme = 'other';
    let bestScore = 0;
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const matches = keywords.filter(keyword => words.includes(keyword)).length;
      const score = matches + (keywords.some(k => words.includes(k)) ? 1 : 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestTheme = theme;
      }
    });
    
    // If no theme found, extract meaningful words
    if (bestTheme === 'other' && bestScore === 0) {
      const meaningfulWords = words.filter(w => 
        w.length > 4 && 
        !['would', 'could', 'should', 'more', 'better', 'need', 'want', 'really', 'think', 'feel'].includes(w)
      );
      
      if (meaningfulWords.length > 0) {
        return meaningfulWords.slice(0, 2).join('_');
      }
    }
    
    return bestTheme;
  },
  
  isValidTextResponse: function(value) {
    if (typeof value !== 'string') return false;
    
    const normalized = value.toLowerCase().trim();
    
    // Skip common non-responses
    const invalidPatterns = [
      /^n\/?a$/,
      /^none$/,
      /^no$/,
      /^nothing$/,
      /^nil$/,
      /^-+$/,
      /^\.+$/,
      /^na$/,
      /^not applicable$/,
      /^no comment$/,
      /^nope$/,
      /^nada$/
    ];
    
    if (invalidPatterns.some(pattern => pattern.test(normalized))) {
      return false;
    }
    
    // Require minimum length (reduced from 10 to 8)
    return value.trim().length > 8;
  },
  
  extractLeaderName: function(rawLeaderName) {
    if (!rawLeaderName || rawLeaderName === 'null' || rawLeaderName === 'undefined') {
      return null;
    }
    
    const name = rawLeaderName.split('(')[0].trim();
    const parts = name.split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    } else if (parts.length === 1) {
      return parts[0];
    }
    
    return null;
  },
  
  getAggregationStats: function(aggregatedData) {
    const stats = {
      totalCategories: Object.keys(aggregatedData.byCategory).length,
      totalLeaders: Object.keys(aggregatedData.byLeader).length,
      categoryClusters: {},
      avgClusterSize: 0,
      totalClusters: 0,
      compressionRatio: 0,
      highFrequencyClusters: 0
    };
    
    let totalOriginalResponses = 0;
    let totalClusters = 0;
    let highFrequencyCount = 0;
    
    Object.entries(aggregatedData.byCategory).forEach(([category, data]) => {
      const clusterCount = data.clusters.length;
      const responseCount = data.totalResponses;
      const clustersWithTwentyPlus = data.clusters.filter(c => c.count >= 20).length;
      
      stats.categoryClusters[category] = {
        clusters: clusterCount,
        responses: responseCount,
        highFrequency: clustersWithTwentyPlus,
        ratio: responseCount > 0 ? (clusterCount / responseCount).toFixed(2) : 0
      };
      
      totalOriginalResponses += responseCount;
      totalClusters += clusterCount;
      highFrequencyCount += clustersWithTwentyPlus;
    });
    
    stats.totalClusters = totalClusters;
    stats.highFrequencyClusters = highFrequencyCount;
    stats.avgClusterSize = totalClusters > 0 ? 
      Math.round(totalOriginalResponses / totalClusters) : 0;
    stats.compressionRatio = totalOriginalResponses > 0 ? 
      ((1 - totalClusters / totalOriginalResponses) * 100).toFixed(1) + '%' : '0%';
    
    return stats;
  }
};