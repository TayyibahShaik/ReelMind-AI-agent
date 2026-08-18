/**
 * ReelMind — Gemini API Integration
 * 
 * Optional LLM enhancement using Google's Gemini API.
 * Provides natural-language interest analysis and recommendation reasoning.
 * Falls back to the knowledge graph engine if no API key is provided.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Check if Gemini API is available (API key provided)
 */
export function isGeminiAvailable() {
  return !!getStoredApiKey();
}

/**
 * Store API key in session storage (never persisted to disk)
 */
export function setApiKey(key) {
  if (key && key.trim()) {
    sessionStorage.setItem('reelmind_gemini_key', key.trim());
    return true;
  }
  return false;
}

/**
 * Get stored API key
 */
export function getStoredApiKey() {
  return sessionStorage.getItem('reelmind_gemini_key');
}

/**
 * Clear stored API key
 */
export function clearApiKey() {
  sessionStorage.removeItem('reelmind_gemini_key');
}

/**
 * Call Gemini API to enhance interest analysis
 * 
 * @param {Array} watchedReels - Array of { reel, engagementType } objects
 * @param {Array} localAnalysis - Results from the local knowledge graph analysis
 * @returns {Object} Enhanced analysis with LLM-generated insights
 */
export async function enhanceWithGemini(watchedReels, localAnalysis) {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key provided');
  }

  const prompt = buildAnalysisPrompt(watchedReels, localAnalysis);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Build the analysis prompt for Gemini
 */
function buildAnalysisPrompt(watchedReels, localAnalysis) {
  const reelDescriptions = watchedReels.map(({ reel, engagementType }) => 
    `- "${reel.title}" by ${reel.creator} (${reel.category}) — Student ${engagementType} this. Description: ${reel.description}`
  ).join('\n');

  const localInsights = localAnalysis
    .filter(i => i.isTech)
    .slice(0, 5)
    .map(i => `- ${i.cluster}: ${Math.round(i.confidence * 100)}% confidence`)
    .join('\n');

  return `You are ReelMind, an AI recommendation agent that analyzes a student's short-form video (Reels) consumption to infer deep interests and recommend educational technology content.

## Student's Watched Reels:
${reelDescriptions}

## Local Analysis Results (from knowledge graph):
${localInsights}

## Your Task:
Analyze the student's Reel interactions and provide DEEP interest inference. DO NOT do shallow keyword matching.

### Critical Rules:
1. **Infer broader interests**: If a student watches a Java meme, SWE lifestyle reel, coding interview joke, and laptop comparison — the BROADER interest is "Software Engineering / Developer Career", NOT just "Java".
2. **Avoid recommending hype content**: Do NOT recommend clickbait like "10 AI tools that will get you a job" or "Learn coding in 7 days". Recommend GENUINELY educational content.
3. **Be specific in explanations**: Explain WHY you detected each interest and WHY each recommendation fits.
4. **Consider engagement type**: A "liked" reel is a stronger signal than a "watched" reel.

### Required JSON Output Format:
{
  "overallInsight": "A 2-3 sentence summary of what the student's Reel consumption reveals about their interests",
  "dominantInterest": "The single strongest inferred interest (e.g., 'Software Engineering')",
  "perReelAnalysis": [
    {
      "reelTitle": "...",
      "interestDetected": "...",
      "why": "Evidence-based explanation of why this interest was detected",
      "recommendedTechReel": "A specific tech reel title to recommend",
      "category": "One of: AI / DSA / Java / HLD / Cybersecurity / Cloud / Hardware / Career / Other",
      "whyThisRecommendation": "How this recommendation connects to the detected interest",
      "difficulty": "Beginner / Intermediate / Advanced",
      "confidence": "High / Medium / Low"
    }
  ],
  "topRecommendations": [
    {
      "title": "...",
      "category": "...",
      "difficulty": "...",
      "whyThisRecommendation": "...",
      "confidence": "..."
    }
  ],
  "hypeContentWarning": "Brief note about any hype/clickbait content that was considered but filtered out"
}

Respond ONLY with valid JSON. No markdown, no code fences.`;
}

/**
 * Merge Gemini's analysis with local analysis for a richer result
 */
export function mergeAnalysis(localResults, geminiResults) {
  if (!geminiResults) return localResults;

  return {
    ...localResults,
    geminiInsight: geminiResults.overallInsight,
    geminiDominantInterest: geminiResults.dominantInterest,
    geminiPerReel: geminiResults.perReelAnalysis,
    geminiTopRecs: geminiResults.topRecommendations,
    geminiHypeWarning: geminiResults.hypeContentWarning,
    hasGeminiEnhancement: true
  };
}
