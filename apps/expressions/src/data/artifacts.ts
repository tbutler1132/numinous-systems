import type { Artifact } from '../types'

export const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/tbutler1132/vital-systems/main/nodes/org/artifacts'

export const artifacts: Artifact[] = [
  {
    id: 'expressions-reflection',
    title: 'I Built This With AI. Then I Started Thinking.',
    desc: 'A reflection on speed, persistence, and what makes anything worth doing',
    featured: true,
    defaultTab: 'organic',
    category: 'commentary',
  },
  {
    id: '1-beauty-redeems',
    title: 'Beauty Redeems',
    desc: 'Moments of beauty redeem existence',
    category: 'core',
  },
  {
    id: '2-the-living-system',
    title: 'The Living System',
    desc: 'Living systems, hybrid beings, viability over optimization',
    category: 'core',
  },
  {
    id: '3-love-of-fate',
    title: 'Love of Fate',
    desc: 'Clearing regret for presence',
    category: 'core',
  },
  {
    id: '4-capital-as-medium',
    title: 'Capital as Medium',
    desc: 'Orchestrating capital toward beauty',
    category: 'core',
  },
  {
    id: '5-axioms',
    title: 'Axioms',
    desc: 'The distilled principles—what is affirmed without argument',
    category: 'core',
  },
]
