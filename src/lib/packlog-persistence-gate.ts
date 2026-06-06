export function createRepositoryLoadGate<TRepository>() {
  let activeLoad = 0;
  let readyRepository: TRepository | null = null;

  return {
    beginLoad() {
      activeLoad += 1;
      readyRepository = null;
      return activeLoad;
    },
    isCurrentLoad(token: number) {
      return token === activeLoad;
    },
    finishLoad(token: number, repository: TRepository) {
      if (token !== activeLoad) return false;
      readyRepository = repository;
      return true;
    },
    canSave(repository: TRepository) {
      return readyRepository === repository;
    },
  };
}
