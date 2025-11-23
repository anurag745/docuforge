import { Project, Section } from '@/stores/projectStore';

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Market Analysis: EV Industry 2025',
    docType: 'docx',
    topic: 'A comprehensive market analysis of the electric vehicle industry in 2025',
    sections: [
      {
        id: 's1',
        title: 'Executive Summary',
        content: 'The electric vehicle (EV) market is experiencing unprecedented growth in 2025, driven by technological advancements, government incentives, and shifting consumer preferences. This analysis explores key trends, market dynamics, and future projections.',
        order: 0,
        revisions: [],
        comments: [],
      },
      {
        id: 's2',
        title: 'Market Overview',
        content: 'Global EV sales reached 15 million units in 2024, representing a 35% year-over-year increase. Major markets including China, Europe, and North America continue to lead adoption rates, with emerging markets showing promising growth trajectories.',
        order: 1,
        revisions: [],
        comments: [],
      },
      {
        id: 's3',
        title: 'Key Players & Competition',
        content: 'Tesla maintains market leadership with 22% global share, while traditional automakers like Volkswagen, General Motors, and BYD rapidly scale their EV portfolios. New entrants from tech companies are disrupting traditional manufacturing models.',
        order: 2,
        revisions: [],
        comments: [],
      },
    ],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-20'),
  },
  {
    id: '2',
    title: 'Product Launch Presentation',
    docType: 'pptx',
    topic: 'Launching our new AI-powered project management platform',
    sections: [
      {
        id: 'sl1',
        title: 'Introduction',
        content: 'Welcome to the future of project management. Our AI-powered platform revolutionizes how teams collaborate, plan, and execute projects with unprecedented efficiency.',
        order: 0,
        revisions: [],
        comments: [],
      },
      {
        id: 'sl2',
        title: 'Problem Statement',
        content: 'Traditional project management tools struggle with complexity, lack predictive insights, and fail to adapt to dynamic team workflows. Teams waste 40% of their time on administrative tasks.',
        order: 1,
        revisions: [],
        comments: [],
      },
      {
        id: 'sl3',
        title: 'Our Solution',
        content: 'AI-driven task prioritization, intelligent resource allocation, predictive risk assessment, and automated workflow optimization. Reduce admin time by 70% and increase project success rates by 45%.',
        order: 2,
        revisions: [],
        comments: [],
      },
    ],
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-19'),
  },
];

export const refinementPresets = [
  { label: 'Make Formal', prompt: 'Rewrite this in a more formal, professional tone' },
  { label: 'Simplify', prompt: 'Simplify this content to make it easier to understand' },
  { label: 'Shorten', prompt: 'Shorten this to approximately 100 words while keeping key points' },
  { label: 'Expand', prompt: 'Expand this content with more details and examples' },
  { label: 'Add Bullets', prompt: 'Convert this content into clear bullet points' },
  { label: 'Add Examples', prompt: 'Add 2-3 concrete examples to illustrate these points' },
];
