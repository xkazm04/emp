/**
 * Metrics Parsers - Supporting Functions
 * Contains all parsing and helper functions for survey data processing
 * Extracted from MetricsCalculator for better modularity
 */

const MetricsParsers = {
  
  /**
   * Helper: Determines if a response is positive
   * @param {*} value - Response value
   * @returns {Boolean} - True if positive response
   */
  isPositiveResponse(value) {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return normalized === 'yes' || normalized === 'y' || 
             normalized === 'agree' || normalized === 'strongly agree' ||
             normalized === 'true' || normalized === 'top performer' ||
             normalized === 'high performer';
    }
    return value === true || value === 1;
  },
  
  /**
   * Helper: Determines if a confidence response is positive
   * @param {*} value - Response value
   * @returns {Boolean} - True if confident
   */
  isConfidentResponse(value) {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return (normalized.includes('confident') || normalized.includes('very confident')) && 
             !normalized.includes('not');
    }
    return false;
  },

  /**
   * Helper: Determines if a numeric response is positive (4-5 on 1-5 scale)
   * @param {*} value - Response value
   * @returns {Boolean} - True if 4 or 5 on scale
   */
  isPositiveNumericResponse(value) {
    const num = typeof value === 'string' ? parseInt(value) : value;
    return num === 4 || num === 5;
  },

  /**
   * Helper: Groups array by a field
   * @param {Array} array - Array to group
   * @param {String} field - Field to group by
   * @returns {Object} - Grouped object
   */
  groupBy(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  },

  /**
   * Parses top performer status from Column B
   * @param {Object} response - Individual response object
   * @returns {Boolean} - True if marked as top performer in Column B
   */
  parseTopPerformerStatus(response) {
    // Look for Column B which should contain top performer information
    const topPerformerField = Object.keys(response).find(key => {
      const keyLower = key.toLowerCase();
      return keyLower.includes('top performer') || 
             keyLower.includes('topperformer') ||
             keyLower.includes('high performer') ||
             keyLower.includes('top_performer');
    });
    
    if (topPerformerField) {
      const value = response[topPerformerField];
      return this.isPositiveResponse(value);
    }
    
    // Fallback: if no explicit top performer column, check the second column
    const columnNames = Object.keys(response);
    if (columnNames.length > 1) {
      const secondColumn = response[columnNames[1]];
      if (typeof secondColumn === 'string') {
        const normalized = secondColumn.toLowerCase().trim();
        return normalized.includes('top performer') || 
               normalized.includes('high performer') ||
               normalized === 'top' ||
               normalized === 'high';
      }
    }
    
    return false;
  },
  
  // REMOVED: Manager status parsing - no longer needed with top performer identification
  
  /**
   * Parse satisfaction score from survey responses
   * @param {Object} response - Individual response object
   * @returns {Number|null} - Satisfaction score 1-5 or null
   */
  parseSatisfactionScore(response) {
    const satisfactionField = Object.keys(response).find(key => 
      /satisfaction.*overall.*experience/i.test(key) ||
      /overall.*satisfaction/i.test(key) ||
      /satisfaction.*experience/i.test(key) ||
      /experience.*satisfaction/i.test(key) ||
      /scale.*1.*5.*satisfied/i.test(key)
    );
    
    if (satisfactionField) {
      const value = response[satisfactionField];
      
      // Handle different value formats
      if (typeof value === 'number') {
        return (value >= 1 && value <= 5) ? value : null;
      }
      
      if (typeof value === 'string') {
        // Try to parse as number first
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          return num;
        }
        
        // Handle text-based satisfaction levels
        const normalizedValue = value.toLowerCase().trim();
        const satisfactionMap = {
          'very dissatisfied': 1,
          'dissatisfied': 2, 
          'neutral': 3,
          'satisfied': 4,
          'very satisfied': 5,
          'extremely dissatisfied': 1,
          'somewhat dissatisfied': 2,
          'neither satisfied nor dissatisfied': 3,
          'somewhat satisfied': 4,
          'extremely satisfied': 5
        };
        
        if (satisfactionMap[normalizedValue] !== undefined) {
          return satisfactionMap[normalizedValue];
        }
      }
    }
    
    return null;
  },
  
  /**
   * Parse tools and resources score
   * @param {Object} response - Individual response object
   * @returns {Number|null} - Tools score 1-5 or null
   */
  parseToolsScore(response) {
    const toolsField = Object.keys(response).find(key => 
      /tools.*resources.*job.*effectively/i.test(key) ||
      /tools.*resources.*need/i.test(key) ||
      /resources.*job/i.test(key)
    );
    if (toolsField) {
      const value = response[toolsField];
      if (typeof value === 'string') {
        const num = parseInt(value);
        return (num >= 1 && num <= 5) ? num : null;
      }
      if (typeof value === 'number') {
        return (value >= 1 && value <= 5) ? value : null;
      }
    }
    return null;
  },
  
  /**
   * Parse Steam Leader name
   * @param {Object} response - Individual response object
   * @returns {String|null} - Leader name or null
   */
  parseLeaderName(response) {
    const leaderField = Object.keys(response).find(key => 
      /steam leader/i.test(key) ||
      /who.*steam.*leader/i.test(key)
    );
    if (leaderField) {
      const value = response[leaderField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse department information
   * @param {Object} response - Individual response object
   * @returns {String|null} - Department name or null
   */
  parseDepartment(response) {
    const deptField = Object.keys(response).find(key => 
      /department.*work.*within/i.test(key) ||
      /department/i.test(key)
    );
    if (deptField) {
      const value = response[deptField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse retention intent
   * @param {Object} response - Individual response object
   * @returns {String|null} - Retention response or null
   */
  parseRetentionIntent(response) {
    const retentionField = Object.keys(response).find(key => 
      /see yourself.*company.*year/i.test(key) ||
      /company.*year/i.test(key)
    );
    if (retentionField) {
      const value = response[retentionField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse mission understanding
   * @param {Object} response - Individual response object
   * @returns {String|null} - Mission understanding response or null
   */
  parseMissionUnderstanding(response) {
    const missionField = Object.keys(response).find(key => 
      /understand.*mission.*role/i.test(key) ||
      /mission.*role/i.test(key) ||
      /clearly.*understand.*mission/i.test(key)
    );
    if (missionField) {
      const value = response[missionField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse leadership confidence
   * @param {Object} response - Individual response object
   * @returns {Number|String|null} - Leadership confidence response or null
   */
  parseLeadershipConfidence(response) {
    const confidenceField = Object.keys(response).find(key => 
      /confident.*leadership.*ability/i.test(key) ||
      /confident.*leadership/i.test(key) ||
      /leadership.*ability.*guide/i.test(key)
    );
    if (confidenceField) {
      const value = response[confidenceField];
      if (typeof value === 'string') {
        // Try to parse as number first (1-5 scale)
        const num = parseInt(value);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          return num;
        }
        return value.trim();
      }
      if (typeof value === 'number') {
        return (value >= 1 && value <= 5) ? value : null;
      }
    }
    return null;
  },
  
  /**
   * Parse empowerment responses
   * @param {Object} response - Individual response object
   * @returns {String|null} - Empowerment response or null
   */
  parseEmpowerment(response) {
    const empowermentField = Object.keys(response).find(key => 
      /empowered.*decisions.*results/i.test(key) ||
      /empowered.*make.*decisions/i.test(key) ||
      /feel.*empowered/i.test(key)
    );
    if (empowermentField) {
      const value = response[empowermentField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse ideas valued responses
   * @param {Object} response - Individual response object
   * @returns {String|null} - Ideas valued response or null
   */
  parseIdeasValued(response) {
    const ideasField = Object.keys(response).find(key => 
      /ideas.*valued.*acted/i.test(key) ||
      /ideas.*valued/i.test(key)
    );
    if (ideasField) {
      const value = response[ideasField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  },
  
  /**
   * Parse recognition responses
   * @param {Object} response - Individual response object
   * @returns {String|null} - Recognition response or null
   */
  parseRecognition(response) {
    const recognitionField = Object.keys(response).find(key => 
      /recognized.*contributions/i.test(key) ||
      /adequately.*recognized/i.test(key) ||
      /feel.*recognized/i.test(key)
    );
    if (recognitionField) {
      const value = response[recognitionField];
      return typeof value === 'string' ? value.trim() : null;
    }
    return null;
  }
};