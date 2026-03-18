// Interview Question Trees
// Structured interview sequences per book type that walk users
// through world-building layer by layer via voice

import type { KnowledgeFileType } from '../../types/knowledge'
import type { BookType } from '../../types/database'

export interface QuestionNode {
  id: string
  question: string
  followUps: string[]
  targetKBLayer: KnowledgeFileType
  targetTitle: string
  extractionHints: string[]
  priority: number
  required: boolean
}

// Fiction: world-first, then characters, then story structure
const FICTION_TREE: QuestionNode[] = [
  {
    id: 'f-world-overview',
    question: "Let's start with your world. Describe it to me like I just arrived — what do I see, hear, feel?",
    followUps: [
      'What makes this world different from ours?',
      'What time period does this feel like?',
      'Is there anything that would surprise a newcomer?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'World Bible',
    extractionHints: ['setting', 'atmosphere', 'time period', 'core premise', 'tone'],
    priority: 1,
    required: true,
  },
  {
    id: 'f-rules',
    question: 'What are the rules of this world? What can happen here that can\'t happen in reality — or what\'s forbidden?',
    followUps: [
      'Is there magic, advanced technology, or supernatural elements?',
      'What are the consequences of breaking these rules?',
      'Who enforces the rules?',
    ],
    targetKBLayer: 'lore',
    targetTitle: 'Lore & Rules',
    extractionHints: ['magic system', 'technology', 'constraints', 'laws', 'consequences'],
    priority: 2,
    required: true,
  },
  {
    id: 'f-main-character',
    question: 'Tell me about your main character. Who are they? What do they look like, and what drives them?',
    followUps: [
      'What do they want more than anything?',
      'What do they need that they don\'t know yet?',
      'What\'s their biggest fear?',
      'How do they talk — formal, casual, sarcastic?',
    ],
    targetKBLayer: 'characters',
    targetTitle: 'Character Profiles',
    extractionHints: ['name', 'physical', 'personality', 'motivation', 'voice', 'fear', 'desire'],
    priority: 1,
    required: true,
  },
  {
    id: 'f-supporting-cast',
    question: 'Who else matters in this story? Tell me about the people around your main character.',
    followUps: [
      'Is there an antagonist? What do they want?',
      'Who does the main character trust most?',
      'Is there a mentor or guide figure?',
    ],
    targetKBLayer: 'characters',
    targetTitle: 'Character Profiles',
    extractionHints: ['name', 'role', 'relationship to protagonist', 'motivation'],
    priority: 2,
    required: false,
  },
  {
    id: 'f-locations',
    question: 'Where does the main action happen? Walk me through the key places in your story.',
    followUps: [
      'What does it smell like there? What sounds do you hear?',
      'Is this place safe or dangerous?',
      'Why is this location important to the story?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'Settings & Locations',
    extractionHints: ['location name', 'sensory details', 'significance', 'atmosphere'],
    priority: 2,
    required: true,
  },
  {
    id: 'f-relationships',
    question: 'How do your characters connect to each other? Who loves who, who hates who, who owes who?',
    followUps: [
      'Are there any secrets between characters?',
      'Who has the most power?',
      'Which relationship will change the most during the story?',
    ],
    targetKBLayer: 'relationships-map',
    targetTitle: 'Relationships Map',
    extractionHints: ['character pair', 'relationship type', 'dynamic', 'secrets', 'tension'],
    priority: 3,
    required: false,
  },
  {
    id: 'f-timeline',
    question: 'What happened before the story starts? Give me the backstory — the events that set everything in motion.',
    followUps: [
      'How far back does the history go?',
      'Is there a specific event that changed everything?',
      'What does the main character know about the past?',
    ],
    targetKBLayer: 'timeline',
    targetTitle: 'Timeline',
    extractionHints: ['date', 'event', 'consequence', 'characters involved'],
    priority: 3,
    required: false,
  },
  {
    id: 'f-themes',
    question: 'What is this story really about, underneath the plot? What truth are you exploring?',
    followUps: [
      'If someone finished this book, what would they think about differently?',
      'Is there a question this story asks but doesn\'t answer?',
    ],
    targetKBLayer: 'thematic-through-lines',
    targetTitle: 'Thematic Through-Lines',
    extractionHints: ['theme', 'moral question', 'subtext'],
    priority: 4,
    required: false,
  },
  {
    id: 'f-conflict',
    question: 'What\'s the central conflict? What\'s at stake if the main character fails?',
    followUps: [
      'Is this an internal conflict, external, or both?',
      'Who or what is standing in the way?',
      'What would failure look like?',
    ],
    targetKBLayer: 'story-planning',
    targetTitle: 'Story Arc',
    extractionHints: ['conflict type', 'stakes', 'antagonist force', 'resolution direction'],
    priority: 2,
    required: true,
  },
]

// Memoir: eras and people first, then emotions and themes
const MEMOIR_TREE: QuestionNode[] = [
  {
    id: 'm-overview',
    question: 'What period of your life is this memoir about? Set the scene for me — where were you, how old, what was happening?',
    followUps: [
      'Why this time period? What makes it worth telling?',
      'How does this chapter of your life begin?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'World Bible',
    extractionHints: ['time period', 'age', 'location', 'context', 'significance'],
    priority: 1,
    required: true,
  },
  {
    id: 'm-people',
    question: 'Who are the important people in this story? Tell me about them — how they looked, how they made you feel.',
    followUps: [
      'Who had the biggest impact on you during this time?',
      'Is there someone you need to be honest about?',
      'Who would be surprised to find themselves in this book?',
    ],
    targetKBLayer: 'characters',
    targetTitle: 'Character Profiles',
    extractionHints: ['name', 'relationship', 'physical description', 'personality', 'impact'],
    priority: 1,
    required: true,
  },
  {
    id: 'm-places',
    question: 'What places defined this period? The house, the neighborhood, the city — take me there.',
    followUps: [
      'What did it smell like? Sound like?',
      'Are any of these places gone now?',
      'Which place do you miss most?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'Settings & Locations',
    extractionHints: ['place name', 'sensory details', 'emotional association', 'significance'],
    priority: 2,
    required: true,
  },
  {
    id: 'm-turning-points',
    question: 'What were the moments that changed everything? The days you remember exactly where you were.',
    followUps: [
      'What did you feel in that moment?',
      'Did you know it was important at the time?',
      'How did it change what came after?',
    ],
    targetKBLayer: 'timeline',
    targetTitle: 'Timeline',
    extractionHints: ['date', 'event', 'emotional state', 'before/after contrast'],
    priority: 1,
    required: true,
  },
  {
    id: 'm-emotions',
    question: 'What emotions dominated this period? Were you angry, hopeful, grieving, free?',
    followUps: [
      'Was there a moment you felt the most alive?',
      'What were you running from? Running toward?',
    ],
    targetKBLayer: 'thematic-through-lines',
    targetTitle: 'Thematic Through-Lines',
    extractionHints: ['dominant emotion', 'internal conflict', 'growth', 'realization'],
    priority: 3,
    required: false,
  },
  {
    id: 'm-relationships',
    question: 'How did the important relationships change during this time? Who did you grow closer to, and who did you lose?',
    followUps: [
      'Was there a betrayal?',
      'Who showed up when you needed them?',
      'Is there a relationship you understand differently now?',
    ],
    targetKBLayer: 'relationships-map',
    targetTitle: 'Relationships Map',
    extractionHints: ['relationship arc', 'conflict', 'reconciliation', 'loss'],
    priority: 3,
    required: false,
  },
  {
    id: 'm-artifacts',
    question: 'Are there objects, songs, smells, or traditions that anchor this time? Things that take you back instantly.',
    followUps: [
      'Do you still have any of these?',
      'What would someone from that era recognize immediately?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'World Bible',
    extractionHints: ['sensory anchor', 'object', 'tradition', 'cultural detail'],
    priority: 4,
    required: false,
  },
  {
    id: 'm-lesson',
    question: 'Looking back now, what do you understand about that time that you didn\'t understand then?',
    followUps: [
      'What would you tell your younger self?',
      'Why does this story need to be told now?',
    ],
    targetKBLayer: 'thematic-through-lines',
    targetTitle: 'Thematic Through-Lines',
    extractionHints: ['hindsight', 'wisdom', 'purpose', 'message'],
    priority: 4,
    required: false,
  },
]

// Nonfiction: thesis first, then evidence structure
const NONFICTION_TREE: QuestionNode[] = [
  {
    id: 'n-thesis',
    question: 'What\'s the core argument or idea of this book? If someone only remembered one thing, what should it be?',
    followUps: [
      'Why do you believe this?',
      'What would someone who disagrees say?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'World Bible',
    extractionHints: ['thesis', 'core argument', 'counter-argument', 'evidence base'],
    priority: 1,
    required: true,
  },
  {
    id: 'n-audience',
    question: 'Who is this book for? Who needs to read it, and what will change for them after?',
    followUps: [
      'What do they already know?',
      'What misconceptions do they have?',
    ],
    targetKBLayer: 'world-building',
    targetTitle: 'World Bible',
    extractionHints: ['audience', 'knowledge level', 'pain points', 'transformation'],
    priority: 1,
    required: true,
  },
  {
    id: 'n-key-concepts',
    question: 'What are the 3-5 big ideas that support your thesis? The pillars the argument stands on.',
    followUps: [
      'Which one is the most surprising?',
      'Which one needs the most evidence to be convincing?',
      'In what order should someone encounter these ideas?',
    ],
    targetKBLayer: 'story-planning',
    targetTitle: 'Story Arc',
    extractionHints: ['key concept', 'supporting argument', 'order', 'evidence needed'],
    priority: 1,
    required: true,
  },
  {
    id: 'n-evidence',
    question: 'What\'s your strongest evidence? Studies, stories, data, personal experience — what makes this undeniable?',
    followUps: [
      'Are there case studies or examples that bring this to life?',
      'What data exists to support this?',
    ],
    targetKBLayer: 'research',
    targetTitle: 'Research & References',
    extractionHints: ['study', 'data point', 'case study', 'anecdote', 'source'],
    priority: 2,
    required: true,
  },
  {
    id: 'n-counter-arguments',
    question: 'What\'s the strongest argument against your thesis? Where are the holes?',
    followUps: [
      'How do you address this objection?',
      'Is there a nuance you want to acknowledge?',
    ],
    targetKBLayer: 'story-planning',
    targetTitle: 'Story Arc',
    extractionHints: ['counter-argument', 'objection', 'nuance', 'rebuttal'],
    priority: 3,
    required: false,
  },
  {
    id: 'n-frameworks',
    question: 'Do you have any frameworks, models, or mental maps that help explain your ideas?',
    followUps: [
      'Could you draw this on a napkin?',
      'What are the steps or stages?',
    ],
    targetKBLayer: 'lore',
    targetTitle: 'Lore & Rules',
    extractionHints: ['framework', 'model', 'steps', 'process', 'diagram concept'],
    priority: 3,
    required: false,
  },
  {
    id: 'n-structure',
    question: 'How should this book flow? What\'s the journey from opening chapter to conclusion?',
    followUps: [
      'What\'s the hook — why would someone read past page one?',
      'Where\'s the climax of the argument?',
    ],
    targetKBLayer: 'chapter-outlines',
    targetTitle: 'Chapter Outlines',
    extractionHints: ['chapter order', 'arc', 'hook', 'climax', 'conclusion'],
    priority: 2,
    required: false,
  },
]

/**
 * Get the interview question tree for a book type
 */
export function getQuestionTree(bookType: BookType): QuestionNode[] {
  switch (bookType) {
    case 'fiction': return FICTION_TREE
    case 'memoir': return MEMOIR_TREE
    case 'nonfiction': return NONFICTION_TREE
    default: return FICTION_TREE
  }
}

/**
 * Get required questions only
 */
export function getRequiredQuestions(bookType: BookType): QuestionNode[] {
  return getQuestionTree(bookType).filter((q) => q.required)
}

/**
 * Get the next unanswered question based on KB state
 */
export function getNextQuestion(
  bookType: BookType,
  answeredIds: Set<string>
): QuestionNode | null {
  const tree = getQuestionTree(bookType)
  const unanswered = tree
    .filter((q) => !answeredIds.has(q.id))
    .sort((a, b) => a.priority - b.priority)

  return unanswered[0] ?? null
}
