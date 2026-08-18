import { knowledgeGraph } from '../data/knowledge-graph.js';

const MAX_PROPAGATION_DEPTH = 3;
const PROPAGATION_DECAY = 0.4;
const CONVERGENCE_MULTIPLIER = 1.2;
const DIMINISHING_RETURNS = 0.6;

export function analyzeReels(watchedReels) {
  if (!watchedReels || watchedReels.length === 0) {
    return [];
  }

  const topicScores = {};
  const topicHitCount = {};

  for (const reel of watchedReels) {
    const engagementWeight = knowledgeGraph.engagementWeights[reel.engagementType] || 0.3;

    for (const tag of reel.tags) {
      if (!topicScores[tag]) {
        topicScores[tag] = { raw: 0, weighted: 0, evidence: [] };
      }
      if (topicHitCount[tag] === undefined) {
        topicHitCount[tag] = 0;
      }
      topicHitCount[tag]++;

      const diminishing = Math.pow(DIMINISHING_RETURNS, topicHitCount[tag] - 1);
      const effectiveWeight = engagementWeight * diminishing;

      topicScores[tag].raw += 1;
      topicScores[tag].weighted += effectiveWeight;
      topicScores[tag].evidence.push({
        reelId: reel.id,
        reelTitle: reel.title,
        engagement: reel.engagementType,
        weight: effectiveWeight
      });

      propagateInterest(tag, effectiveWeight, topicScores, new Set([tag]), 0);
    }
  }

  const clusterScores = scoreClusters(topicScores);
  const clusterResults = buildClusterResults(clusterScores, topicScores, watchedReels);

  clusterResults.sort((a, b) => b.confidence - a.confidence);

  return clusterResults.filter(c => c.confidence > 0.05);
}

function propagateInterest(topic, weight, topicScores, visited, depth) {
  if (depth >= MAX_PROPAGATION_DEPTH) return;

  const topicNode = knowledgeGraph.topics[topic];
  if (!topicNode) return;

  for (const connected of topicNode.connections) {
    if (visited.has(connected)) continue;
    visited.add(connected);

    const decayedWeight = weight * PROPAGATION_DECAY * (1 / (depth + 1));

    if (!topicScores[connected]) {
      topicScores[connected] = { raw: 0, weighted: 0, evidence: [] };
    }
    topicScores[connected].weighted += decayedWeight;
    topicScores[connected].raw += 0.5;

    propagateInterest(connected, decayedWeight, topicScores, visited, depth + 1);
  }
}

function scoreClusters(topicScores) {
  const clusterScores = {};

  for (const [clusterName, cluster] of Object.entries(knowledgeGraph.interestClusters)) {
    let score = 0;
    let anchorHits = 0;

    for (const anchor of cluster.anchorTopics) {
      if (topicScores[anchor]) {
        score += topicScores[anchor].weighted;
        anchorHits++;
      }
    }

    if (anchorHits > 1) {
      score *= CONVERGENCE_MULTIPLIER;
    }

    score *= cluster.weight;

    const rawConfidence = score / (anchorHits * 1.5 + 0.5);
    const confidence = Math.min(1 - Math.exp(-rawConfidence * 1.8), 1.0);

    clusterScores[clusterName] = {
      confidence,
      score,
      anchorHits,
      totalAnchors: cluster.anchorTopics.length,
      description: cluster.description,
      difficulty: cluster.difficulty
    };
  }

  return clusterScores;
}

function buildClusterResults(clusterScores, topicScores, watchedReels) {
  const results = [];

  for (const [name, data] of Object.entries(clusterScores)) {
    if (data.confidence < 0.05) continue;

    const evidence = [];
    const cluster = knowledgeGraph.interestClusters[name];

    for (const anchor of cluster.anchorTopics) {
      if (topicScores[anchor]) {
        for (const ev of topicScores[anchor].evidence) {
          evidence.push(ev);
        }
      }
    }

    const uniqueEvidence = [];
    const seenReels = new Set();
    for (const ev of evidence) {
      if (!seenReels.has(ev.reelId)) {
        seenReels.add(ev.reelId);
        uniqueEvidence.push(ev);
      }
    }

    const avgEngagement = uniqueEvidence.length > 0
      ? uniqueEvidence.reduce((sum, e) => sum + e.weight, 0) / uniqueEvidence.length
      : 0;

    results.push({
      cluster: name,
      confidence: Math.round(data.confidence * 100) / 100,
      weight: data.score,
      difficulty: data.difficulty,
      description: data.description,
      evidence: uniqueEvidence,
      avgEngagement: Math.round(avgEngagement * 100) / 100
    });
  }

  return results;
}

export function getInterestSummary(interests) {
  if (interests.length === 0) return "No clear interests detected.";

  const top = interests[0];
  const confidenceLabel = top.confidence > 0.7 ? "Strong" :
    top.confidence > 0.4 ? "Moderate" : "Emerging";

  return `${confidenceLabel} interest in ${top.cluster} (${Math.round(top.confidence * 100)}% confidence)`;
}
