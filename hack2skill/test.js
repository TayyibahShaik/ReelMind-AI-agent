// Quick engine test — verifies trap detection works correctly
import { sampleReels } from './data/reels.js';
import { techReelPool } from './data/recommendations.js';
import { analyzeReels } from './engine/interest-analyzer.js';
import { generateRecommendations } from './engine/recommender.js';
import { formatRecommendations, formatInterestAnalysis } from './engine/formatter.js';

console.log("=== ReelMind Engine Verification ===\n");

// TEST 1: Trap Test — select exactly the 4 trap Reels
console.log("--- TEST 1: Trap Test (Java meme + SWE lifestyle + Coding interview + Laptop comparison) ---");
const trapReels = sampleReels
  .filter(r => r.isTrap)
  .map(r => ({ ...r, engagementType: 'liked' }));

console.log(`Selected ${trapReels.length} trap reels:`);
trapReels.forEach(r => console.log(`  - "${r.title}" [${r.category}]`));

const interests = analyzeReels(trapReels);
console.log(`\nInferred ${interests.length} interest clusters:`);
interests.forEach(i => {
  console.log(`  - ${i.cluster}: ${Math.round(i.confidence * 100)}% confidence (difficulty: ${i.difficulty})`);
});

const topCluster = interests[0]?.cluster;
const isSoftwareEngineering = topCluster === 'Software Engineering';
console.log(`\nTop cluster: "${topCluster}"`);
console.log(`Is "Software Engineering"? ${isSoftwareEngineering ? "YES (PASS)" : "NO (FAIL)"}`);

// Verify it's NOT just "Java"
const hasJavaAsTop = interests.some(i => i.cluster === 'Java' && i.confidence > 0.5);
console.log(`NOT just "Java"? ${!hasJavaAsTop ? "YES (PASS)" : "NO (FAIL — Java dominance detected)"}`);

// TEST 2: Anti-hype filter
console.log("\n--- TEST 2: Anti-Hype Filter ---");
const recommendations = generateRecommendations(interests, techReelPool);
const formatted = formatRecommendations(recommendations, interests);

const hypeReels = formatted.filter(r =>
  r.title.includes('10 AI Tools') ||
  r.title.includes('One Trick') ||
  r.title.includes("Won't Believe")
);
console.log(`Hype/Clickbait Reels in top recommendations: ${hypeReels.length}`);
if (hypeReels.length > 0) {
  hypeReels.forEach(r => console.log(`  WARNING: "${r.title}" (rank #${r.rank})`));
} else {
  console.log("PASS: No hype content in recommendations");
}

// TEST 3: Verify recommendations are relevant to SWE
console.log("\n--- TEST 3: Recommendation Relevance ---");
console.log(`Total recommendations: ${formatted.length}`);
formatted.forEach(r => {
  console.log(`  #${r.rank} "${r.title}" [${r.category}] — ${Math.round(r.matchScore * 100)}% match`);
});

// TEST 4: Verify output format
console.log("\n--- TEST 4: Output Format Verification ---");
const rec = formatted[0];
const requiredFields = ['rank', 'title', 'category', 'difficulty', 'description', 'educationalValue', 'matchScore', 'why', 'whyThisRecommendation'];
const missing = requiredFields.filter(f => rec[f] === undefined);
if (missing.length === 0) {
  console.log("PASS: All required fields present");
} else {
  console.log(`FAIL: Missing fields: ${missing.join(', ')}`);
}

console.log("\n=== Verification Complete ===");
