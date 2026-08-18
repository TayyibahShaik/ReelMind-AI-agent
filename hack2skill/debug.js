import { knowledgeGraph } from './data/knowledge-graph.js';

function analyzeReelsDebug(watchedReels) {
  if (!watchedReels || watchedReels.length === 0) {
    console.log("Empty input");
    return [];
  }

  const topicScores = {};
  const topicHitCount = {};

  for (const reel of watchedReels) {
    const engagementWeight = knowledgeGraph.engagementWeights[reel.engagementType] || 0.3;
    console.log("Reel:", reel.id, "engagement:", reel.engagementType, "weight:", engagementWeight);

    for (const tag of reel.tags) {
      if (!topicScores[tag]) {
        topicScores[tag] = { raw: 0, weighted: 0, evidence: [] };
        topicHitCount[tag] = 0;
      }
      topicHitCount[tag]++;

      const diminishing = Math.pow(0.6, topicHitCount[tag] - 1);
      const effectiveWeight = engagementWeight * diminishing;

      topicScores[tag].raw += 1;
      topicScores[tag].weighted += effectiveWeight;
      topicScores[tag].evidence.push({
        reelId: reel.id,
        reelTitle: reel.title,
        engagement: reel.engagementType,
        weight: effectiveWeight
      });

      // propagate
      propagateInterest(tag, effectiveWeight, topicScores, new Set([tag]), 0);
    }
  }

  console.log("\nTopic scores with weighted > 0.1:");
  for (const [k, v] of Object.entries(topicScores)) {
    if (v.weighted > 0.1) console.log("  " + k + ": " + v.weighted.toFixed(4));
  }

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
    if (anchorHits > 1) score *= 1.2;
    score *= cluster.weight;
    const rawConfidence = score / (anchorHits * 1.5 + 0.5);
    const confidence = Math.min(1 - Math.exp(-rawConfidence * 1.8), 1.0);
    clusterScores[clusterName] = { confidence, score, anchorHits };
    if (anchorHits > 0) {
      console.log("  Cluster " + clusterName + ": conf=" + confidence.toFixed(4) + " hits=" + anchorHits);
    }
  }

  var results = [];
  for (const [name, data] of Object.entries(clusterScores)) {
    if (data.confidence < 0.05) {
      console.log("  FILTERED OUT: " + name + " conf=" + data.confidence);
      continue;
    }
    results.push({ cluster: name, confidence: Math.round(data.confidence * 100) / 100 });
  }
  
  console.log("\nResults before filter:", Object.keys(clusterScores).length);
  console.log("Results after filter:", results.length);
  
  return results.sort((a, b) => b.confidence - a.confidence).filter(c => c.confidence > 0.05);
}

function propagateInterest(topic, weight, topicScores, visited, depth) {
  if (depth >= 3) return;
  const topicNode = knowledgeGraph.topics[topic];
  if (!topicNode) return;
  for (const connected of topicNode.connections) {
    if (visited.has(connected)) continue;
    visited.add(connected);
    const decayedWeight = weight * 0.4 * (1 / (depth + 1));
    if (!topicScores[connected]) {
      topicScores[connected] = { raw: 0, weighted: 0, evidence: [] };
    }
    topicScores[connected].weighted += decayedWeight;
    topicScores[connected].raw += 0.5;
    propagateInterest(connected, decayedWeight, topicScores, visited, depth + 1);
  }
}

var result = analyzeReelsDebug([
  { id: "test", tags: ["java", "coding", "software-engineering"], engagementType: "liked", title: "Test Reel" }
]);
console.log("\nFinal:", JSON.stringify(result));
