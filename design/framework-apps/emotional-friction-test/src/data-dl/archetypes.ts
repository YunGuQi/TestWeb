import config from '@/config/tests/destined-lover.json';

export interface Archetype {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  analysis: string;
  quote: string;
  radar: {
    pragmatic: number; // P
    possessive: number; // D
    romantic: number; // R
    action: number; // C
  };
}

export const archetypes: Record<string, Archetype> = Object.fromEntries(
  config.results.map((r: any) => [r.id, r as Archetype])
);
