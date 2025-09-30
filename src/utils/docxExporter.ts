import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { SurveyData, QualitativeInsight, Leader } from '../types/survey';

// Color palette for the document (matching Groupon style)
const COLORS = {
  primary: '000000', // Black for main headings (Heading 1)
  secondary: '34a853', // Green for subheadings (Heading 5)
  success: '34a853', // Green
  warning: 'D97706', // Amber
  danger: 'DC2626', // Red
  text: '000000', // Black text
  lightText: '666666', // Gray text
  tableHeaderGreen: '34a853', // Green table headers
  tableHeaderBlue: '4285f4', // Blue table headers
  tableHeaderTeal: '1DB584', // Teal table headers
  tableBorder: 'CCCCCC', // Light gray for borders
};

// Font configurations (matching requirements)
const FONTS = {
  heading: 'DM Serif Display', // For headings
  body: 'Nunito Sans', // For normal text
};

// Typography sizes (in half-points for docx)
const SIZES = {
  heading1: 40, // 20pt for Heading 1
  heading5: 24, // 12pt for Heading 5
  body: 20, // 10pt for normal text
};

// Helper function to parse HTML content to plain text with basic formatting
function parseHtmlToText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<div[^>]*>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '$1')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '$1')
    .replace(/<span[^>]*class=['"]metric-value['"][^>]*>(.*?)<\/span>/g, '$1')
    .replace(/<span[^>]*class=['"]employee-voice['"][^>]*>(.*?)<\/span>/g, '$1')
    .replace(/<span[^>]*class=['"]challenge-indicator['"][^>]*>(.*?)<\/span>/g, '$1')
    .replace(/<span[^>]*class=['"]strength-indicator['"][^>]*>(.*?)<\/span>/g, '$1')
    .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// Create title page
function createTitlePage(data: SurveyData): Paragraph[] {
  const quarter = data.metadata?.quarter || 'N/A';
  const generatedDate = data.metadata?.generatedDate || new Date().toISOString().split('T')[0];
  const totalResponses = data.metadata?.totalResponses || 0;

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Employee Survey Report',
          size: SIZES.heading1, // 20pt
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${quarter} Results`,
          size: SIZES.heading5, // 12pt
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${generatedDate}`,
          size: SIZES.body, // 10pt
          color: COLORS.lightText,
          font: FONTS.body,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Total Responses: ${totalResponses.toLocaleString()}`,
          size: SIZES.body, // 10pt
          color: COLORS.lightText,
          font: FONTS.body,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
  ];
}

// Create executive summary section
function createExecutiveSummary(data: SurveyData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Executive Summary',
          size: SIZES.heading1, // 20pt - Heading 1
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.executiveSummary?.overview) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Overview',
            size: SIZES.heading5, // 12pt - Heading 5
            bold: true,
            color: COLORS.secondary,
            font: FONTS.heading,
          }),
        ],
        heading: HeadingLevel.HEADING_5,
        spacing: { before: 300, after: 200 },
      })
    );

    const overviewText = parseHtmlToText(data.executiveSummary.overview);
    const overviewParagraphs = overviewText.split('\n').filter(p => p.trim());
    
    overviewParagraphs.forEach(text => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text.trim(),
              size: 20, // 10pt - Normal text
              font: FONTS.body,
              color: COLORS.text,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  return paragraphs;
}

// Create key findings section
function createKeyFindings(data: SurveyData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Key Findings',
          size: SIZES.heading1, // 20pt - Heading 1
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.executiveSummary?.keyFindings) {
    data.executiveSummary.keyFindings.forEach((finding, index) => {
      // Extract title from bold tag
      const titleMatch = finding.match(/<b>(.*?)<\/b>/);
      const title = titleMatch ? titleMatch[1] : `Finding ${index + 1}`;
      
      // Remove the title from content
      const content = finding.replace(/<b>.*?<\/b>\s*/, '');
      const contentText = parseHtmlToText(content);

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              size: SIZES.heading5, // 12pt - Heading 5
              bold: true,
              color: COLORS.secondary,
              font: FONTS.heading,
            }),
          ],
          heading: HeadingLevel.HEADING_5,
          spacing: { before: 300, after: 200 },
        })
      );

      const contentParagraphs = contentText.split('\n').filter(p => p.trim());
      contentParagraphs.forEach(text => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text.trim(),
                size: SIZES.body, // 10pt - Normal text
                font: FONTS.body,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      });
    });
  }

  return paragraphs;
}

// Create performance metrics table
function createPerformanceMetricsTable(data: SurveyData): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Performance Metrics Overview',
          size: SIZES.heading1,
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.performanceMetrics && data.performanceMetrics.length > 0) {
    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      columnWidths: [6000, 2000, 2000], // Set specific column widths for better control
      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
        left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
        right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
      },
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Question',
                      bold: true,
                      color: 'FFFFFF',
                      size: SIZES.body,
                      font: FONTS.body,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: COLORS.tableHeaderGreen,
              },
              width: {
                size: 60,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 200,
                bottom: 200,
                left: 300,
                right: 300,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Overall',
                      bold: true,
                      color: 'FFFFFF',
                      size: SIZES.body,
                      font: FONTS.body,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: COLORS.tableHeaderGreen,
              },
              width: {
                size: 20,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 200,
                bottom: 200,
                left: 300,
                right: 300,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Top Performers',
                      bold: true,
                      color: 'FFFFFF',
                      size: SIZES.body,
                      font: FONTS.body,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: COLORS.tableHeaderGreen,
              },
              width: {
                size: 20,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 200,
                bottom: 200,
                left: 300,
                right: 300,
              },
            }),
          ],
        }),
        // Data rows with alternating colors and proper styling
        ...data.performanceMetrics.map((metric, index) => 
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: metric.metricName,
                        size: SIZES.body,
                        font: FONTS.body,
                      }),
                    ],
                  }),
                ],
                shading: index % 2 === 0 ? {
                  fill: 'F8F9FA',
                } : undefined,
                width: {
                  size: 60,
                  type: WidthType.PERCENTAGE,
                },
                margins: {
                  top: 150,
                  bottom: 150,
                  left: 300,
                  right: 300,
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${Math.round(metric.overall?.values?.[0] || 0)}%`,
                        size: SIZES.body,
                        bold: true,
                        color: getScoreColor(metric.overall?.values?.[0] || 0),
                        font: FONTS.body,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: index % 2 === 0 ? {
                  fill: 'F8F9FA',
                } : undefined,
                width: {
                  size: 20,
                  type: WidthType.PERCENTAGE,
                },
                margins: {
                  top: 150,
                  bottom: 150,
                  left: 300,
                  right: 300,
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${Math.round(metric.topPerformers?.values?.[0] || 0)}%`,
                        size: SIZES.body,
                        color: COLORS.success,
                        font: FONTS.body,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: index % 2 === 0 ? {
                  fill: 'F8F9FA',
                } : undefined,
                width: {
                  size: 20,
                  type: WidthType.PERCENTAGE,
                },
                margins: {
                  top: 150,
                  bottom: 150,
                  left: 300,
                  right: 300,
                },
              }),
            ],
          })
        ),
      ],
    });

    elements.push(table);
  }

  return elements;
}

// Create leadership assessment section with stats tables
function createLeadershipAssessment(data: SurveyData): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Leadership Assessment',
          size: SIZES.heading1,
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.leaders && data.leaders.length > 0) {
    data.leaders.forEach(leader => {
      // Leader name heading
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: leader.name,
              size: SIZES.heading5,
              bold: true,
              color: COLORS.secondary,
              font: FONTS.heading,
            }),
          ],
          heading: HeadingLevel.HEADING_5,
          spacing: { before: 300, after: 200 },
        })
      );

      // Create stats table for the leader
      if (leader.keyStats) {
        const statsTable = createLeaderStatsTable(leader);
        elements.push(statsTable);
      }

      // Add narrative summary
      if (leader.narrative?.summary) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Assessment Summary:',
                size: SIZES.body,
                bold: true,
                font: FONTS.body,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        const summaryText = parseHtmlToText(leader.narrative.summary);
        const summaryParagraphs = summaryText.split('\n').filter(p => p.trim());
        
        summaryParagraphs.forEach(text => {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: text.trim(),
                  size: SIZES.body,
                  font: FONTS.body,
                }),
              ],
              spacing: { after: 150 },
            })
          );
        });
      }
    });
  }

  return elements;
}

// Create leader stats table
function createLeaderStatsTable(leader: Leader): Table {
  const rows: TableRow[] = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Metric',
                  bold: true,
                  color: 'FFFFFF',
                  size: SIZES.body,
                  font: FONTS.body,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: COLORS.tableHeaderGreen,
          },
          width: {
            size: 50,
            type: WidthType.PERCENTAGE,
          },
          margins: {
            top: 200,
            bottom: 200,
            left: 300,
            right: 300,
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Current Value',
                  bold: true,
                  color: 'FFFFFF',
                  size: SIZES.body,
                  font: FONTS.body,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: COLORS.tableHeaderGreen,
          },
          width: {
            size: 25,
            type: WidthType.PERCENTAGE,
          },
          margins: {
            top: 200,
            bottom: 200,
            left: 300,
            right: 300,
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Top Performers',
                  bold: true,
                  color: 'FFFFFF',
                  size: SIZES.body,
                  font: FONTS.body,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: COLORS.tableHeaderGreen,
          },
          width: {
            size: 25,
            type: WidthType.PERCENTAGE,
          },
          margins: {
            top: 200,
            bottom: 200,
            left: 300,
            right: 300,
          },
        }),
      ],
    }),
  ];

  // Add stat rows
  if (leader.keyStats) {
    Object.entries(leader.keyStats).forEach(([statName, statData], index) => {
      const currentValue = statData.values[0] || 0;
      const topPerformerValue = statData.topPerformerValues[0] || 0;
      const formattedStatName = statName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formattedStatName,
                      size: SIZES.body,
                      font: FONTS.body,
                    }),
                  ],
                }),
              ],
              shading: index % 2 === 0 ? {
                fill: 'F8F9FA',
              } : undefined,
              width: {
                size: 50,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 150,
                bottom: 150,
                left: 300,
                right: 300,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${currentValue.toFixed(1)}${statData.unit}`,
                      size: SIZES.body,
                      font: FONTS.body,
                      color: getScoreColor(currentValue),
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: index % 2 === 0 ? {
                fill: 'F8F9FA',
              } : undefined,
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 150,
                bottom: 150,
                left: 300,
                right: 300,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${topPerformerValue.toFixed(1)}${statData.unit}`,
                      size: SIZES.body,
                      font: FONTS.body,
                      color: COLORS.success,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: index % 2 === 0 ? {
                fill: 'F8F9FA',
              } : undefined,
              width: {
                size: 25,
                type: WidthType.PERCENTAGE,
              },
              margins: {
                top: 150,
                bottom: 150,
                left: 300,
                right: 300,
              },
            }),
          ],
        })
      );
    });
  }

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [5000, 2500, 2500], // Metric (50%), Current Value (25%), Top Performers (25%)
    margins: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
      left: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
      right: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
    },
  });
}

// Create strategic implications section
function createStrategicImplications(data: SurveyData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Strategic Implications',
          size: SIZES.heading1,
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.executiveSummary?.strategicImplication) {
    const strategicText = parseHtmlToText(data.executiveSummary.strategicImplication);
    const strategicParagraphs = strategicText.split('\n').filter(p => p.trim());
    
    strategicParagraphs.forEach(text => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text.trim(),
              size: SIZES.body,
              font: FONTS.body,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  return paragraphs;
}

// Create qualitative insights section
function createQualitativeInsights(data: SurveyData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Qualitative Insights',
          size: SIZES.heading1,
          bold: true,
          color: COLORS.primary,
          font: FONTS.heading,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    }),
  ];

  if (data.qualitativeInsights && data.qualitativeInsights.length > 0) {
    // Group insights by category
    const insightsByCategory = data.qualitativeInsights.reduce((acc: Record<string, QualitativeInsight[]>, insight) => {
      if (!acc[insight.category]) {
        acc[insight.category] = [];
      }
      acc[insight.category].push(insight);
      return acc;
    }, {});

    // Process each category
    Object.keys(insightsByCategory).forEach(category => {
      // Category heading
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              size: SIZES.heading5,
              bold: true,
              color: COLORS.secondary,
              font: FONTS.heading,
            }),
          ],
          heading: HeadingLevel.HEADING_5,
          spacing: { before: 300, after: 200 },
        })
      );

      // Process insights in this category (sorted by frequency - highest first)
      // Get the most recent quarter key dynamically
      const getMostRecentQuarter = (insight: QualitativeInsight) => {
        if (!insight.timeseries) return null;
        const quarters = Object.keys(insight.timeseries);
        return quarters.length > 0 ? quarters[0] : null;
      };
      
      const getInsightFrequency = (insight: QualitativeInsight) => {
        const quarter = getMostRecentQuarter(insight);
        return quarter && insight.timeseries ? insight.timeseries[quarter]?.frequency || 0 : 0;
      };
      
      const categoryInsights = insightsByCategory[category].sort((a, b) => 
        getInsightFrequency(b) - getInsightFrequency(a)
      );
      
      categoryInsights.forEach((insight) => {
        // Insight title and content
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: insight.title ? `${insight.title}: ` : '',
                size: SIZES.body,
                bold: true,
                font: FONTS.body,
              }),
              new TextRun({
                text: insight.content,
                size: SIZES.body,
                font: FONTS.body,
              }),
            ],
            spacing: { after: 150 },
          })
        );

        // Frequency information (using dynamic quarter)
        const frequency = getInsightFrequency(insight);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Frequency: ${frequency} mentions`,
                size: SIZES.body,
                italics: true,
                color: COLORS.lightText,
                font: FONTS.body,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Sample responses
        if (insight.sampleResponses && insight.sampleResponses.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Sample responses:',
                  size: SIZES.body,
                  bold: true,
                  font: FONTS.body,
                }),
              ],
              spacing: { after: 100 },
            })
          );

          insight.sampleResponses.slice(0, 3).forEach((response: string) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• "${response}"`,
                    size: SIZES.body,
                    italics: true,
                    font: FONTS.body,
                  }),
                ],
                spacing: { after: 75 },
              })
            );
          });
        }

        // Add spacing between insights
        paragraphs.push(
          new Paragraph({
            children: [],
            spacing: { after: 200 },
          })
        );
      });
    });
  }

  return paragraphs;
}

// Helper function to get color based on score
function getScoreColor(score: number): string {
  if (score >= 70) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
}

// Main export function
export async function exportToDocx(data: SurveyData): Promise<void> {
  try {
    const quarter = data.metadata?.quarter || 'Survey_Report';
    const filename = `Employee_Survey_Report_${quarter}_${new Date().toISOString().split('T')[0]}.docx`;

    const doc = new Document({
      title: `Employee Survey Report - ${quarter}`,
      creator: 'Employee Survey System',
      description: `Comprehensive survey analysis for ${quarter}`,
      sections: [
        {
          children: [
            ...createTitlePage(data),
            ...createExecutiveSummary(data),
            ...createKeyFindings(data),
            ...createPerformanceMetricsTable(data),
            ...createLeadershipAssessment(data),
            ...createStrategicImplications(data),
            ...createQualitativeInsights(data),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buffer)], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw new Error('Failed to export document. Please try again.');
  }
}