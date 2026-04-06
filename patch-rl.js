const fs = require('fs');

const files = [
  { path: 'd:/clausewall/app/api/reasoning/challenge/route.ts', tier: 'AI_HEAVY' },
  { path: 'd:/clausewall/app/api/reasoning/explain-step/route.ts', tier: 'AI_FAST' },
  { path: 'd:/clausewall/app/api/reasoning/proof/[clauseId]/route.ts', tier: 'DB_READ' },
  { path: 'd:/clausewall/app/api/reasoning/prove/route.ts', tier: 'AI_HEAVY' },
  { path: 'd:/clausewall/app/api/statemachine/extract/route.ts', tier: 'AI_HEAVY' },
  { path: 'd:/clausewall/app/api/statemachine/path/route.ts', tier: 'AI_FAST' },
  { path: 'd:/clausewall/app/api/statemachine/simulate/route.ts', tier: 'AI_FAST' },
  { path: 'd:/clausewall/app/api/statemachine/[documentId]/route.ts', tier: 'DB_READ' },
  { path: 'd:/clausewall/app/api/adversarial/route.ts', tier: 'AI_HEAVY' },
  { path: 'd:/clausewall/app/api/deliberation/run/route.ts', tier: 'AI_HEAVY' },
  { path: 'd:/clausewall/app/api/deliberation/single/route.ts', tier: 'AI_FAST' },
  { path: 'd:/clausewall/app/api/deliberation/[documentId]/route.ts', tier: 'DB_READ' },
  { path: 'd:/clausewall/app/api/verify-clauses/route.ts', tier: 'DB_WRITE' },
  { path: 'd:/clausewall/app/api/voice/respond/route.ts', tier: 'AI_HEAVY' }
];

let modifiedFiles = 0;

for (const {path, tier} of files) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');
  
  if (content.includes('rateLimit(')) continue;

  // Add imports if missing
  if (!content.includes('@/lib/rate-limit')) {
    content = content.replace(/(import.*?"next\/server";)/, "$1\nimport { rateLimit, rateLimitResponse } from \"@/lib/rate-limit\";");
  }
  if (!content.includes('@/lib/supabase/server')) {
    content = content.replace(/(import.*?"next\/server";)/, "$1\nimport { createClient } from \"@/lib/supabase/server\";");
  }

  // Inject RL logic
  const rlLogic = `\n    const supabase = await createClient();\n    const { data: { user } } = await supabase.auth.getUser();\n    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n    \n    const rl = await rateLimit(request, "${tier}", user.id);\n    if (!rl.success) return rateLimitResponse(rl);\n`;
  
  const fnMatch = content.match(/export async function (POST|GET)\(.*?\) {[\s\S]*?try {/);
  if (fnMatch) {
    content = content.replace(fnMatch[0], fnMatch[0] + rlLogic);
    fs.writeFileSync(path, content, 'utf8');
    modifiedFiles++;
    console.log("Patched", path);
  } else {
    console.log("Could not patch", path);
  }
}

console.log("Total patched:", modifiedFiles);
