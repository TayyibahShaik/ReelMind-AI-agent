import { knowledgeGraph } from '../data/knowledge-graph.js';

export function formatRecommendations(recommendations, interests) {
  return recommendations.map((rec, index) => {
    const matchedInterests = findMatchingInterests(rec, interests);
    const primaryInterest = matchedInterests.length > 0 ? matchedInterests[0].cluster : interests[0]?.cluster || "General";

    return {
      rank: index + 1,
      title: rec.title,
      category: rec.category,
      difficulty: rec.difficulty,
      tags: rec.tags,
      description: rec.description,
      educationalValue: rec.educationalValue,
      qualityScore: rec.qualityScore,
      matchScore: rec.matchScore,
      interestDetected: primaryInterest,
      why: generateWhyExplanation(rec, interests),
      whyThisRecommendation: generateWhyThisExplanation(rec, interests),
      matchReasons: rec.reasons || []
    };
  });
}

function generateWhyExplanation(reel, interests) {
  const matchedInterests = findMatchingInterests(reel, interests);

  if (matchedInterests.length === 0) {
    return `This is a high-quality ${reel.category} resource with strong educational value (${reel.educationalValue}/10).`;
  }

  const explanations = [];

  for (const interest of matchedInterests.slice(0, 3)) {
    const cluster = knowledgeGraph.interestClusters[interest.cluster];
    const confidence = Math.round(interest.confidence * 100);

    const matchingTags = findMatchingTags(reel, interest);
    if (matchingTags.length > 0) {
      const tagStr = matchingTags.slice(0, 3).map(t => `"${knowledgeGraph.topics[t]?.label || t}"`).join(", ");
      explanations.push(
        `Your engagement with ${tagStr} topics indicates a ${confidence}% interest in ${interest.cluster}`
      );
    } else {
      explanations.push(
        `Your viewing patterns show ${confidence}% alignment with ${interest.cluster}`
      );
    }
  }

  if (explanations.length > 0) {
    return explanations.join(". ") + ".";
  }

  return `Recommended based on your overall engagement patterns in ${matchedInterests[0]?.cluster || "tech"}.`;
}

function generateWhyThisExplanation(reel, interests) {
  const reasons = [];

  if (reel.matchScore > 0.7) {
    reasons.push(`Strong match (score: ${Math.round(reel.matchScore * 100)}%)`);
  } else if (reel.matchScore > 0.4) {
    reasons.push(`Good match (score: ${Math.round(reel.matchScore * 100)}%)`);
  } else {
    reasons.push(`Relevant content (score: ${Math.round(reel.matchScore * 100)}%)`);
  }

  if (reel.educationalValue >= 8) {
    reasons.push(`Highly educational content (${reel.educationalValue}/10 educational value)`);
  }

  const difficultyLabel = reel.difficulty || "mixed";
  reasons.push(`${difficultyLabel} difficulty level — ${getDifficultyRationale(reel.difficulty, interests)}`);

  const matchedClusters = findMatchingInterests(reel, interests).map(i => i.cluster);
  if (matchedClusters.length > 0) {
    reasons.push(`Aligns with your ${matchedClusters.join(" and ")} interests`);
  }

  if (reel.qualityScore >= 8) {
    reasons.push(`High-quality resource (rated ${reel.qualityScore}/10)`);
  }

  return reasons.join(". ") + ".";
}

function getDifficultyRationale(difficulty, interests) {
  const topInterest = interests[0];
  if (!topInterest) return "suitable for your current level";

  const interestDiff = topInterest.difficulty || "beginner";

  if (difficulty === "Beginner") {
    return "great starting point to build foundational understanding";
  } else if (difficulty === "Intermediate") {
    return "builds on your existing knowledge with deeper concepts";
  } else {
    return "challenging content to push your expertise further";
  }
}

function findMatchingInterests(reel, interests) {
  return interests.filter(interest => {
    const cluster = knowledgeGraph.interestClusters[interest.cluster];
    if (!cluster) return false;

    const reelTags = new Set(reel.tags);

    for (const anchor of cluster.anchorTopics) {
      if (reelTags.has(anchor)) return true;

      const topicNode = knowledgeGraph.topics[anchor];
      if (topicNode) {
        for (const conn of topicNode.connections) {
          if (reelTags.has(conn)) return true;
        }
      }
    }

    return false;
  });
}

function findMatchingTags(reel, interest) {
  const cluster = knowledgeGraph.interestClusters[interest.cluster];
  if (!cluster) return [];

  const reelTags = new Set(reel.tags);
  const matches = [];

  for (const anchor of cluster.anchorTopics) {
    if (reelTags.has(anchor)) {
      matches.push(anchor);
    }
  }

  return matches;
}

export function formatInterestAnalysis(interests) {
  return interests.map(interest => ({
    cluster: interest.cluster,
    confidence: interest.confidence,
    confidenceLabel: getConfidenceLabel(interest.confidence),
    description: interest.description,
    difficulty: interest.difficulty,
    evidenceCount: interest.evidence.length,
    avgEngagement: interest.avgEngagement,
    evidence: interest.evidence.map(e => ({
      reel: e.reelTitle,
      engagement: e.engagement,
      signalStrength: e.weight
    }))
  }));
}

function getConfidenceLabel(confidence) {
  if (confidence > 0.8) return "Very Strong";
  if (confidence > 0.6) return "Strong";
  if (confidence > 0.4) return "Moderate";
  if (confidence > 0.2) return "Emerging";
  return "Weak";
}
