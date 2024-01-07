export const actionInfo = {
  allActions: [] as any[],
  runningOnServer: false,
  runActionWithoutBlockingUI: <T>(what: () => Promise<T>): Promise<T> => {
    return what()
  },
  startBusyWithProgress: () => ({
    progress: (percent: number) => {},
    close: () => {},
  }),
}

export const serverActionField = Symbol.for('serverActionField')
