import { sampleReels } from './data/reels.js';
import { techReelPool } from './data/recommendations.js';
import { analyzeReels } from './engine/interest-analyzer.js';
import { generateRecommendations } from './engine/recommender.js';
import { formatRecommendations, formatInterestAnalysis } from './engine/formatter.js';

const state = {
  reels: sampleReels.map(r => ({ ...r })),
  engagements: {},
  analysisResults: null,
  recommendations: null
};

function init() {
  window.__reelmind_loaded = true;
  renderReelFeed();
  setupStartButton();
  setupAnalyzeButton();
}

// ==================== RENDER REEL FEED ====================

function renderReelFeed() {
  const feed = document.getElementById('reel-feed');
  feed.innerHTML = '';

  state.reels.forEach((reel, index) => {
    const card = createReelCard(reel, index);
    feed.appendChild(card);
  });
}

function createReelCard(reel, index) {
  const card = document.createElement('div');
  card.className = 'reel-card hover-lift';
  card.dataset.reelId = reel.id;
  card.style.animationDelay = `${index * 0.08}s`;

  const patternSvg = generateThumbnailPattern(reel);
  const categoryClass = `category-${reel.category.toLowerCase()}`;

  card.innerHTML = `
    <div class="reel-thumbnail">
      <div class="thumbnail-pattern">${patternSvg}</div>
      <span class="reel-duration">${reel.duration}</span>
      <span class="reel-category-badge ${categoryClass}">${reel.category}</span>
    </div>
    <div class="reel-info">
      <h3 class="reel-title">${reel.title}</h3>
      <p class="reel-creator">@${reel.creator}</p>
      <p class="reel-description">${reel.description}</p>
      <div class="reel-tags">
        ${reel.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="engagement-bar">
        <button class="engagement-btn btn-like" data-type="liked" data-reel="${reel.id}">
          <span class="engagement-icon">&#10084;</span>
          <span class="engagement-label">Like</span>
        </button>
        <button class="engagement-btn btn-share" data-type="shared" data-reel="${reel.id}">
          <span class="engagement-icon">&#8618;</span>
          <span class="engagement-label">Share</span>
        </button>
        <button class="engagement-btn btn-comment" data-type="commented" data-reel="${reel.id}">
          <span class="engagement-icon">&#9998;</span>
          <span class="engagement-label">Comment</span>
        </button>
      </div>
    </div>
  `;

  setupCardEngagement(card, reel);
  return card;
}

function generateThumbnailPattern(reel) {
  const hueMap = {
    'Entertainment': 320,
    'Career': 270,
    'Technology': 190,
    'Education': 160
  };
  const hue = hueMap[reel.category] || 200;
  const seed = reel.id.charCodeAt(reel.id.length - 1);

  const shapes = [];
  for (let i = 0; i < 6; i++) {
    const x = 30 + (seed * (i + 1) * 37) % 240;
    const y = 20 + (seed * (i + 1) * 53) % 140;
    const r = 10 + (seed * (i + 1)) % 30;
    const opacity = 0.1 + (i * 0.08);
    shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="hsl(${hue + i * 15}, 70%, 60%)" opacity="${opacity}"/>`);
  }

  return `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="180" fill="hsl(${hue}, 20%, 8%)"/>
    <text x="150" y="100" text-anchor="middle" dominant-baseline="central"
          font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="hsl(${hue}, 60%, 70%)" opacity="0.3">
      ${reel.category}
    </text>
    ${shapes.join('')}
  </svg>`;
}

// ==================== ENGAGEMENT HANDLING ====================

function setupCardEngagement(card, reel) {
  const buttons = card.querySelectorAll('.engagement-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const reelId = btn.dataset.reel;

      toggleEngagement(reelId, type, btn, card);
    });
  });
}

function toggleEngagement(reelId, type, btn, card) {
  const current = state.engagements[reelId];

  if (current === type) {
    delete state.engagements[reelId];
    btn.classList.remove('active');
    card.classList.remove('selected');
    hideCommentInput(card);
  } else {
    if (current) {
      const prevBtn = card.querySelector(`.engagement-btn[data-type="${current}"]`);
      if (prevBtn) prevBtn.classList.remove('active');
    }

    state.engagements[reelId] = type;
    btn.classList.add('active');
    card.classList.add('selected');

    if (type === 'commented') {
      showCommentInput(card, reelId);
    } else {
      hideCommentInput(card);
    }
  }

  updateSelectedCount();
}

function updateSelectedCount() {
  const count = Object.keys(state.engagements).length;
  document.getElementById('selected-count-num').textContent = count;

  const analyzeBtn = document.getElementById('analyze-btn');
  analyzeBtn.disabled = count === 0;
}

// ==================== ANALYSIS ====================

function setupStartButton() {
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('feed-section').classList.remove('hidden');
    document.getElementById('feed-section').classList.add('section-enter');
    document.getElementById('feed-section').scrollIntoView({ behavior: 'smooth' });
  });
}

function setupAnalyzeButton() {
  document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
}

function runAnalysis() {
  const watchedReels = buildWatchedReels();

  if (watchedReels.length === 0) return;

  document.getElementById('analysis-section').classList.remove('hidden');
  document.getElementById('analysis-section').classList.add('section-enter');
  document.getElementById('analysis-typing').classList.remove('hidden');
  document.getElementById('interest-clusters').classList.add('hidden');

  document.getElementById('analysis-section').scrollIntoView({ behavior: 'smooth' });

  const analyzeBtn = document.getElementById('analyze-btn');
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';

  setTimeout(() => {
    const interests = analyzeReels(watchedReels);
    state.analysisResults = formatInterestAnalysis(interests);

    const recommendations = generateRecommendations(interests, techReelPool);
    state.recommendations = formatRecommendations(recommendations, interests);

    renderInterestClusters(state.analysisResults);
    renderRecommendations(state.recommendations, interests);

    document.getElementById('analysis-typing').classList.add('hidden');
    document.getElementById('interest-clusters').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('recommendations-section').classList.remove('hidden');
      document.getElementById('recommendations-section').classList.add('section-enter');

      renderIntelligenceProfile(state.analysisResults, state.recommendations);

      document.getElementById('intelligence-section').classList.remove('hidden');
      document.getElementById('intelligence-section').classList.add('section-enter');

      animateClusterBars();
      animateEduBars();
    }, 600);

    analyzeBtn.querySelector('.btn-text').textContent = 'Re-Analyze';
    analyzeBtn.disabled = false;
  }, 2200);
}

function buildWatchedReels() {
  const watched = [];
  for (const reel of state.reels) {
    if (state.engagements[reel.id]) {
      watched.push({
        ...reel,
        engagementType: state.engagements[reel.id]
      });
    }
  }
  return watched;
}

// ==================== RENDER INTEREST CLUSTERS ====================

function renderInterestClusters(interests) {
  const container = document.getElementById('interest-clusters');
  container.innerHTML = '';

  interests.forEach((interest, index) => {
    const card = document.createElement('div');
    card.className = 'cluster-card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.animation = `cardEnter 0.5s ease-out ${index * 0.1}s backwards`;

    const confClass = interest.confidence > 0.6 ? 'confidence-high' :
      interest.confidence > 0.3 ? 'confidence-medium' : 'confidence-low';

    const diffClass = `difficulty-${interest.difficulty || 'beginner'}`;

    const evidenceHtml = interest.evidence.slice(0, 3).map(e => `
      <div class="evidence-item">
        <span class="evidence-engagement engagement-${e.engagement}">${e.engagement}</span>
        <span>${truncate(e.reel, 40)}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="cluster-header">
        <span class="cluster-name">${interest.cluster}</span>
        <span class="cluster-confidence ${confClass}">${Math.round(interest.confidence * 100)}%</span>
      </div>
      <div class="cluster-bar-wrapper">
        <div class="cluster-bar" data-width="${interest.confidence * 100}"></div>
      </div>
      <p class="cluster-description">${interest.description}</p>
      <div class="cluster-meta">
        <span class="meta-item">
          <span class="meta-dot"></span>
          ${interest.evidence.length} signal${interest.evidence.length !== 1 ? 's' : ''}
        </span>
        <span class="difficulty-badge ${diffClass}">${interest.difficulty || 'beginner'}</span>
        <span class="meta-item">
          <span class="meta-dot" style="background: var(--accent-cyan)"></span>
          Engagement avg: ${interest.avgEngagement}
        </span>
      </div>
      ${evidenceHtml ? `<div class="evidence-list">${evidenceHtml}</div>` : ''}
    `;

    container.appendChild(card);
  });
}

function animateClusterBars() {
  requestAnimationFrame(() => {
    const bars = document.querySelectorAll('.cluster-bar');
    bars.forEach(bar => {
      const width = bar.dataset.width;
      setTimeout(() => {
        bar.style.width = `${width}%`;
      }, 100);
    });
  });
}

// ==================== RENDER RECOMMENDATIONS ====================

function renderRecommendations(recommendations, interests) {
  renderRecSummary(recommendations);

  const container = document.getElementById('recommendation-list');
  container.innerHTML = '';

  recommendations.forEach((rec, index) => {
    const card = document.createElement('div');
    card.className = 'rec-card';
    card.style.animationDelay = `${index * 0.08}s`;

    const diffClass = `difficulty-${(rec.difficulty || 'beginner').toLowerCase()}`;

    const tagsHtml = rec.tags.slice(0, 5).map(t =>
      `<span class="tag">${t}</span>`
    ).join('');

    card.innerHTML = `
      <span class="rec-rank">#${rec.rank}</span>
      <div class="rec-top">
        <div class="rec-main-info">
          <h3 class="rec-title">${rec.title}</h3>
          <div class="rec-badges">
            <span class="rec-badge rec-badge-interest">Detected: ${rec.interestDetected}</span>
            <span class="rec-badge rec-badge-category">${rec.category}</span>
            <span class="rec-badge rec-badge-match">${Math.round(rec.matchScore * 100)}% match</span>
            <span class="difficulty-badge ${diffClass}">${rec.difficulty}</span>
          </div>
        </div>
      </div>
      <p class="rec-description">${rec.description}</p>
      <div class="rec-sections">
        <div class="rec-section">
          <div class="rec-section-label">WHY</div>
          <div class="rec-section-text">${rec.why}</div>
        </div>
        <div class="rec-section">
          <div class="rec-section-label">WHY THIS RECOMMENDATION</div>
          <div class="rec-section-text">${rec.whyThisRecommendation}</div>
        </div>
      </div>
      <div class="rec-tags">${tagsHtml}</div>
      <div class="rec-edu-score">
        <span class="edu-label">Edu Value</span>
        <div class="edu-bar-wrapper">
          <div class="edu-bar" data-width="${rec.educationalValue * 10}"></div>
        </div>
        <span class="edu-label">${rec.educationalValue}/10</span>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderRecSummary(recommendations) {
  const container = document.getElementById('rec-summary');
  const avgMatch = recommendations.reduce((s, r) => s + r.matchScore, 0) / recommendations.length;
  const avgEdu = recommendations.reduce((s, r) => s + r.educationalValue, 0) / recommendations.length;
  const categories = new Set(recommendations.map(r => r.category)).size;

  container.innerHTML = `
    <div class="summary-stat">
      <div class="summary-number">${recommendations.length}</div>
      <div class="summary-label">Recommendations</div>
    </div>
    <div class="summary-stat">
      <div class="summary-number">${Math.round(avgMatch * 100)}%</div>
      <div class="summary-label">Avg Match</div>
    </div>
    <div class="summary-stat">
      <div class="summary-number">${avgEdu.toFixed(1)}</div>
      <div class="summary-label">Avg Edu Value</div>
    </div>
    <div class="summary-stat">
      <div class="summary-number">${categories}</div>
      <div class="summary-label">Categories</div>
    </div>
  `;
}

function animateEduBars() {
  requestAnimationFrame(() => {
    const bars = document.querySelectorAll('.edu-bar');
    bars.forEach((bar, i) => {
      const width = bar.dataset.width;
      setTimeout(() => {
        bar.style.width = `${width}%`;
      }, 200 + i * 100);
    });
  });
}

// ==================== AGGREGATED INTELLIGENCE ====================

function renderIntelligenceProfile(interests, recommendations) {
  const container = document.getElementById('intelligence-content');
  container.innerHTML = '';

  if (!interests || interests.length === 0) return;

  const primary = interests[0];
  const secondary = interests.slice(1, 4);
  const topRecs = recommendations.slice(0, 5);

  const profile = document.createElement('div');
  profile.className = 'intel-profile';

  profile.innerHTML = `
    <div class="intel-grid">
      <div class="intel-card intel-primary">
        <div class="intel-card-header">
          <span class="intel-card-icon">&#127919;</span>
          <span class="intel-card-label">Primary Interest</span>
        </div>
        <h3 class="intel-cluster-name">${primary.cluster}</h3>
        <div class="intel-confidence-bar">
          <div class="intel-confidence-fill" data-width="${primary.confidence * 100}"></div>
        </div>
        <p class="intel-confidence-text">${Math.round(primary.confidence * 100)}% confidence</p>
        <p class="intel-description">${primary.description}</p>
      </div>

      <div class="intel-card intel-secondary">
        <div class="intel-card-header">
          <span class="intel-card-icon">&#128293;</span>
          <span class="intel-card-label">Secondary Interests</span>
        </div>
        <div class="intel-secondary-list">
          ${secondary.map(s => `
            <div class="intel-secondary-item">
              <span class="intel-secondary-name">${s.cluster}</span>
              <div class="intel-secondary-bar-wrapper">
                <div class="intel-secondary-bar" data-width="${s.confidence * 100}"></div>
              </div>
              <span class="intel-secondary-conf">${Math.round(s.confidence * 100)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="intel-card intel-path">
      <div class="intel-card-header">
        <span class="intel-card-icon">&#128218;</span>
        <span class="intel-card-label">Suggested Learning Path</span>
      </div>
      <div class="learning-path">
        ${buildLearningPath(interests, topRecs)}
      </div>
    </div>

    <div class="intel-card intel-top-picks">
      <div class="intel-card-header">
        <span class="intel-card-icon">&#11088;</span>
        <span class="intel-card-label">Top 5 Recommended Reels</span>
      </div>
      <div class="intel-top-list">
        ${topRecs.map((r, i) => `
          <div class="intel-top-item">
            <span class="intel-top-rank">${i + 1}</span>
            <div class="intel-top-info">
              <span class="intel-top-title">${r.title}</span>
              <span class="intel-top-meta">${r.category} &middot; ${r.difficulty} &middot; ${Math.round(r.matchScore * 100)}% match</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.appendChild(profile);

  requestAnimationFrame(() => {
    container.querySelectorAll('.intel-confidence-fill').forEach(el => {
      setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 200);
    });
    container.querySelectorAll('.intel-secondary-bar').forEach(el => {
      setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 400);
    });
  });
}

function buildLearningPath(interests, topRecs) {
  const steps = [];
  const primary = interests[0];

  steps.push({
    phase: 'Foundation',
    description: `Build core understanding of ${primary.cluster}`,
    reels: topRecs.filter(r => r.difficulty === 'Beginner').slice(0, 2)
  });

  if (interests.length > 1) {
    steps.push({
      phase: 'Explore',
      description: `Branch into ${interests[1].cluster}`,
      reels: topRecs.filter(r => r.difficulty === 'Intermediate').slice(0, 2)
    });
  }

  steps.push({
    phase: 'Level Up',
    description: 'Challenge yourself with advanced content',
    reels: topRecs.filter(r => r.difficulty === 'Advanced').slice(0, 1)
  });

  return steps.filter(s => s.reels.length > 0).map((step, i) => `
    <div class="path-step">
      <div class="path-step-marker">
        <span class="path-step-num">${i + 1}</span>
        ${i < steps.length - 1 ? '<div class="path-step-line"></div>' : ''}
      </div>
      <div class="path-step-content">
        <h4 class="path-step-phase">${step.phase}</h4>
        <p class="path-step-desc">${step.description}</p>
        <div class="path-step-reels">
          ${step.reels.map(r => `<span class="path-reel-tag">${r.title}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== COMMENT INPUT ====================

function showCommentInput(card, reelId) {
  let existing = card.querySelector('.comment-input-wrapper');
  if (existing) {
    existing.style.display = 'block';
    const input = existing.querySelector('.comment-input');
    if (input) input.focus();
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'comment-input-wrapper';
  wrapper.innerHTML = `
    <div class="comment-input-area">
      <textarea class="comment-input" placeholder="Write a comment..." rows="2" maxlength="280" data-reel="${reelId}"></textarea>
      <div class="comment-input-footer">
        <span class="comment-char-count"><span class="char-num">0</span>/280</span>
        <button class="comment-post-btn">Post</button>
      </div>
    </div>
  `;

  const engagementBar = card.querySelector('.engagement-bar');
  engagementBar.parentNode.insertBefore(wrapper, engagementBar.nextSibling);

  const textarea = wrapper.querySelector('.comment-input');
  const postBtn = wrapper.querySelector('.comment-post-btn');
  const charNum = wrapper.querySelector('.char-num');

  function postComment() {
    const text = textarea.value.trim();
    if (!text) return;
    state.comments = state.comments || {};
    state.comments[reelId] = text;
    postBtn.textContent = 'Posted!';
    postBtn.disabled = true;
    textarea.disabled = true;
    setTimeout(() => {
      postBtn.textContent = 'Post';
      postBtn.disabled = false;
      textarea.disabled = false;
      textarea.value = '';
      charNum.textContent = '0';
    }, 1500);
  }

  textarea.addEventListener('input', () => {
    charNum.textContent = textarea.value.length;
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      postComment();
    }
  });

  postBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    postComment();
  });

  textarea.focus();
}

function hideCommentInput(card) {
  const wrapper = card.querySelector('.comment-input-wrapper');
  if (wrapper) wrapper.style.display = 'none';
}

// ==================== UTILITIES ====================

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

// ==================== BOOT ====================
document.addEventListener('DOMContentLoaded', init);
