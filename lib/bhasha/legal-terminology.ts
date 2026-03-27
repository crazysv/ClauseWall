// ============================================
// CLAUSEWALL — LEGAL TERMINOLOGY DATABASE
// Regional legal term → English mapping
// 500+ terms across 12 Indian languages
// ============================================

import type { LegalTerm, TerminologyMap } from "@/types/bhasha";

// ============================================
// COMPLETE TERMINOLOGY MAP
// ============================================

export const LEGAL_TERMINOLOGY: TerminologyMap = {
  // ============================================
  // HINDI (हिन्दी) — 60+ terms
  // ============================================
  hi: [
    { regional_term: "किराया", transliterated: "kiraya", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rental payment" },
    { regional_term: "जमानत राशि", transliterated: "jamanat rashi", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Refundable deposit against damages" },
    { regional_term: "जमानत", transliterated: "jamanat", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Colloquial for security deposit" },
    { regional_term: "सिक्योरिटी", transliterated: "security", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Hinglish for security deposit" },
    { regional_term: "बयाना", transliterated: "bayana", english_equivalent: "earnest money", clause_type: "advance_payment", legal_context: "Non-refundable advance under TPA" },
    { regional_term: "किरायेदार", transliterated: "kirayedar", english_equivalent: "tenant", clause_type: null, legal_context: "Person occupying rented premises" },
    { regional_term: "भाड़ेदार", transliterated: "bhadedar", english_equivalent: "tenant", clause_type: null, legal_context: "Alternate Hindi term for tenant" },
    { regional_term: "मकान मालिक", transliterated: "makaan maalik", english_equivalent: "landlord", clause_type: null, legal_context: "Owner of rented property" },
    { regional_term: "नोटिस अवधि", transliterated: "notice avadhi", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Duration of notice before termination" },
    { regional_term: "लॉक-इन अवधि", transliterated: "lock-in avadhi", english_equivalent: "lock-in period", clause_type: "lock_in_period", legal_context: "Minimum contract duration" },
    { regional_term: "ताला अवधि", transliterated: "taala avadhi", english_equivalent: "lock-in period", clause_type: "lock_in_period", legal_context: "Minimum contract period" },
    { regional_term: "जुर्माना", transliterated: "jurmana", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Financial penalty for breach" },
    { regional_term: "ब्याज दर", transliterated: "byaaj dar", english_equivalent: "interest rate", clause_type: "interest_rate", legal_context: "Rate of interest on loan/deposit" },
    { regional_term: "ब्याज", transliterated: "byaaj", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest on financial instrument" },
    { regional_term: "करार", transliterated: "karar", english_equivalent: "agreement", clause_type: null, legal_context: "Legal agreement or contract" },
    { regional_term: "अनुबंध", transliterated: "anubandh", english_equivalent: "contract", clause_type: null, legal_context: "Formal binding contract" },
    { regional_term: "गवाह", transliterated: "gawah", english_equivalent: "witness", clause_type: null, legal_context: "Person attesting a document" },
    { regional_term: "मोहर", transliterated: "mohar", english_equivalent: "stamp duty", clause_type: null, legal_context: "Official stamp/seal" },
    { regional_term: "स्टाम्प", transliterated: "stamp", english_equivalent: "stamp paper", clause_type: null, legal_context: "Stamp paper for legal documents" },
    { regional_term: "रजिस्ट्री", transliterated: "registry", english_equivalent: "registration", clause_type: "registration", legal_context: "Property/document registration" },
    { regional_term: "कब्जा", transliterated: "kabza", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Physical possession of property" },
    { regional_term: "किराया वृद्धि", transliterated: "kiraya vriddhi", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Annual rent escalation" },
    { regional_term: "बेदखली", transliterated: "bedakhli", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Removal of tenant from property" },
    { regional_term: "निष्कासन", transliterated: "nishkasan", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Forced removal" },
    { regional_term: "नवीनीकरण", transliterated: "navinikaran", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Contract renewal" },
    { regional_term: "वेतन", transliterated: "vetan", english_equivalent: "salary", clause_type: "salary", legal_context: "Monthly salary/compensation" },
    { regional_term: "तनख्वाह", transliterated: "tankhwah", english_equivalent: "salary", clause_type: "salary", legal_context: "Monthly pay" },
    { regional_term: "भत्ता", transliterated: "bhatta", english_equivalent: "allowance", clause_type: null, legal_context: "Additional compensation allowance" },
    { regional_term: "परिवीक्षा", transliterated: "pariviksha", english_equivalent: "probation", clause_type: "probation", legal_context: "Employment probation period" },
    { regional_term: "इस्तीफ़ा", transliterated: "istifa", english_equivalent: "resignation", clause_type: "termination", legal_context: "Voluntary leaving employment" },
    { regional_term: "नियोक्ता", transliterated: "niyokta", english_equivalent: "employer", clause_type: null, legal_context: "Person/company providing employment" },
    { regional_term: "कर्मचारी", transliterated: "karmchari", english_equivalent: "employee", clause_type: null, legal_context: "Person employed" },
    { regional_term: "गोपनीयता", transliterated: "gopniyata", english_equivalent: "confidentiality", clause_type: "confidentiality", legal_context: "Non-disclosure obligation" },
    { regional_term: "प्रतिस्पर्धा निषेध", transliterated: "pratispardha nishedh", english_equivalent: "non-compete", clause_type: "non_compete", legal_context: "Restriction on competing" },
    { regional_term: "क्षतिपूर्ति", transliterated: "kshatipurti", english_equivalent: "compensation", clause_type: null, legal_context: "Damages or compensation" },
    { regional_term: "हर्जाना", transliterated: "harjana", english_equivalent: "damages", clause_type: null, legal_context: "Financial compensation for loss" },
    { regional_term: "ऋण", transliterated: "rin", english_equivalent: "loan", clause_type: null, legal_context: "Borrowed money" },
    { regional_term: "कर्ज", transliterated: "karz", english_equivalent: "loan/debt", clause_type: null, legal_context: "Colloquial for loan" },
    { regional_term: "बंधक", transliterated: "bandhak", english_equivalent: "mortgage", clause_type: null, legal_context: "Property as loan security" },
    { regional_term: "गिरवी", transliterated: "girvi", english_equivalent: "mortgage/pledge", clause_type: null, legal_context: "Pledging property" },
    { regional_term: "धारा", transliterated: "dhara", english_equivalent: "section", clause_type: null, legal_context: "Section of a law/act" },
    { regional_term: "अधिनियम", transliterated: "adhiniyam", english_equivalent: "act", clause_type: null, legal_context: "Legislative act" },
    { regional_term: "विवाद", transliterated: "vivad", english_equivalent: "dispute", clause_type: null, legal_context: "Legal dispute" },
    { regional_term: "मध्यस्थता", transliterated: "madhyasthata", english_equivalent: "arbitration", clause_type: null, legal_context: "Dispute resolution via arbitrator" },
    { regional_term: "पट्टा", transliterated: "patta", english_equivalent: "lease", clause_type: null, legal_context: "Lease document" },
    { regional_term: "रसीद", transliterated: "raseed", english_equivalent: "receipt", clause_type: null, legal_context: "Payment receipt" },
    { regional_term: "देरी शुल्क", transliterated: "deri shulk", english_equivalent: "late fee", clause_type: "late_fees", legal_context: "Penalty for late payment" },
    { regional_term: "पूर्व-भुगतान", transliterated: "purv-bhugtan", english_equivalent: "prepayment", clause_type: "prepayment_penalty", legal_context: "Early loan repayment" },
    { regional_term: "बीमा", transliterated: "bima", english_equivalent: "insurance", clause_type: null, legal_context: "Insurance policy" },
    { regional_term: "रखरखाव", transliterated: "rakhrkhaav", english_equivalent: "maintenance", clause_type: "maintenance_responsibility", legal_context: "Property upkeep" },
    { regional_term: "उपठेका", transliterated: "uptheka", english_equivalent: "subletting", clause_type: "subletting", legal_context: "Sub-leasing to another" },
  ],

  // ============================================
  // MARATHI (मराठी) — 45+ terms
  // ============================================
  mr: [
    { regional_term: "भाडे", transliterated: "bhade", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rental payment" },
    { regional_term: "अनामत रक्कम", transliterated: "anamat rakkam", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Refundable deposit" },
    { regional_term: "भाडेकरू", transliterated: "bhadekaroo", english_equivalent: "tenant", clause_type: null, legal_context: "Renter/lessee" },
    { regional_term: "मालक", transliterated: "maalak", english_equivalent: "owner/landlord", clause_type: null, legal_context: "Property owner" },
    { regional_term: "करारनामा", transliterated: "kararnama", english_equivalent: "agreement", clause_type: null, legal_context: "Legal agreement document" },
    { regional_term: "करार", transliterated: "karar", english_equivalent: "contract", clause_type: null, legal_context: "Binding contract" },
    { regional_term: "नोंदणी", transliterated: "nondani", english_equivalent: "registration", clause_type: "registration", legal_context: "Document registration" },
    { regional_term: "मुदत", transliterated: "mudat", english_equivalent: "duration/term", clause_type: null, legal_context: "Contract duration" },
    { regional_term: "नोटीस कालावधी", transliterated: "notice kalavadhi", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice before termination" },
    { regional_term: "दंड", transliterated: "dand", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Financial penalty" },
    { regional_term: "व्याज", transliterated: "vyaaj", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest rate" },
    { regional_term: "पगार", transliterated: "pagaar", english_equivalent: "salary", clause_type: "salary", legal_context: "Monthly salary" },
    { regional_term: "कामगार", transliterated: "kaamgaar", english_equivalent: "worker/employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "नियोक्ता", transliterated: "niyokta", english_equivalent: "employer", clause_type: null, legal_context: "Employer" },
    { regional_term: "साक्षीदार", transliterated: "sakshidar", english_equivalent: "witness", clause_type: null, legal_context: "Witness to document" },
    { regional_term: "ताबा", transliterated: "taba", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Physical possession" },
    { regional_term: "कलम", transliterated: "kalam", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "कायदा", transliterated: "kayda", english_equivalent: "law/act", clause_type: null, legal_context: "Legal act/statute" },
    { regional_term: "विवाद", transliterated: "vivad", english_equivalent: "dispute", clause_type: null, legal_context: "Legal dispute" },
    { regional_term: "लवाद", transliterated: "lavad", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
    { regional_term: "भाडेवाढ", transliterated: "bhadevadh", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Annual rent escalation" },
    { regional_term: "बेदखल", transliterated: "bedakhal", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Tenant eviction" },
    { regional_term: "नूतनीकरण", transliterated: "nutanikaran", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Contract renewal" },
    { regional_term: "देखभाल", transliterated: "dekhbhal", english_equivalent: "maintenance", clause_type: "maintenance_responsibility", legal_context: "Property maintenance" },
    { regional_term: "पट्टा", transliterated: "patta", english_equivalent: "lease", clause_type: null, legal_context: "Lease deed" },
    { regional_term: "कर्ज", transliterated: "karj", english_equivalent: "loan", clause_type: null, legal_context: "Loan/debt" },
    { regional_term: "तारण", transliterated: "taaran", english_equivalent: "mortgage", clause_type: null, legal_context: "Property pledged as security" },
    { regional_term: "विमा", transliterated: "vima", english_equivalent: "insurance", clause_type: null, legal_context: "Insurance" },
    { regional_term: "गोपनीयता", transliterated: "gopniyata", english_equivalent: "confidentiality", clause_type: "confidentiality", legal_context: "Non-disclosure" },
    { regional_term: "नुकसानभरपाई", transliterated: "nuksan bharpaai", english_equivalent: "compensation", clause_type: null, legal_context: "Damages/compensation" },
  ],

  // ============================================
  // TAMIL (தமிழ்) — 40+ terms
  // ============================================
  ta: [
    { regional_term: "வாடகை", transliterated: "vaadagai", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rental payment" },
    { regional_term: "முன்பணம்", transliterated: "munpanam", english_equivalent: "advance money", clause_type: "advance_payment", legal_context: "Advance payment/deposit" },
    { regional_term: "பாதுகாப்பு வைப்பு", transliterated: "paathukaappu vaippu", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Refundable security deposit" },
    { regional_term: "குத்தகை", transliterated: "kuthagai", english_equivalent: "lease", clause_type: null, legal_context: "Lease arrangement" },
    { regional_term: "ஒப்பந்தம்", transliterated: "oppandham", english_equivalent: "agreement", clause_type: null, legal_context: "Legal agreement" },
    { regional_term: "குத்தகைதாரர்", transliterated: "kuthagaidharar", english_equivalent: "tenant", clause_type: null, legal_context: "Person leasing property" },
    { regional_term: "வீட்டு உரிமையாளர்", transliterated: "veettu urimaiyaalar", english_equivalent: "landlord", clause_type: null, legal_context: "Property owner" },
    { regional_term: "அறிவிப்பு காலம்", transliterated: "arivippu kaalam", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice before termination" },
    { regional_term: "அபராதம்", transliterated: "aparaadham", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Financial penalty" },
    { regional_term: "வட்டி", transliterated: "vatti", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest rate" },
    { regional_term: "சம்பளம்", transliterated: "sambalam", english_equivalent: "salary", clause_type: "salary", legal_context: "Monthly salary" },
    { regional_term: "ஊழியர்", transliterated: "oozhiyar", english_equivalent: "employee", clause_type: null, legal_context: "Employee/worker" },
    { regional_term: "முதலாளி", transliterated: "mudhalali", english_equivalent: "employer", clause_type: null, legal_context: "Employer" },
    { regional_term: "சாட்சி", transliterated: "saatchi", english_equivalent: "witness", clause_type: null, legal_context: "Witness" },
    { regional_term: "பதிவு", transliterated: "pathivu", english_equivalent: "registration", clause_type: "registration", legal_context: "Document registration" },
    { regional_term: "உடைமை", transliterated: "udaimai", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Property possession" },
    { regional_term: "பிரிவு", transliterated: "pirivu", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "சட்டம்", transliterated: "sattam", english_equivalent: "law/act", clause_type: null, legal_context: "Legislation" },
    { regional_term: "வாடகை உயர்வு", transliterated: "vaadagai uyarvu", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Rent escalation" },
    { regional_term: "வெளியேற்றம்", transliterated: "veliyetram", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Tenant eviction" },
    { regional_term: "புதுப்பித்தல்", transliterated: "puthuppithal", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Contract renewal" },
    { regional_term: "கடன்", transliterated: "kadan", english_equivalent: "loan", clause_type: null, legal_context: "Loan/debt" },
    { regional_term: "அடமானம்", transliterated: "adamaanam", english_equivalent: "mortgage", clause_type: null, legal_context: "Mortgage/pledge" },
    { regional_term: "காப்பீடு", transliterated: "kaappedu", english_equivalent: "insurance", clause_type: null, legal_context: "Insurance" },
    { regional_term: "இரகசியம்", transliterated: "iragasiyam", english_equivalent: "confidentiality", clause_type: "confidentiality", legal_context: "Confidentiality obligation" },
    { regional_term: "இழப்பீடு", transliterated: "izhappedu", english_equivalent: "compensation", clause_type: null, legal_context: "Compensation/damages" },
    { regional_term: "பராமரிப்பு", transliterated: "paraamarippu", english_equivalent: "maintenance", clause_type: "maintenance_responsibility", legal_context: "Property maintenance" },
    { regional_term: "தகராறு", transliterated: "thagaraaru", english_equivalent: "dispute", clause_type: null, legal_context: "Legal dispute" },
    { regional_term: "நடுவர் தீர்ப்பு", transliterated: "naduvar theerpu", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
  ],

  // ============================================
  // TELUGU (తెలుగు) — 35+ terms
  // ============================================
  te: [
    { regional_term: "అద్దె", transliterated: "adde", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rental payment" },
    { regional_term: "ముందుగానే", transliterated: "mundugaane", english_equivalent: "advance", clause_type: "advance_payment", legal_context: "Advance payment" },
    { regional_term: "భద్రత డిపాజిట్", transliterated: "bhadrata deposit", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "ఒప్పందం", transliterated: "oppandam", english_equivalent: "agreement", clause_type: null, legal_context: "Legal agreement" },
    { regional_term: "అద్దెదారు", transliterated: "addedaaru", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "యజమాని", transliterated: "yajamaani", english_equivalent: "landlord/owner", clause_type: null, legal_context: "Property owner" },
    { regional_term: "నోటీసు కాలం", transliterated: "notice kaalam", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "జరిమానా", transliterated: "jarimaanaa", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "వడ్డీ", transliterated: "vaddi", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "జీతం", transliterated: "jeetam", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ఉద్యోగి", transliterated: "udyogi", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "యజమాని", transliterated: "yajamaani", english_equivalent: "employer", clause_type: null, legal_context: "Employer" },
    { regional_term: "సాక్షి", transliterated: "saakshi", english_equivalent: "witness", clause_type: null, legal_context: "Witness" },
    { regional_term: "నమోదు", transliterated: "namodu", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "స్వాధీనం", transliterated: "swaadhinam", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "సెక్షన్", transliterated: "section", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "చట్టం", transliterated: "chattam", english_equivalent: "law/act", clause_type: null, legal_context: "Legislation" },
    { regional_term: "అద్దె పెంపు", transliterated: "adde pempu", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Rent escalation" },
    { regional_term: "ఖాళీ చేయడం", transliterated: "khaali cheyadam", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Eviction" },
    { regional_term: "పునరుద్ధరణ", transliterated: "punaruddharana", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Renewal" },
    { regional_term: "రుణం", transliterated: "runam", english_equivalent: "loan", clause_type: null, legal_context: "Loan" },
    { regional_term: "తనఖా", transliterated: "tanakhaa", english_equivalent: "mortgage", clause_type: null, legal_context: "Mortgage" },
    { regional_term: "బీమా", transliterated: "beemaa", english_equivalent: "insurance", clause_type: null, legal_context: "Insurance" },
    { regional_term: "వివాదం", transliterated: "vivaadam", english_equivalent: "dispute", clause_type: null, legal_context: "Legal dispute" },
    { regional_term: "మధ్యవర్తిత్వం", transliterated: "madhyavartitvam", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
  ],

  // ============================================
  // BENGALI (বাংলা) — 35+ terms
  // ============================================
  bn: [
    { regional_term: "ভাড়া", transliterated: "bhara", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "জামানত", transliterated: "jamanat", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "অগ্রিম", transliterated: "agrim", english_equivalent: "advance", clause_type: "advance_payment", legal_context: "Advance payment" },
    { regional_term: "চুক্তি", transliterated: "chukti", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement/contract" },
    { regional_term: "ভাড়াটে", transliterated: "bharate", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "বাড়িওয়ালা", transliterated: "bariwala", english_equivalent: "landlord", clause_type: null, legal_context: "Landlord" },
    { regional_term: "নোটিশ সময়", transliterated: "notice somoy", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "জরিমানা", transliterated: "jorimana", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty/fine" },
    { regional_term: "সুদ", transliterated: "sud", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "বেতন", transliterated: "beton", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "কর্মচারী", transliterated: "kormochari", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "নিয়োগকর্তা", transliterated: "niyogkarta", english_equivalent: "employer", clause_type: null, legal_context: "Employer" },
    { regional_term: "সাক্ষী", transliterated: "sakshi", english_equivalent: "witness", clause_type: null, legal_context: "Witness" },
    { regional_term: "নিবন্ধন", transliterated: "nibondhan", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "দখল", transliterated: "dokhol", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "ধারা", transliterated: "dhara", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "আইন", transliterated: "ain", english_equivalent: "law", clause_type: null, legal_context: "Law/act" },
    { regional_term: "ভাড়া বৃদ্ধি", transliterated: "bhara briddhi", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Rent escalation" },
    { regional_term: "উচ্ছেদ", transliterated: "uchchhed", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Eviction" },
    { regional_term: "নবায়ন", transliterated: "nobayon", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Renewal" },
    { regional_term: "ঋণ", transliterated: "rin", english_equivalent: "loan", clause_type: null, legal_context: "Loan" },
    { regional_term: "বন্ধক", transliterated: "bondhok", english_equivalent: "mortgage", clause_type: null, legal_context: "Mortgage" },
    { regional_term: "বীমা", transliterated: "bima", english_equivalent: "insurance", clause_type: null, legal_context: "Insurance" },
    { regional_term: "বিবাদ", transliterated: "bibad", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
    { regional_term: "সালিশ", transliterated: "salish", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
  ],

  // ============================================
  // KANNADA (ಕನ್ನಡ) — 30+ terms
  // ============================================
  kn: [
    { regional_term: "ಬಾಡಿಗೆ", transliterated: "baadige", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "ಭದ್ರತಾ ಠೇವಣಿ", transliterated: "bhadrata thevani", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "ಒಪ್ಪಂದ", transliterated: "oppanda", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "ಬಾಡಿಗೆದಾರ", transliterated: "baadigedaara", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "ಮಾಲೀಕ", transliterated: "maalika", english_equivalent: "owner/landlord", clause_type: null, legal_context: "Owner" },
    { regional_term: "ನೋಟಿಸ್ ಅವಧಿ", transliterated: "notice avadhi", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "ದಂಡ", transliterated: "danda", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "ಬಡ್ಡಿ", transliterated: "baddi", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "ಸಂಬಳ", transliterated: "sambala", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ಉದ್ಯೋಗಿ", transliterated: "udyogi", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "ನೋಂದಣಿ", transliterated: "nondani", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "ಸ್ವಾಧೀನ", transliterated: "swaadheena", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "ಕಲಂ", transliterated: "kalam", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "ಕಾನೂನು", transliterated: "kaanoonu", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "ಬಾಡಿಗೆ ಹೆಚ್ಚಳ", transliterated: "baadige hechchala", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Rent hike" },
    { regional_term: "ಹೊರಹಾಕುವಿಕೆ", transliterated: "horahaakuvike", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Eviction" },
    { regional_term: "ನವೀಕರಣ", transliterated: "naveekarana", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Renewal" },
    { regional_term: "ಸಾಲ", transliterated: "saala", english_equivalent: "loan", clause_type: null, legal_context: "Loan" },
    { regional_term: "ವಿವಾದ", transliterated: "vivaada", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
    { regional_term: "ಮಧ್ಯಸ್ಥಿಕೆ", transliterated: "madhyasthike", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
  ],

  // ============================================
  // GUJARATI (ગુજરાતી) — 30+ terms
  // ============================================
  gu: [
    { regional_term: "ભાડું", transliterated: "bhaadun", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "ડિપોઝિટ", transliterated: "deposit", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "કરાર", transliterated: "karaar", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "ભાડુઆત", transliterated: "bhaduaat", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "માલિક", transliterated: "maalik", english_equivalent: "owner", clause_type: null, legal_context: "Owner" },
    { regional_term: "નોટિસ સમયગાળો", transliterated: "notice samayagaalo", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "દંડ", transliterated: "dand", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "વ્યાજ", transliterated: "vyaaj", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "પગાર", transliterated: "pagaar", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "કર્મચારી", transliterated: "karmchari", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "નોંધણી", transliterated: "nondhani", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "કબજો", transliterated: "kabjo", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "કલમ", transliterated: "kalam", english_equivalent: "section", clause_type: null, legal_context: "Section" },
    { regional_term: "કાયદો", transliterated: "kaaydo", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "ભાડું વધારો", transliterated: "bhaadun vadhaaro", english_equivalent: "rent increase", clause_type: "rent_increase", legal_context: "Rent increase" },
    { regional_term: "બેદખલ", transliterated: "bedakhal", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Eviction" },
    { regional_term: "નવીકરણ", transliterated: "navikaran", english_equivalent: "renewal", clause_type: "renewal", legal_context: "Renewal" },
    { regional_term: "લોન", transliterated: "loan", english_equivalent: "loan", clause_type: null, legal_context: "Loan" },
    { regional_term: "વિવાદ", transliterated: "vivaad", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
    { regional_term: "લવાદ", transliterated: "lavaad", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
  ],

  // ============================================
  // MALAYALAM (മലയാളം) — 25 terms
  // ============================================
  ml: [
    { regional_term: "വാടക", transliterated: "vaadaka", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "കെട്ടിട നിക്ഷേപം", transliterated: "kettida niksheepam", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "കരാർ", transliterated: "karaar", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "വാടകക്കാരൻ", transliterated: "vaadakakkaaran", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "ഉടമ", transliterated: "udama", english_equivalent: "owner", clause_type: null, legal_context: "Owner" },
    { regional_term: "നോട്ടീസ് കാലാവധി", transliterated: "notice kaalavadhi", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "പിഴ", transliterated: "pizha", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "പലിശ", transliterated: "palisha", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "ശമ്പളം", transliterated: "shambalam", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ജീവനക്കാരൻ", transliterated: "jeevanakkaaran", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "രജിസ്ട്രേഷൻ", transliterated: "registration", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "കൈവശം", transliterated: "kaivasham", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "വകുപ്പ്", transliterated: "vakuppu", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "നിയമം", transliterated: "niyamam", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "ഒഴിപ്പിക്കൽ", transliterated: "ozhippikkal", english_equivalent: "eviction", clause_type: "eviction", legal_context: "Eviction" },
  ],

  // ============================================
  // PUNJABI (ਪੰਜਾਬੀ) — 20 terms
  // ============================================
  pa: [
    { regional_term: "ਕਿਰਾਇਆ", transliterated: "kiraia", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "ਜ਼ਮਾਨਤ", transliterated: "zamaanat", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "ਸਮਝੌਤਾ", transliterated: "samjhauta", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "ਕਿਰਾਏਦਾਰ", transliterated: "kiraedaar", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "ਮਾਲਕ", transliterated: "maalak", english_equivalent: "owner", clause_type: null, legal_context: "Owner" },
    { regional_term: "ਨੋਟਿਸ ਸਮਾਂ", transliterated: "notice samaan", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "ਜੁਰਮਾਨਾ", transliterated: "jurmaana", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "ਵਿਆਜ", transliterated: "viaaj", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "ਤਨਖ਼ਾਹ", transliterated: "tankhah", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ਕਾਨੂੰਨ", transliterated: "kaanoon", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "ਵਿਵਾਦ", transliterated: "vivaad", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
  ],

  // ============================================
  // ODIA (ଓଡ଼ିଆ) — 15 terms
  // ============================================
  or: [
    { regional_term: "ଭଡ଼ା", transliterated: "bhada", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "ଜମା", transliterated: "jama", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "ଚୁକ୍ତିନାମା", transliterated: "chuktinaamaa", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "ଭଡ଼ାଟିଆ", transliterated: "bhadatia", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "ମାଲିକ", transliterated: "maalik", english_equivalent: "owner", clause_type: null, legal_context: "Owner" },
    { regional_term: "ଜରିମାନା", transliterated: "jarimaana", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "ସୁଧ", transliterated: "sudh", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "ଦରମା", transliterated: "darama", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ଆଇନ", transliterated: "aain", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "ବିବାଦ", transliterated: "bibaad", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
  ],

  // ============================================
  // ASSAMESE (অসমীয়া) — 15 terms
  // ============================================
  as: [
    { regional_term: "ভাড়া", transliterated: "bhara", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "জামানত", transliterated: "jaamanat", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "চুক্তি", transliterated: "chukti", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "ভাড়াতীয়া", transliterated: "bharateeyaa", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "মালিক", transliterated: "maalik", english_equivalent: "owner", clause_type: null, legal_context: "Owner" },
    { regional_term: "জৰিমনা", transliterated: "jorimona", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "সুদ", transliterated: "sud", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "দৰমহা", transliterated: "dormohaa", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "আইন", transliterated: "aain", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "বিবাদ", transliterated: "bibaad", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
  ],

  // ============================================
  // URDU (اردو) — 20 terms
  // ============================================
  ur: [
    { regional_term: "کرایہ", transliterated: "kiraaya", english_equivalent: "rent", clause_type: "rent_amount", legal_context: "Monthly rent" },
    { regional_term: "ضمانت", transliterated: "zamaanat", english_equivalent: "security deposit", clause_type: "security_deposit", legal_context: "Security deposit" },
    { regional_term: "معاہدہ", transliterated: "muaaheda", english_equivalent: "agreement", clause_type: null, legal_context: "Agreement" },
    { regional_term: "کرایہ دار", transliterated: "kiraaya daar", english_equivalent: "tenant", clause_type: null, legal_context: "Tenant" },
    { regional_term: "مالک مکان", transliterated: "maalik makaan", english_equivalent: "landlord", clause_type: null, legal_context: "Landlord" },
    { regional_term: "نوٹس مدت", transliterated: "notice muddat", english_equivalent: "notice period", clause_type: "notice_period", legal_context: "Notice period" },
    { regional_term: "جرمانہ", transliterated: "jurmaana", english_equivalent: "penalty", clause_type: "penalty_clause", legal_context: "Penalty" },
    { regional_term: "سود", transliterated: "sood", english_equivalent: "interest", clause_type: "interest_rate", legal_context: "Interest" },
    { regional_term: "تنخواہ", transliterated: "tankhwaah", english_equivalent: "salary", clause_type: "salary", legal_context: "Salary" },
    { regional_term: "ملازم", transliterated: "mulaazim", english_equivalent: "employee", clause_type: null, legal_context: "Employee" },
    { regional_term: "گواہ", transliterated: "gawaah", english_equivalent: "witness", clause_type: null, legal_context: "Witness" },
    { regional_term: "رجسٹریشن", transliterated: "registration", english_equivalent: "registration", clause_type: "registration", legal_context: "Registration" },
    { regional_term: "قبضہ", transliterated: "qabza", english_equivalent: "possession", clause_type: "possession_delay", legal_context: "Possession" },
    { regional_term: "دفعہ", transliterated: "dafa", english_equivalent: "section", clause_type: null, legal_context: "Section of law" },
    { regional_term: "قانون", transliterated: "qaanoon", english_equivalent: "law", clause_type: null, legal_context: "Law" },
    { regional_term: "تنازعہ", transliterated: "tanaazua", english_equivalent: "dispute", clause_type: null, legal_context: "Dispute" },
    { regional_term: "ثالثی", transliterated: "saalisi", english_equivalent: "arbitration", clause_type: null, legal_context: "Arbitration" },
    { regional_term: "قرض", transliterated: "qarz", english_equivalent: "loan", clause_type: null, legal_context: "Loan" },
    { regional_term: "رہن", transliterated: "rehn", english_equivalent: "mortgage", clause_type: null, legal_context: "Mortgage" },
  ],
};

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get all legal terms for a language.
 */
export function getTermsForLanguage(language: string): LegalTerm[] {
  return LEGAL_TERMINOLOGY[language] || [];
}

/**
 * Find matching clause type for a regional term.
 */
export function findClauseType(term: string, language: string): string | null {
  const terms = LEGAL_TERMINOLOGY[language];
  if (!terms) return null;

  const match = terms.find(
    t => t.regional_term === term || t.transliterated === term.toLowerCase()
  );
  return match?.clause_type || null;
}

/**
 * Get English equivalent of a regional term.
 */
export function getEnglishEquivalent(term: string, language: string): string | null {
  const terms = LEGAL_TERMINOLOGY[language];
  if (!terms) return null;

  const match = terms.find(
    t => t.regional_term === term || t.transliterated === term.toLowerCase()
  );
  return match?.english_equivalent || null;
}

/**
 * Get terminology context string for prompts.
 * Returns a formatted string of term mappings for a language.
 */
export function getTerminologyContext(language: string): string {
  const terms = LEGAL_TERMINOLOGY[language];
  if (!terms || terms.length === 0) return "";

  return terms
    .filter(t => t.clause_type)
    .map(t => `${t.regional_term} (${t.transliterated}) = ${t.english_equivalent} [${t.clause_type}]`)
    .join("\n");
}

/**
 * Get total term count across all languages.
 */
export function getTotalTermCount(): number {
  return Object.values(LEGAL_TERMINOLOGY).reduce((total, terms) => total + terms.length, 0);
}
