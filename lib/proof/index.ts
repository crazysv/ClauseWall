// ============================================
// ANALYSIS PROOF SYSTEM
// Dual verification: FreeTSA (legal) + IPFS (visual)
//
// Layer 1: SHA-256 hash of analysis results
// Layer 2: FreeTSA.org RFC 3161 timestamp (independent witness)
// Layer 3: IPFS pinning via Pinata (public proof)
//
// Cost: $0 — FreeTSA is free, Pinata free tier = 1GB
// ============================================

// ---- TYPES ----

export interface AnalysisProof {
  version: string;
  platform: string;
  timestamp: string;
  proof_hash: string;
  tsa?: {
    authority: string;
    timestamp: string;
    serial: string;
    protocol: string;
  };
  analysis: {
    document_type: string;
    jurisdiction: string;
    overall_risk_score: number;
    total_clauses: number;
    safe_count: number;
    warning_count: number;
    dangerous_count: number;
    illegal_count: number;
    verification_rate: number;
  };
  clauses: {
    clause_number: number;
    clause_type: string;
    risk_level: string;
    risk_score: number;
    verification_source: string;
    legal_citation: string | null;
  }[];
  legal_disclaimer: string;
}

export interface ProofResult {
  success: boolean;
  proof_hash: string;
  cid: string | null;
  timestamp: string;
  verify_url: string | null;
  tsa_token: string | null;
  tsa_serial: string | null;
  tsa_timestamp: string | null;
  error?: string;
}

// ---- SHA-256 ----

async function sha256(message: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(message).digest("hex");
}

function sha256Bytes(message: string): Buffer {
  const { createHash } = require("crypto");
  return createHash("sha256").update(message).digest();
}

// ---- PROOF OBJECT CREATION ----

export function createAnalysisProof(
  doc: {
    document_type: string;
    jurisdiction: string;
    overall_risk_score: number;
    total_clauses: number;
    safe_count: number;
    warning_count: number;
    dangerous_count: number;
    illegal_count: number;
  },
  clauses: {
    clause_number: number;
    clause_type: string;
    risk_level: string;
    risk_score: number;
    verification_source?: string;
    legal_citation?: string | null;
  }[],
  verificationRate: number
): AnalysisProof {
  return {
    version: "1.0.0",
    platform: "ClauseWall — India's AI Contract Analyzer",
    timestamp: new Date().toISOString(),
    proof_hash: "",
    analysis: {
      document_type: doc.document_type,
      jurisdiction: doc.jurisdiction,
      overall_risk_score: doc.overall_risk_score,
      total_clauses: doc.total_clauses,
      safe_count: doc.safe_count,
      warning_count: doc.warning_count,
      dangerous_count: doc.dangerous_count,
      illegal_count: doc.illegal_count,
      verification_rate: verificationRate,
    },
    clauses: clauses.map((c) => ({
      clause_number: c.clause_number,
      clause_type: c.clause_type,
      risk_level: c.risk_level,
      risk_score: c.risk_score,
      verification_source: c.verification_source || "ai",
      legal_citation: c.legal_citation || null,
    })),
    legal_disclaimer:
      "This proof certifies that the above analysis was performed by ClauseWall on the stated date. " +
      "It does not contain any personal data or contract text. " +
      "Admissible as digital evidence under the Information Technology Act, 2000 — Section 65B. " +
      "Verify at: https://clause-wall.vercel.app",
  };
}

export async function hashProof(proof: AnalysisProof): Promise<string> {
  const toHash = { ...proof, proof_hash: undefined, tsa: undefined };
  return sha256(JSON.stringify(toHash, null, 0));
}

// ============================================
// LAYER 2: FreeTSA.org — RFC 3161 TIMESTAMP
// Independent third-party witness
// NO API key needed. Completely free.
// ============================================

/**
 * Build RFC 3161 Timestamp Query (TSQ) in DER format
 * This is the binary request sent to FreeTSA
 */
function buildTSQ(sha256HashHex: string): Buffer {
  const hashBytes = Buffer.from(sha256HashHex, "hex");

  if (hashBytes.length !== 32) {
    throw new Error(`Invalid SHA-256 hash length: ${hashBytes.length}`);
  }

  // Pre-built DER structure for SHA-256 TSQ (RFC 3161)
  // Total: 59 bytes (27 byte header + 32 byte hash)
  const header = Buffer.from([
    0x30, 0x39,                                           // SEQUENCE (57 bytes)
      0x02, 0x01, 0x01,                                   // INTEGER 1 (version)
      0x30, 0x31,                                         // SEQUENCE (49 bytes - messageImprint)
        0x30, 0x0d,                                       // SEQUENCE (13 bytes - algorithmIdentifier)
          0x06, 0x09,                                     // OID (9 bytes)
            0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, // SHA-256
          0x05, 0x00,                                     // NULL (parameters)
        0x04, 0x20,                                       // OCTET STRING (32 bytes - hash)
  ]);

  const footer = Buffer.from([
    0x01, 0x01, 0xff,                                     // BOOLEAN TRUE (certReq)
  ]);

  return Buffer.concat([header, hashBytes, footer]);
}

/**
 * Extract timestamp from TSR (Timestamp Response) bytes
 * Searches for GeneralizedTime (tag 0x18) in the DER structure
 */
function extractTimestampFromTSR(tsrBytes: Buffer): string | null {
  for (let i = 0; i < tsrBytes.length - 16; i++) {
    if (tsrBytes[i] === 0x18) {
      const len = tsrBytes[i + 1];
      if (len >= 13 && len <= 20) {
        const timeStr = tsrBytes.subarray(i + 2, i + 2 + len).toString("ascii");
        // Format: YYYYMMDDHHmmSSZ or YYYYMMDDHHmmSS.fffZ
        const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
        if (match) {
          const [, year, month, day, hour, min, sec] = match;
          return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
        }
      }
    }
  }
  return null;
}

/**
 * Extract serial number from TSR bytes
 * Searches for a large INTEGER after the status field
 */
function extractSerialFromTSR(tsrBytes: Buffer): string | null {
  // Look for INTEGER tags with reasonable serial number lengths (4-20 bytes)
  let foundStatus = false;
  for (let i = 0; i < tsrBytes.length - 4; i++) {
    // Look for status SEQUENCE which contains INTEGER 0 (granted)
    if (tsrBytes[i] === 0x02 && tsrBytes[i + 1] === 0x01 && tsrBytes[i + 2] === 0x00) {
      foundStatus = true;
      continue;
    }

    // After status, look for serial (larger INTEGER)
    if (foundStatus && tsrBytes[i] === 0x02) {
      const len = tsrBytes[i + 1];
      if (len >= 4 && len <= 20) {
        const serialBytes = tsrBytes.subarray(i + 2, i + 2 + len);
        const serial = BigInt("0x" + serialBytes.toString("hex")).toString();
        return serial;
      }
    }
  }
  return null;
}

/**
 * Request timestamp from FreeTSA.org
 * Sends RFC 3161 TSQ, receives TSR
 */
async function requestFreeTSATimestamp(
  proofHash: string
): Promise<{
  token: string;
  timestamp: string | null;
  serial: string | null;
} | null> {
  try {

    const tsq = buildTSQ(proofHash);
    
    // Convert Buffer to Uint8Array for fetch compatibility
    const tsqArray = new Uint8Array(tsq);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://freetsa.org/tsr", {
      method: "POST",
      headers: {
        "Content-Type": "application/timestamp-query",
      },
      body: tsqArray,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[Proof] FreeTSA error: ${response.status}`);
      return null;
    }

    const tsrArrayBuffer = await response.arrayBuffer();
    const tsrBytes = Buffer.from(tsrArrayBuffer);

    if (tsrBytes.length < 20) {
      console.error("[Proof] FreeTSA: Response too short");
      return null;
    }

    // Check status — first few bytes should indicate success
    const statusOk =
      tsrBytes[0] === 0x30 && // outer SEQUENCE
      tsrBytes.includes(0x00, 4); // contains status 0 somewhere early

    if (!statusOk) {
      console.error("[Proof] FreeTSA: Bad status in response");
    }

    const tsaTimestamp = extractTimestampFromTSR(tsrBytes);
    const tsaSerial = extractSerialFromTSR(tsrBytes);

    const token = tsrBytes.toString("base64");


    return {
      token,
      timestamp: tsaTimestamp,
      serial: tsaSerial,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.error("[Proof] FreeTSA: Request timed out (15s)");
    } else {
      console.error("[Proof] FreeTSA error:", error);
    }
    return null;
  }
}

// ============================================
// LAYER 3: IPFS PINNING (Optional)
// Uses Pinata free tier (1GB, no credit card)
// ============================================

async function pinToIPFS(proof: AnalysisProof): Promise<string | null> {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {

    return null;
  }

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: JSON.stringify({
          pinataContent: proof,
          pinataMetadata: {
            name: `clausewall-proof-${proof.proof_hash.substring(0, 8)}`,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error(`[Proof] Pinata error: ${response.status} ${err.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();
    const cid = data.IpfsHash;


    return cid;
  } catch (error) {
    console.error("[Proof] IPFS pinning error:", error);
    return null;
  }
}

export function getIPFSUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

export function getIPFSPublicUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

// ============================================
// MAIN: Generate + Timestamp + Pin
// ============================================

export async function generateAndPinProof(
  doc: {
    document_type: string;
    jurisdiction: string;
    overall_risk_score: number;
    total_clauses: number;
    safe_count: number;
    warning_count: number;
    dangerous_count: number;
    illegal_count: number;
  },
  clauses: {
    clause_number: number;
    clause_type: string;
    risk_level: string;
    risk_score: number;
    verification_source?: string;
    legal_citation?: string | null;
  }[],
  verificationRate: number
): Promise<ProofResult> {
  const timestamp = new Date().toISOString();

  try {
    // Step 1: Create proof object
    const proof = createAnalysisProof(doc, clauses, verificationRate);

    // Step 2: Generate SHA-256 hash
    const proofHash = await hashProof(proof);
    proof.proof_hash = proofHash;


    // Step 3: FreeTSA timestamp (independent witness)
    let tsaToken: string | null = null;
    let tsaSerial: string | null = null;
    let tsaTimestamp: string | null = null;

    const tsaResult = await requestFreeTSATimestamp(proofHash);
    if (tsaResult) {
      tsaToken = tsaResult.token;
      tsaSerial = tsaResult.serial;
      tsaTimestamp = tsaResult.timestamp;

      // Add TSA data to proof object before IPFS pinning
      proof.tsa = {
        authority: "FreeTSA.org",
        timestamp: tsaTimestamp || timestamp,
        serial: tsaSerial || "unknown",
        protocol: "RFC 3161",
      };
    }

    // Step 4: Pin to IPFS (optional — needs PINATA_JWT)
    const cid = await pinToIPFS(proof);
    const verifyUrl = cid ? getIPFSUrl(cid) : null;


    return {
      success: true,
      proof_hash: proofHash,
      cid,
      timestamp: tsaTimestamp || timestamp,
      verify_url: verifyUrl,
      tsa_token: tsaToken,
      tsa_serial: tsaSerial,
      tsa_timestamp: tsaTimestamp,
    };
  } catch (error) {
    console.error("[Proof] Generation failed:", error);
    return {
      success: false,
      proof_hash: "",
      cid: null,
      timestamp,
      verify_url: null,
      tsa_token: null,
      tsa_serial: null,
      tsa_timestamp: null,
      error: (error as Error).message,
    };
  }
}