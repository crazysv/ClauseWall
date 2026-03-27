// ============================================
// CLAUSEWALL — RTI APPLICATION GENERATOR
// AI-powered Right to Information application
// ============================================

import type { RTIApplication, RTIQuestion } from "@/types/authority";
import { callGroq, type GroqMessage } from "@/lib/ai/groq-client";
import { RTI_FEE, RTI_FEE_METHODS, RTI_RESPONSE_DAYS } from "./constants";

const RTI_SYSTEM_PROMPT = `You are an expert Indian RTI (Right to Information Act, 2005) application drafter.
Generate a formal RTI application based on the user's dispute. Return VALID JSON only.

RULES:
1. Questions must be specific, numbered, and clearly worded
2. Each question should request ONE piece of information
3. Include relevant file numbers / reference numbers if provided
4. Address the correct Public Information Officer (PIO)
5. Use formal, respectful language
6. Maximum 10 questions per application
7. Include the RTI fee statement (₹10 via IPO / Court Fee Stamp)

Return this EXACT JSON format:
{
  "recipient_authority": "Name of the department/authority",
  "recipient_address": "Full address of the PIO",
  "subject": "Subject line for the application",
  "questions": ["Question 1...", "Question 2...", ...],
  "full_text": "Complete RTI application text ready to print"
}`;

/**
 * Generate an RTI application using AI.
 */
export async function generateRTI(
  applicantName: string,
  applicantAddress: string,
  targetAuthority: string,
  targetAddress: string,
  disputeContext: string,
  specificQuestions?: RTIQuestion[]
): Promise<RTIApplication> {
  const questionsContext = specificQuestions
    ? `\nUser wants to ask about:\n${specificQuestions.map((q, i) => `${i + 1}. ${q.question} (Context: ${q.context})`).join("\n")}`
    : "";

  const userMessage = `Draft an RTI application for:
- Applicant: ${applicantName}, ${applicantAddress}
- Target Authority: ${targetAuthority}, ${targetAddress}
- Dispute Context: ${disputeContext}${questionsContext}
- Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

Generate a complete, print-ready RTI application with relevant information questions.`;

  const messages: GroqMessage[] = [
    { role: "system", content: RTI_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  try {
    const response = await callGroq(messages, { temperature: 0.2, maxTokens: 3000 });
    const parsed = JSON.parse(response);

    return {
      recipient_authority: parsed.recipient_authority || targetAuthority,
      recipient_address: parsed.recipient_address || targetAddress,
      subject: parsed.subject || "RTI Application",
      questions: parsed.questions || [],
      applicant_name: applicantName,
      applicant_address: applicantAddress,
      fee_amount: RTI_FEE,
      fee_methods: [...RTI_FEE_METHODS],
      full_text: parsed.full_text || "",
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[ClauseWall] RTI generation failed:", error);
    // Return a template fallback
    return {
      recipient_authority: targetAuthority,
      recipient_address: targetAddress,
      subject: "Application under Right to Information Act, 2005",
      questions: [
        `Please provide all records, files, and correspondence related to: ${disputeContext.substring(0, 200)}`,
        "Please provide copies of all relevant rules, guidelines, and circulars applicable to this matter.",
        "Please provide details of the officer(s) responsible for handling this matter.",
      ],
      applicant_name: applicantName,
      applicant_address: applicantAddress,
      fee_amount: RTI_FEE,
      fee_methods: [...RTI_FEE_METHODS],
      full_text: generateFallbackRTIText(applicantName, applicantAddress, targetAuthority, targetAddress, disputeContext),
      date: new Date().toISOString(),
    };
  }
}

function generateFallbackRTIText(
  name: string, address: string, authority: string, authAddress: string, context: string
): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `To,
The Public Information Officer,
${authority},
${authAddress}

Date: ${date}

Subject: Application under Right to Information Act, 2005

Respected Sir/Madam,

I, ${name}, resident of ${address}, hereby submit this application under Section 6(1) of the Right to Information Act, 2005. I request you to kindly provide the following information:

1. Please provide all records, files, and correspondence related to: ${context.substring(0, 300)}

2. Please provide copies of all relevant rules, guidelines, and circulars applicable to this matter.

3. Please provide details of the officer(s) responsible for handling this matter.

I am depositing the prescribed fee of ₹10/- (Rupees Ten Only) along with this application.

If the information sought is held by or closely connected with the function of another public authority, kindly transfer this application to such authority under Section 6(3) within 5 days.

Yours faithfully,
${name}
${address}

Enclosures:
1. RTI fee of ₹10 (IPO / Court Fee Stamp)
2. Copy of ID proof`;
}
