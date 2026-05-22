export type RepositoryHydrationGate = {
  beginLoad: () => number;
  markLoaded: (generation: number) => boolean;
  canSave: () => boolean;
};

export function createRepositoryHydrationGate(): RepositoryHydrationGate {
  let currentGeneration = 0;
  let loadedGeneration = 0;

  return {
    beginLoad: () => {
      currentGeneration += 1;
      return currentGeneration;
    },
    markLoaded: (generation) => {
      if (generation !== currentGeneration) return false;
      loadedGeneration = generation;
      return true;
    },
    canSave: () => currentGeneration > 0 && loadedGeneration === currentGeneration,
  };
}
