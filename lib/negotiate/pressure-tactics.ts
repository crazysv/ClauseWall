// ============================================
// PRESSURE TACTICS — STATIC DATABASE
// Pure data + detection logic. No AI calls.
// ============================================

import type { PressureTactic, DetectedTactic, PressureTacticType } from "@/types";

// ============================================
// FILLER WORDS TO STRIP FOR MATCHING
// ============================================

const FILLER_WORDS = new Set([
  "just", "well", "you know", "basically", "like", "actually",
  "honestly", "literally", "simply", "really", "quite", "rather",
  "so", "um", "uh", "okay", "ok", "right", "look", "see",
  "listen", "hey", "hi", "sir", "madam", "ji", "bhai", "sahab",
]);

// ============================================
// COMPLETE PRESSURE TACTICS DATABASE
// ============================================

export const PRESSURE_TACTICS: PressureTactic[] = [
  {
    type: "false_consensus",
    name: "False Consensus",
    description: "They claim this is standard practice when it may not be",
    counter_strategy: "Ask for specifics. What's 'standard' often isn't legal.",
    legal_context: null,
    trigger_phrases: [
      "this is standard", "this is normal", "this is how it's done",
      "standard practice", "standard in the industry", "everyone does this",
      "standard contract", "standard terms", "nothing unusual",
      "yeh toh standard hai", "sab jagah aisa hi hota hai",
      "normal procedure", "regular terms", "usual terms",
      "market practice", "common practice", "industry standard",
      "all our contracts have this", "we never change this",
      "template contract", "boilerplate"
    ],
    counter_scripts: [
      {
        they_say: "This is our standard contract",
        you_say: "I understand this is your template. However, Clause X exceeds legal limits under the applicable law. Standard doesn't mean legal. Can we adjust this?",
        tone: "polite",
        legal_backing: null
      },
      {
        they_say: "This is how it's done everywhere",
        you_say: "I appreciate you saying that, but I've reviewed contracts in this area and the standard deposit is 2 months, not 6. I'm happy to match the market standard.",
        tone: "assertive",
        legal_backing: null
      },
      {
        they_say: "We never change our contracts",
        you_say: "I understand templates save time. But a contract that doesn't comply with current law puts both of us at risk. These changes protect you too.",
        tone: "polite",
        legal_backing: null
      }
    ]
  },
  {
    type: "ultimatum",
    name: "Ultimatum",
    description: "They refuse to negotiate and demand acceptance",
    counter_strategy: "Stay calm. Ask for specifics. Refusal to negotiate is itself a red flag.",
    legal_context: "Under Consumer Protection Act 2019, refusing to negotiate unfair terms can be actionable.",
    trigger_phrases: [
      "take it or leave it", "non-negotiable", "final offer",
      "this is not negotiable", "we don't change our contracts",
      "accept or reject", "no changes possible", "fixed terms",
      "yeh change nahi hoga", "aise hi sign karo",
      "last offer", "best I can do", "my hands are tied",
      "not open for discussion", "this is final",
      "sign it as is", "no modifications allowed",
      "isko change nahi kar sakte"
    ],
    counter_scripts: [
      {
        they_say: "Take it or leave it",
        you_say: "I'd like to proceed, but I need these specific changes to Clause X. What flexibility do you have on that particular point?",
        tone: "firm",
        legal_backing: null
      },
      {
        they_say: "Non-negotiable",
        you_say: "Could you put in writing that you're refusing to negotiate these terms? Under Consumer Protection Act 2019, refusing to negotiate unfair terms is itself actionable.",
        tone: "assertive",
        legal_backing: "Consumer Protection Act 2019, Section 2(46)"
      },
      {
        they_say: "My hands are tied",
        you_say: "I understand you may have constraints. Could we speak with someone who has the authority to modify these terms? I want to make this work.",
        tone: "polite",
        legal_backing: null
      }
    ]
  },
  {
    type: "bandwagon",
    name: "Bandwagon",
    description: "They claim everyone accepts these terms",
    counter_strategy: "What others do doesn't change your rights. Exercise your right to review.",
    legal_context: null,
    trigger_phrases: [
      "everyone signs this", "all tenants sign this",
      "nobody has ever complained", "hundreds of people have signed",
      "no one has had a problem", "sab log sign karte hain",
      "koi problem nahi aaya aaj tak", "all employees agree",
      "nobody objects", "100% acceptance rate",
      "every tenant before you signed", "all our clients agree",
      "no one has ever asked for changes"
    ],
    counter_scripts: [
      {
        they_say: "Everyone signs this",
        you_say: "I'd like to take 48 hours to review with my advisor. This is my right and I'd like to exercise it.",
        tone: "polite",
        legal_backing: null
      },
      {
        they_say: "Nobody has ever complained",
        you_say: "That's good to hear. But I'd still like to understand each clause before I sign. A few minutes of review now saves both of us problems later.",
        tone: "polite",
        legal_backing: null
      }
    ]
  },
  {
    type: "minimization",
    name: "Minimization",
    description: "They downplay the importance of concerning clauses",
    counter_strategy: "If it's not important, it should be easy to remove.",
    legal_context: null,
    trigger_phrases: [
      "just a formality", "don't worry about it", "it's nothing",
      "not important", "just sign", "routine paperwork",
      "formality hai bas", "tension mat lo", "bas sign kar do",
      "mere liye kar do", "abhi sign kar lo phir baad mein dekhte hain",
      "it doesn't really apply", "we never enforce this",
      "just standard language", "ignore that part",
      "pro forma clause", "nobody reads that part",
      "yeh toh formality hai"
    ],
    counter_scripts: [
      {
        they_say: "It's just a formality",
        you_say: "If it's just a formality, then you won't mind removing it from the contract? A clause that's 'never enforced' should be easy to delete.",
        tone: "questioning",
        legal_backing: null
      },
      {
        they_say: "Don't worry about it",
        you_say: "I appreciate you saying that, but I'm signing a legal document. Everything in it is binding regardless of intent. Let's make the written terms match what we've agreed verbally.",
        tone: "firm",
        legal_backing: null
      }
    ]
  },
  {
    type: "urgency",
    name: "False Urgency",
    description: "They pressure you to sign immediately without time to review",
    counter_strategy: "Real deals can wait for a day of review. Artificial urgency is a red flag.",
    legal_context: null,
    trigger_phrases: [
      "sign today only", "offer expires", "someone else is interested",
      "can't hold this", "limited time", "need it now",
      "aaj hi sign karna padega", "kal koi aur le jayega",
      "bohot demand hai", "waiting list hai",
      "prices going up tomorrow", "this deal won't last",
      "I have 3 other people interested", "first come first served",
      "another party is coming tomorrow", "deadline is today",
      "jaldi karo", "time nahi hai", "abhi decide karo"
    ],
    counter_scripts: [
      {
        they_say: "Sign today or someone else will take it",
        you_say: "I understand there's demand. I'd like to proceed but need to review the terms first. If it's a good property/deal, a day of review shouldn't change that.",
        tone: "polite",
        legal_backing: null
      },
      {
        they_say: "Limited time offer",
        you_say: "I appreciate the urgency, but I never sign contracts without at least 24 hours of review. This protects both of us. I'll have my response ready by tomorrow.",
        tone: "firm",
        legal_backing: null
      }
    ]
  },
  {
    type: "authority_appeal",
    name: "Authority Appeal",
    description: "They cite authority figures or legal teams to shut down discussion",
    counter_strategy: "Ask to see the specific law or legal opinion they're citing.",
    legal_context: null,
    trigger_phrases: [
      "my lawyer said", "our legal team approved", "legally required",
      "government regulation", "court order", "RBI says",
      "as per law", "mandatory by law", "legal requirement",
      "hamare advocate ne bola", "kanoon ke hisaab se",
      "compliance requirement", "regulatory mandate",
      "the registrar requires this", "our CA said",
      "government ne bola hai"
    ],
    counter_scripts: [
      {
        they_say: "Our legal team has approved this",
        you_say: "That's good. Could you share which specific law mandates this clause? I'd like to verify independently.",
        tone: "questioning",
        legal_backing: null
      },
      {
        they_say: "Legally required",
        you_say: "Could you point me to the specific section of the law that requires this? I want to make sure we're both on the same page about what's mandatory.",
        tone: "questioning",
        legal_backing: null
      }
    ]
  },
  {
    type: "emotional",
    name: "Emotional Manipulation",
    description: "They use trust, relationships, or guilt to bypass rational review",
    counter_strategy: "Separate emotions from the contract. Trust doesn't replace written terms.",
    legal_context: null,
    trigger_phrases: [
      "trust me", "I'm doing you a favor", "don't you trust me",
      "we're like family", "personal guarantee", "on my word",
      "mera bharosa karo", "main dhoka nahi dunga",
      "I've been doing this for 20 years", "my reputation",
      "I'm hurt you don't trust me", "you're overthinking this",
      "yeh sab formalities hain", "rishtey mein toh trust hota hai",
      "aap toh apne hain"
    ],
    counter_scripts: [
      {
        they_say: "Trust me, I won't enforce this",
        you_say: "I trust you completely. But contracts outlast people. Let's make sure the written terms match what we've agreed verbally.",
        tone: "polite",
        legal_backing: null
      },
      {
        they_say: "We're like family",
        you_say: "I value our relationship too, which is why I want a fair contract that neither of us will regret. Good contracts make good relationships.",
        tone: "polite",
        legal_backing: null
      }
    ]
  },
  {
    type: "false_legal_claim",
    name: "False Legal Claim",
    description: "They make specific legal claims that may not be accurate",
    counter_strategy: "Verify every legal claim against actual statutes. This triggers the bluff detector.",
    legal_context: "Always verify against structured_rules database",
    trigger_phrases: [
      "the law requires", "legally mandatory", "government rule",
      "court has ruled", "Supreme Court says", "act says",
      "section says", "as per the act", "rule says",
      "RBI guideline", "RERA requires", "registration requires",
      "stamp duty requires", "kanoon kehta hai",
      "law mein likha hai", "government ne rule banaya hai",
      "income tax rule hai", "GST mein mandatory hai",
      "under the law you must", "legally you have to"
    ],
    counter_scripts: [
      {
        they_say: "The law requires 6 months deposit",
        you_say: "Actually, under the applicable Rent Control Act, the maximum deposit is typically 2-3 months. I've verified this. Would you like me to show you the section?",
        tone: "assertive",
        legal_backing: "State-specific Rent Control Acts"
      },
      {
        they_say: "It's mandatory under the law",
        you_say: "I'd appreciate if you could share the specific section number. I want to verify this independently before we proceed.",
        tone: "questioning",
        legal_backing: null
      }
    ]
  },
  {
    type: "information_asymmetry",
    name: "Information Asymmetry",
    description: "They try to exploit your lack of legal knowledge",
    counter_strategy: "You have a right to understand everything you sign. Complexity is not a reason to skip review.",
    legal_context: "Indian Contract Act, Section 16 — Undue influence includes taking advantage of mental or educational capacity",
    trigger_phrases: [
      "you won't understand", "it's complicated", "legal language",
      "you need a lawyer for that", "don't worry about the fine print",
      "technical terms", "samajh nahi aaega", "bahut complicated hai",
      "leave the legal stuff to us", "we'll handle everything",
      "this is above your pay grade", "ye legal matter hai",
      "apko samajhne ki zarurat nahi", "hum dekh lenge"
    ],
    counter_scripts: [
      {
        they_say: "You won't understand the legal terms",
        you_say: "I'd appreciate if you could explain each clause in simple language. If I can't understand it, that's a problem — I shouldn't sign something I don't understand.",
        tone: "firm",
        legal_backing: "Indian Contract Act, Section 16 — Free consent"
      },
      {
        they_say: "Leave the legal stuff to us",
        you_say: "I appreciate the offer, but this contract binds me, so I need to understand every clause. Could we go through it together?",
        tone: "polite",
        legal_backing: null
      }
    ]
  }
];

// ============================================
// TACTIC DETECTION FUNCTIONS
// ============================================

/**
 * Normalize text for matching — lowercase, remove filler words, trim
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();

  // Remove common punctuation
  normalized = normalized.replace(/[.,!?;:'"]/g, " ");

  // Remove filler words
  const words = normalized.split(/\s+/);
  const filtered = words.filter((w) => !FILLER_WORDS.has(w));

  return filtered.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Check if a trigger phrase is found within text using fuzzy substring matching
 */
function matchesTrigger(normalizedText: string, triggerPhrase: string): boolean {
  const normalizedTrigger = triggerPhrase.toLowerCase().trim();

  // Direct substring match
  if (normalizedText.includes(normalizedTrigger)) {
    return true;
  }

  // Keyword proximity match — check if key words from trigger appear close together
  const triggerWords = normalizedTrigger.split(/\s+/).filter((w) => w.length > 2);
  if (triggerWords.length <= 1) return false;

  const textWords = normalizedText.split(/\s+/);

  // Find positions of each trigger word in source text
  const positions: number[] = [];
  for (const tw of triggerWords) {
    const idx = textWords.findIndex((w) => w.includes(tw) || tw.includes(w));
    if (idx === -1) return false; // Word not found at all
    positions.push(idx);
  }

  // Check if words appear within a window of 5 words of each other
  if (positions.length < 2) return false;
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  return maxPos - minPos <= 5;
}

/**
 * Detect pressure tactic in spoken/typed text
 * Returns first match found (highest priority: false_legal_claim)
 */
export function detectPressureTactic(text: string): DetectedTactic | null {
  if (!text || text.trim().length < 5) return null;

  const normalizedText = normalizeText(text);

  // Check false_legal_claim FIRST — it triggers both tactic alert AND bluff detector
  const legalClaimTactic = PRESSURE_TACTICS.find((t) => t.type === "false_legal_claim");
  if (legalClaimTactic) {
    for (const phrase of legalClaimTactic.trigger_phrases) {
      if (matchesTrigger(normalizedText, phrase)) {
        return {
          tactic_type: "false_legal_claim",
          matched_phrase: phrase,
          counter_response: legalClaimTactic.counter_scripts[0]?.you_say || legalClaimTactic.counter_strategy,
          confidence: "high",
        };
      }
    }
  }

  // Then check all other tactics
  for (const tactic of PRESSURE_TACTICS) {
    if (tactic.type === "false_legal_claim") continue; // Already checked

    for (const phrase of tactic.trigger_phrases) {
      if (matchesTrigger(normalizedText, phrase)) {
        return {
          tactic_type: tactic.type,
          matched_phrase: phrase,
          counter_response: tactic.counter_scripts[0]?.you_say || tactic.counter_strategy,
          confidence: normalizedText.includes(phrase.toLowerCase()) ? "high" : "medium",
        };
      }
    }
  }

  return null;
}

/**
 * Detect ALL tactics in a piece of text (for longer transcription chunks)
 */
export function detectAllTactics(text: string): DetectedTactic[] {
  if (!text || text.trim().length < 5) return [];

  const normalizedText = normalizeText(text);
  const detected: DetectedTactic[] = [];
  const seenTypes = new Set<PressureTacticType>();

  for (const tactic of PRESSURE_TACTICS) {
    if (seenTypes.has(tactic.type)) continue;

    for (const phrase of tactic.trigger_phrases) {
      if (matchesTrigger(normalizedText, phrase)) {
        detected.push({
          tactic_type: tactic.type,
          matched_phrase: phrase,
          counter_response: tactic.counter_scripts[0]?.you_say || tactic.counter_strategy,
          confidence: normalizedText.includes(phrase.toLowerCase()) ? "high" : "medium",
        });
        seenTypes.add(tactic.type);
        break; // Only one match per tactic type
      }
    }
  }

  return detected;
}

/**
 * Get a tactic by its type
 */
export function getTacticByType(type: PressureTacticType): PressureTactic | undefined {
  return PRESSURE_TACTICS.find((t) => t.type === type);
}
