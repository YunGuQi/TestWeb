import { IScoringEngine } from './engine.interface';
import { LoveSpeciesEngine } from './love-species.engine';
import { FamilyOriginEngine } from './family-origin.engine';
import { DestinyLoverEngine } from './destiny-lover.engine';
import { EmoEngine } from './emo.engine';

export class EngineFactory {
  static getEngine(testId: string): IScoringEngine {
    switch (testId) {
      case 'love-species':
        return new LoveSpeciesEngine();
      case 'family-origin':
        return new FamilyOriginEngine();
      case 'destiny-lover':
        return new DestinyLoverEngine();
      case 'emotional-friction':
      default:
        return new EmoEngine();
    }
  }
}
