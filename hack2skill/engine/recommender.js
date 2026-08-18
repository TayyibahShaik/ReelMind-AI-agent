import { knowledgeGraph } from '../data/knowledge-graph.js';

const CLICKBAIT_PENALTY = 0.6;
const DIVERSITY_BONUS = 0.15;
const DIFFICULTY_MISMATCH_PENALTY = 0.3;

const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };

export function generateRecommendations(interests, reelPool) {
  if (!interests || interests.length === 0) {
    return reelPool
      .filter(r => r.qualityScore > 5)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5)
      .map(reel => ({
        ...reel,
        matchScore: reel.qualityScore / 10,
        reasons: ["Popular high-quality content"]
      }));
  }

  const topDifficulty = inferDifficulty(interests);
  const matchedReels = [];

  for (const reel of reelPool) {
    const matchResult = scoreReel(reel, interests, topDifficulty);
    if (matchResult.score > 0.1) {
      matchedReels.push({
        ...reel,
        matchScore: Math.min(Math.round(matchResult.score * 100) / 100, 1.0),
        reasons: matchResult.reasons
      });
    }
  }

  applyDiversityBonus(matchedReels);

  matchedReels.sort((a, b) => b.matchScore - a.matchScore);

  return matchedReels.slice(0, 10);
}

function inferDifficulty(interests) {
  const difficultySignals = {
    "Beginner": 0,
    "Intermediate": 0,
    "Advanced": 0
  };

  for (const interest of interests) {
    const conf = interest.confidence;
    const diff = interest.difficulty || "beginner";
    const normalizedDiff = diff.charAt(0).toUpperCase() + diff.slice(1);

    if (difficultyOrder[normalizedDiff]) {
      difficultySignals[normalizedDiff] += conf;
    }

    if (interest.avgEngagement < 0.4) {
      difficultySignals["Beginner"] += 0.2;
    }
    if (interest.avgEngagement > 0.7) {
      difficultySignals["Intermediate"] += 0.15;
    }
  }

  let maxDiff = "Beginner";
  let maxScore = 0;
  for (const [diff, score] of Object.entries(difficultySignals)) {
    if (score > maxScore) {
      maxScore = score;
      maxDiff = diff;
    }
  }

  return maxDiff;
}

function scoreReel(reel, interests, topDifficulty) {
  let score = 0;
  const reasons = [];

  const clickbaitPenalty = calculateClickbaitPenalty(reel);
  if (clickbaitPenalty > 0) {
    score -= clickbaitPenalty;
    reasons.push("Clickbait signals detected");
  }

  if (reel.qualityScore >= 7) {
    score += (reel.qualityScore / 10) * 0.4;
    reasons.push(`High quality content (${reel.qualityScore}/10)`);
  } else if (reel.qualityScore < 5) {
    score -= 0.3;
    reasons.push("Low educational value");
  }

  const interestMatch = calculateInterestMatch(reel, interests);
  score += interestMatch.score;
  reasons.push(...interestMatch.reasons);

  const diffPenalty = calculateDifficultyPenalty(reel.difficulty, topDifficulty);
  score += diffPenalty;

  const eduScore = (reel.educationalValue / 10) * 0.3;
  score += eduScore;
  if (reel.educationalValue >= 8) {
    reasons.push(`Highly educational (${reel.educationalValue}/10)`);
  }

  return { score: Math.min(Math.max(score, 0), 1.0), reasons };
}

function calculateClickbaitPenalty(reel) {
  if (!reel.clickbaitSignals || reel.clickbaitSignals.length === 0) return 0;
  return CLICKBAIT_PENALTY * (reel.clickbaitSignals.length / 4);
}

function calculateInterestMatch(reel, interests) {
  let matchScore = 0;
  const reasons = [];
  const matchedClusters = new Set();

  for (const interest of interests) {
    const cluster = knowledgeGraph.interestClusters[interest.cluster];
    if (!cluster) continue;

    const reelTags = new Set(reel.tags);

    for (const anchor of cluster.anchorTopics) {
      if (reelTags.has(anchor)) {
        matchScore += interest.confidence * 0.5;
        matchedClusters.add(interest.cluster);
        break;
      }
    }

    for (const tag of reel.tags) {
      const topicNode = knowledgeGraph.topics[tag];
      if (!topicNode) continue;

      for (const anchor of cluster.anchorTopics) {
        if (topicNode.connections.includes(anchor)) {
          matchScore += interest.confidence * 0.2;
          matchedClusters.add(interest.cluster);
          break;
        }
      }
    }
  }

  if (matchedClusters.size > 0) {
    reasons.push(`Matches ${Array.from(matchedClusters).join(", ")}`);
  }

  return { score: Math.min(matchScore, 1.0), reasons };
}

function calculateDifficultyPenalty(reelDifficulty, topDifficulty) {
  if (!reelDifficulty || !topDifficulty) return 0;

  const reelLevel = difficultyOrder[reelDifficulty] || 1;
  const topLevel = difficultyOrder[topDifficulty] || 1;

  const diff = Math.abs(reelLevel - topLevel);

  if (diff === 0) return 0.1;
  if (diff === 1) return 0;
  return -DIFFICULTY_MISMATCH_PENALTY;
}

function applyDiversityBonus(reels) {
  const categoryCounts = {};
  for (const reel of reels) {
    categoryCounts[reel.category] = (categoryCounts[reel.category] || 0) + 1;
  }

  for (const reel of reels) {
    if (categoryCounts[reel.category] === 1) {
      reel.matchScore = Math.min(reel.matchScore + DIVERSITY_BONUS, 1.0);
      if (!reel.reasons.includes("Diverse category recommendation")) {
        reel.reasons.push("Diverse category recommendation");
      }
    }
  }
}
