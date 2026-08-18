export const knowledgeGraph = {
  topics: {
    "java-meme": {
      label: "Java Humor",
      connections: ["programming-humor", "java", "software-engineering"],
      baseWeight: 0.6
    },
    "programming-humor": {
      label: "Programming Humor",
      connections: ["software-engineering", "coding", "developer-culture"],
      baseWeight: 0.5
    },
    "software-engineering": {
      label: "Software Engineering",
      connections: ["developer-career", "coding", "system-design", "developer-tools"],
      baseWeight: 0.9
    },
    "swe-lifestyle": {
      label: "SWE Lifestyle",
      connections: ["software-engineering", "developer-career", "startup-culture"],
      baseWeight: 0.85
    },
    "coding-interview": {
      label: "Coding Interviews",
      connections: ["dsa", "developer-career", "software-engineering", "career-prep"],
      baseWeight: 0.8
    },
    "dsa": {
      label: "Data Structures & Algorithms",
      connections: ["software-engineering", "coding", "career-prep", "computer-science"],
      baseWeight: 0.9
    },
    "laptop-comparison": {
      label: "Laptop Comparison",
      connections: ["hardware", "developer-tools", "tech-buying", "dev-setup"],
      baseWeight: 0.55
    },
    "developer-tools": {
      label: "Developer Tools",
      connections: ["software-engineering", "productivity", "dev-setup", "coding"],
      baseWeight: 0.75
    },
    "developer-career": {
      label: "Developer Career",
      connections: ["software-engineering", "career-prep", "swe-lifestyle"],
      baseWeight: 0.85
    },
    "ai-tools": {
      label: "AI Tools",
      connections: ["artificial-intelligence", "productivity", "developer-tools"],
      baseWeight: 0.65
    },
    "artificial-intelligence": {
      label: "Artificial Intelligence",
      connections: ["machine-learning", "computer-science", "future-tech"],
      baseWeight: 0.8
    },
    "career-prep": {
      label: "Career Preparation",
      connections: ["developer-career", "coding-interview", "dsa"],
      baseWeight: 0.8
    },
    "coding": {
      label: "Coding",
      connections: ["software-engineering", "programming", "developer-tools"],
      baseWeight: 0.7
    },
    "hardware": {
      label: "Hardware",
      connections: ["laptop-comparison", "tech-buying", "gadgets"],
      baseWeight: 0.5
    },
    "tech-buying": {
      label: "Tech Purchasing",
      connections: ["hardware", "developer-tools", "gadgets"],
      baseWeight: 0.4
    },
    "dev-setup": {
      label: "Developer Setup",
      connections: ["developer-tools", "hardware", "productivity"],
      baseWeight: 0.6
    },
    "startup-culture": {
      label: "Startup Culture",
      connections: ["software-engineering", "developer-career", "swe-lifestyle"],
      baseWeight: 0.6
    },
    "productivity": {
      label: "Productivity",
      connections: ["developer-tools", "self-improvement", "dev-setup"],
      baseWeight: 0.55
    },
    "machine-learning": {
      label: "Machine Learning",
      connections: ["artificial-intelligence", "computer-science", "data-science"],
      baseWeight: 0.75
    },
    "computer-science": {
      label: "Computer Science",
      connections: ["dsa", "machine-learning", "system-design"],
      baseWeight: 0.85
    },
    "system-design": {
      label: "System Design",
      connections: ["software-engineering", "computer-science", "high-level-design"],
      baseWeight: 0.9
    },
    "high-level-design": {
      label: "High-Level Design",
      connections: ["system-design", "software-engineering"],
      baseWeight: 0.85
    },
    "cybersecurity": {
      label: "Cybersecurity",
      connections: ["computer-science", "networking", "ethical-hacking"],
      baseWeight: 0.8
    },
    "cloud": {
      label: "Cloud Computing",
      connections: ["devops", "system-design", "infrastructure"],
      baseWeight: 0.75
    },
    "devops": {
      label: "DevOps",
      connections: ["cloud", "software-engineering", "infrastructure"],
      baseWeight: 0.7
    },
    "networking": {
      label: "Networking",
      connections: ["cybersecurity", "cloud", "computer-science"],
      baseWeight: 0.65
    },
    "future-tech": {
      label: "Future Technology",
      connections: ["artificial-intelligence", "quantum-computing"],
      baseWeight: 0.6
    },
    "quantum-computing": {
      label: "Quantum Computing",
      connections: ["computer-science", "future-tech"],
      baseWeight: 0.5
    },
    "career": {
      label: "Career",
      connections: ["developer-career", "swe-lifestyle", "career-prep"],
      baseWeight: 0.7
    },
    "self-improvement": {
      label: "Self-Improvement",
      connections: ["career", "productivity", "motivation"],
      baseWeight: 0.5
    },
    "motivation": {
      label: "Motivation",
      connections: ["self-improvement", "career"],
      baseWeight: 0.4
    },
    "memes": {
      label: "Memes",
      connections: ["programming-humor", "developer-culture"],
      baseWeight: 0.3
    },
    "funny": {
      label: "Funny Content",
      connections: ["programming-humor", "memes"],
      baseWeight: 0.3
    },
    "gadgets": {
      label: "Gadgets",
      connections: ["hardware", "tech-buying"],
      baseWeight: 0.4
    },
    "science": {
      label: "Science",
      connections: ["computer-science", "future-tech", "education"],
      baseWeight: 0.5
    },
    "education": {
      label: "Education",
      connections: ["computer-science", "science", "learning"],
      baseWeight: 0.6
    },
    "extensions": {
      label: "Extensions",
      connections: ["developer-tools", "productivity"],
      baseWeight: 0.5
    },
    "vscode": {
      label: "VS Code",
      connections: ["developer-tools", "coding", "extensions"],
      baseWeight: 0.6
    },
    "java": {
      label: "Java",
      connections: ["software-engineering", "coding", "programming"],
      baseWeight: 0.7
    },
    "programming": {
      label: "Programming",
      connections: ["software-engineering", "coding"],
      baseWeight: 0.7
    },
    "data-science": {
      label: "Data Science",
      connections: ["machine-learning", "artificial-intelligence"],
      baseWeight: 0.7
    },
    "infrastructure": {
      label: "Infrastructure",
      connections: ["cloud", "devops", "system-design"],
      baseWeight: 0.65
    },
    "ethical-hacking": {
      label: "Ethical Hacking",
      connections: ["cybersecurity", "networking"],
      baseWeight: 0.7
    },
    "learning": {
      label: "Learning",
      connections: ["education", "self-improvement"],
      baseWeight: 0.5
    }
  },

  interestClusters: {
    "Software Engineering": {
      description: "Core software development, coding practices, engineering principles",
      weight: 1.0,
      anchorTopics: ["software-engineering", "coding", "java", "programming"],
      difficulty: "intermediate"
    },
    "Developer Career": {
      description: "Career growth, job preparation, interview readiness, professional development",
      weight: 0.9,
      anchorTopics: ["developer-career", "career-prep", "swe-lifestyle", "coding-interview"],
      difficulty: "beginner"
    },
    "AI & Machine Learning": {
      description: "Artificial intelligence, ML models, AI tools, data science",
      weight: 0.85,
      anchorTopics: ["artificial-intelligence", "machine-learning", "ai-tools", "data-science"],
      difficulty: "intermediate"
    },
    "Developer Productivity": {
      description: "Tools, extensions, workflows, and setups that boost developer efficiency",
      weight: 0.7,
      anchorTopics: ["developer-tools", "dev-setup", "productivity", "vscode"],
      difficulty: "beginner"
    },
    "System Design & Architecture": {
      description: "High-level design, system architecture, infrastructure, scalability",
      weight: 0.95,
      anchorTopics: ["system-design", "high-level-design", "infrastructure"],
      difficulty: "advanced"
    },
    "Cybersecurity": {
      description: "Security, ethical hacking, networking, threat analysis",
      weight: 0.8,
      anchorTopics: ["cybersecurity", "ethical-hacking", "networking"],
      difficulty: "intermediate"
    },
    "Cloud & DevOps": {
      description: "Cloud platforms, CI/CD, containerization, deployment",
      weight: 0.8,
      anchorTopics: ["cloud", "devops", "infrastructure"],
      difficulty: "intermediate"
    },
    "Hardware & Gadgets": {
      description: "Physical tech, laptops, peripherals, hardware comparisons",
      weight: 0.5,
      anchorTopics: ["hardware", "gadgets", "laptop-comparison", "tech-buying"],
      difficulty: "beginner"
    },
    "DSA & Problem Solving": {
      description: "Data structures, algorithms, competitive programming, problem-solving",
      weight: 0.9,
      anchorTopics: ["dsa", "computer-science", "coding-interview"],
      difficulty: "intermediate"
    },
    "Future Tech": {
      description: "Quantum computing, emerging technologies, tech trends",
      weight: 0.6,
      anchorTopics: ["future-tech", "quantum-computing", "science"],
      difficulty: "advanced"
    }
  },

  engagementWeights: {
    liked: 1.0,
    shared: 0.75,
    commented: 0.6,
    watched: 0.3
  }
};
