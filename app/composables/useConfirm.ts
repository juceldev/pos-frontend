interface ConfirmState {
  show: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  show: false,
  title: 'Confirm',
  message: '',
  confirmText: 'Yes',
  cancelText: 'No',
  resolve: null
})

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

export function useConfirm () {
  function confirm (options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      state.title = options.title ?? 'Confirm'
      state.message = options.message
      state.confirmText = options.confirmText ?? 'Yes'
      state.cancelText = options.cancelText ?? 'No'
      state.resolve = resolve
      state.show = true
    })
  }

  function close (value: boolean) {
    state.show = false
    state.resolve?.(value)
    state.resolve = null
  }

  return {
    confirm,
    close,
    state
  }
}
