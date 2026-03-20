export interface ParsedCommand {
  intent: string;
  params: Record<string, string | number>;
  confidence: number;
  originalText: string;
  language: "hi" | "en" | "hinglish";
}

const COMMAND_PATTERNS: Array<{
  intent: string;
  patterns: RegExp[];
  extract?: (match: RegExpMatchArray) => Record<string, string | number>;
}> = [
  {
    intent: "ANALYZE",
    patterns: [
      /(?:contract|agreement|document)\s*(?:check|scan|analyze|dekh)/i,
      /(?:check|scan|analyze)\s*(?:karo|kar\s*do|kijiye)/i,
      /(?:mera|yeh|ye)\s*(?:contract|agreement)\s*(?:check|scan)/i,
    ],
  },
  {
    intent: "NAVIGATE_CLAUSE",
    patterns: [
      /clause\s*(\d+)/i,
      /(?:clause|section)\s*(?:number\s*)?(\d+)\s*(?:dikhao|kholo|show|open)?/i,
      /(\d+)(?:wa|vi|th|st|nd|rd)\s*clause/i,
    ],
    extract: (match) => ({ clause_number: parseInt(match[1]) }),
  },
  {
    intent: "EXPLAIN",
    patterns: [
      /(?:explain|samjhao|batao|kya\s*matlab)/i,
      /(?:simple|easy|asan)\s*(?:mein|me)\s*(?:batao|samjhao)/i,
      /(?:eli5|explain\s*like)/i,
    ],
  },
  {
    intent: "NEGOTIATE",
    patterns: [
      /(?:negotiate|negotiation|kya\s*bolu)/i,
      /(?:playbook|script)\s*(?:dikhao|show)/i,
      /(?:kaise|how)\s*(?:negotiate|deal)/i,
    ],
  },
  {
    intent: "LEGAL_NOTICE",
    patterns: [
      /(?:legal\s*notice|notice\s*bhejo|demand\s*letter)/i,
      /(?:notice|letter)\s*(?:banao|generate|create)/i,
    ],
  },
  {
    intent: "SCORE",
    patterns: [
      /(?:score|risk)\s*(?:dikhao|show|kitna|kya)/i,
      /(?:kitna|how\s*much)\s*(?:risk|danger)/i,
      /(?:score\s*card|scorecard)\s*(?:dikhao|show)/i,
    ],
  },
  {
    intent: "DNA",
    patterns: [
      /(?:dna|fingerprint)\s*(?:dikhao|show)/i,
      /(?:contract\s*dna)/i,
    ],
  },
  {
    intent: "XRAY",
    patterns: [
      /(?:x-ray|xray)\s*(?:mode|dikhao|show|chalu)/i,
    ],
  },
  {
    intent: "SHARE",
    patterns: [
      /(?:share|link)\s*(?:karo|do|copy)/i,
      /(?:copy\s*link|share\s*link)/i,
    ],
  },
  {
    intent: "READ_ALOUD",
    patterns: [
      /(?:padh|read)\s*(?:ke|kar)?\s*(?:sunao|aloud)/i,
      /(?:sunao|bolo|speak|read\s*out)/i,
    ],
  },
  {
    intent: "LANGUAGE_HINDI",
    patterns: [
      /(?:hindi|hinglish)\s*(?:mein|me|main)\s*(?:bolo|batao|samjhao)/i,
      /(?:switch|change)\s*(?:to)?\s*hindi/i,
    ],
  },
  {
    intent: "LANGUAGE_ENGLISH",
    patterns: [
      /(?:english|angrezi)\s*(?:mein|me|main)\s*(?:bolo|batao)/i,
      /(?:switch|change)\s*(?:to)?\s*english/i,
    ],
  },
  {
    intent: "STOP",
    patterns: [
      /(?:ruko|stop|chup|bas|enough|band\s*karo)/i,
    ],
  },
  {
    intent: "HELP",
    patterns: [
      /(?:help|madad|kya\s*kar\s*sakte|commands|what\s*can\s*you)/i,
    ],
  },
  {
    intent: "ESCAPE",
    patterns: [
      /(?:escape|niklo|bahar|exit)\s*(?:plan|kaise)/i,
    ],
  },
  {
    intent: "BATTLE",
    patterns: [
      /(?:battle|compare|comparison|tulna)/i,
    ],
  },
];

export function parseCommand(text: string): ParsedCommand {
  const lower = text.toLowerCase().trim();

  // Detect language
  const hindiPattern = /[\u0900-\u097F]/;
  const isHindi = hindiPattern.test(text);
  const hinglishWords = ["karo", "hai", "kya", "mein", "dikhao", "batao", "samjhao"];
  const isHinglish = !isHindi && hinglishWords.some((w) => lower.includes(w));
  const language = isHindi ? "hi" as const : isHinglish ? "hinglish" as const : "en" as const;

  for (const cmd of COMMAND_PATTERNS) {
    for (const pattern of cmd.patterns) {
      const match = lower.match(pattern);
      if (match) {
        const params = cmd.extract ? cmd.extract(match) : {};
        return {
          intent: cmd.intent,
          params,
          confidence: 0.85,
          originalText: text,
          language,
        };
      }
    }
  }

  // No command matched — treat as a question
  return {
    intent: "QUESTION",
    params: { question: text },
    confidence: 0.5,
    originalText: text,
    language,
  };
}