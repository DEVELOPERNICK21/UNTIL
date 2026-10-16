/**
 * A tiny signal line from the app to Ember. A finished task or a new badge calls
 * `emitEmberReaction`; any Ember marked `reactive` hops and sparkles. Nothing is stored,
 * so a reaction nobody is watching is simply dropped.
 */

export type EmberReaction = 'cheer' | 'wow';

type Listener = (reaction: EmberReaction) => void;

const listeners = new Set<Listener>();

export function emitEmberReaction(reaction: EmberReaction): void {
  listeners.forEach(listener => listener(reaction));
}

export function subscribeEmberReactions(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
