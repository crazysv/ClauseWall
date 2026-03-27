// ============================================
// EVIDENCE CHAIN ENGINE
// Hash chain + Merkle tree for evidence integrity
// Extends lib/proof/index.ts crypto primitives
// ============================================

import { createHash } from "crypto";
import type {
  ChainLink,
  ChainVerificationResult,
  MerkleTree,
  MerkleProof,
  EvidenceItem,
} from "@/types/evidence";

const GENESIS = "GENESIS";

// ── Chain Hash Functions ──

/**
 * Create a chain hash linking to previous item
 * chainHash = SHA-256(previousChainHash + contentHash + timestamp)
 */
export function createChainHash(
  previousChainHash: string | null,
  contentHash: string,
  timestamp: string
): string {
  const prev = previousChainHash || GENESIS;
  const input = `${prev}|${contentHash}|${timestamp}`;
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Verify the integrity of an evidence chain
 */
export function verifyChainIntegrity(items: EvidenceItem[]): ChainVerificationResult {
  if (items.length === 0) {
    return { valid: true, total_items: 0, verified_items: 0, broken_at: null, details: ["Empty chain"] };
  }

  // Sort by sequence number
  const sorted = [...items].sort((a, b) => a.sequence_number - b.sequence_number);
  const details: string[] = [];
  let valid = true;
  let brokenAt: number | null = null;
  let verifiedCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const previousHash = i === 0 ? null : sorted[i - 1].chain_hash;

    const expectedChainHash = createChainHash(
      previousHash,
      item.content_hash,
      item.captured_at
    );

    if (expectedChainHash === item.chain_hash) {
      verifiedCount++;
      details.push(`✓ Item #${item.sequence_number}: Chain hash verified`);
    } else {
      valid = false;
      if (brokenAt === null) brokenAt = item.sequence_number;
      details.push(
        `✗ Item #${item.sequence_number}: Chain hash mismatch (expected ${expectedChainHash.slice(0, 12)}..., got ${item.chain_hash.slice(0, 12)}...)`
      );
    }
  }

  return {
    valid,
    total_items: sorted.length,
    verified_items: verifiedCount,
    broken_at: brokenAt,
    details,
  };
}

/**
 * Build chain links from evidence items
 */
export function buildChainLinks(items: EvidenceItem[]): ChainLink[] {
  const sorted = [...items].sort((a, b) => a.sequence_number - b.sequence_number);

  return sorted.map((item, i) => ({
    item_id: item.id,
    sequence_number: item.sequence_number,
    content_hash: item.content_hash,
    chain_hash: item.chain_hash,
    previous_chain_hash: i === 0 ? null : sorted[i - 1].chain_hash,
    timestamp: item.captured_at,
    verified: createChainHash(
      i === 0 ? null : sorted[i - 1].chain_hash,
      item.content_hash,
      item.captured_at
    ) === item.chain_hash,
  }));
}

// ── Merkle Tree ──

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Build a Merkle tree from an array of content hashes
 */
export function buildMerkleTree(hashes: string[]): MerkleTree {
  if (hashes.length === 0) {
    return { root: sha256("EMPTY"), levels: [[sha256("EMPTY")]], leaf_count: 0 };
  }

  // Duplicate last hash if odd number of leaves
  const leaves = [...hashes];
  if (leaves.length % 2 !== 0) {
    leaves.push(leaves[leaves.length - 1]);
  }

  const levels: string[][] = [leaves];
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      nextLevel.push(sha256(left + right));
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    levels,
    leaf_count: hashes.length,
  };
}

/**
 * Generate a Merkle inclusion proof for a specific leaf
 */
export function generateMerkleProof(tree: MerkleTree, leafHash: string): MerkleProof | null {
  const leafIndex = tree.levels[0].indexOf(leafHash);
  if (leafIndex === -1) return null;

  const proof: Array<{ hash: string; position: "left" | "right" }> = [];
  let index = leafIndex;

  for (let level = 0; level < tree.levels.length - 1; level++) {
    const currentLevel = tree.levels[level];
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;

    if (siblingIndex < currentLevel.length) {
      proof.push({
        hash: currentLevel[siblingIndex],
        position: isRight ? "left" : "right",
      });
    }

    index = Math.floor(index / 2);
  }

  return {
    leaf_hash: leafHash,
    proof,
    root: tree.root,
  };
}

/**
 * Verify a Merkle proof
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  let currentHash = proof.leaf_hash;

  for (const step of proof.proof) {
    if (step.position === "left") {
      currentHash = sha256(step.hash + currentHash);
    } else {
      currentHash = sha256(currentHash + step.hash);
    }
  }

  return currentHash === proof.root;
}

/**
 * Rebuild chain hashes after deletion (recomputes all chain hashes)
 */
export function rebuildChainHashes(
  items: Array<{ content_hash: string; captured_at: string }>
): string[] {
  const chainHashes: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const previousHash = i === 0 ? null : chainHashes[i - 1];
    chainHashes.push(createChainHash(previousHash, items[i].content_hash, items[i].captured_at));
  }
  return chainHashes;
}
