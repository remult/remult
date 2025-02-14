import { tick, type Component } from 'svelte'
import { writable } from 'svelte/store'

export type DialogConfig = {
  title?: string
  description?: string
  buttonSuccess?: string
  isWarning?: boolean
  /** default "550px" */
  width?: string
}
export type DialogMetaData = {
  config: DialogConfig
  component?: Component
  props?: any
  children?: any
  focusKey?: string
}

type ResultClose<resultType = any> = {
  success: boolean
  data?: resultType
  // createRequest?: entityType
}

export type DialogType = 'custom' | 'confirm' | 'confirmDelete'
export type DialogMetaDataInternal<resultType = any> = DialogMetaData & {
  // id: number
  type: DialogType
  resolve: (result: ResultClose<resultType>) => void
}
const createDialogManagement = () => {
  const { subscribe, update } = writable<DialogMetaDataInternal[]>([])

  // internal...
  const show = <resultType>(dialog: DialogMetaData, type: DialogType) => {
    let resolve: any
    const promise = new Promise<ResultClose<resultType>>((res) => {
      resolve = res
    })

    update((dialogs) => {
      return [...dialogs, { ...dialog, resolve, type }]
    })

    return promise
  }

  return {
    confirm: <resultType = any>(topic: string) => {
      return show<resultType>(
        {
          config: {
            title: 'Confirm',
            // description: 'Confirm',
            buttonSuccess: 'Confirm',
          },
          children: `
          	<p>${topic}</p>
          `,
        },
        'confirm',
      )
    },
    confirmDelete: <resultType = any>(topic?: string) => {
      return show<resultType>(
        {
          config: {
            title: 'Confirm delete',
            description: "This action can't be undone.",
            buttonSuccess: 'Confirm delete',
            isWarning: true,
          },
          children: topic ? `Remove : <p>- <b>${topic}</b></p>` : '',
        },
        'confirmDelete',
      )
    },
    show: <resultType = any>(dialog: DialogMetaData) => {
      return show<resultType>(dialog, 'custom')
    },

    close: (result: ResultClose) => {
      update((dialogs) => {
        dialogs[dialogs.length - 1].resolve(result)
        dialogs.pop()
        return dialogs
      })
    },

    // usefull on navigation you want to close all popups
    closeAll: () => {
      update((dialogs) => {
        dialogs.forEach((dialog) => {
          dialog.resolve({ success: false })
        })
        return []
      })
    },

    subscribe,
  }
}

export const dialog = createDialogManagement()
