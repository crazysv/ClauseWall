// Legal matcher - matches clauses against jurisdiction-specific legal rules
import { LegalRule } from './comparator';

export interface MatchedRule {
  rule: LegalRule;
  relevanceScore: number;
  matchedText: string;
}

export async function matchClauseToLegalRules(
  clauseText: string,
  jurisdiction: string
): Promise<MatchedRule[]> {
  try {
    // Load legal rules for the jurisdiction
    const legalRules = await loadLegalRules(jurisdiction);
    
    // Match clause against each rule
    const matches: MatchedRule[] = [];
    
    for (const rule of legalRules) {
      const relevanceScore = calculateRelevance(clauseText, rule);
      if (relevanceScore > 0.3) { // Threshold for relevance
        matches.push({
          rule,
          relevanceScore,
          matchedText: extractMatchedText(clauseText, rule)
        });
      }
    }
    
    // Sort by relevance score (highest first)
    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('Error matching clause to legal rules:', error);
    throw new Error('Failed to match clause to legal rules');
  }
}

async function loadLegalRules(jurisdiction: string): Promise<LegalRule[]> {
  // Placeholder - would load from database or JSON files
  return [
    {
      id: '1',
      jurisdiction,
      clauseType: 'termination',
      description: 'Unfair termination clause',
      isIllegal: false,
      riskLevel: 'dangerous',
      legalReference: 'Civil Code § 1942'
    }
  ];
}

function calculateRelevance(clauseText: string, rule: LegalRule): number {
  // Placeholder relevance calculation
  const text = clauseText.toLowerCase();
  const ruleKeywords = rule.clauseType.toLowerCase().split(' ');
  
  let matches = 0;
  ruleKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      matches++;
    }
  });
  
  return matches / ruleKeywords.length;
}

function extractMatchedText(clauseText: string, rule: LegalRule): string {
  // Placeholder - would extract the specific text that matches
  return clauseText.substring(0, 100) + '...';
}
