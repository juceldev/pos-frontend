interface NotificationState {
  show: boolean
  message: string
  color: string
  timeout: number
}

const state = reactive<NotificationState>({
  show: false,
  message: '',
  color: 'success',
  timeout: 4000
})

export function useNotification () {
  function notify (message: string, color: 'success' | 'error' | 'info' | 'warning' = 'success', timeout = 4000) {
    state.message = message
    state.color = color
    state.timeout = timeout
    state.show = true
  }

  return {
    notification: state,
    notify,
    success: (message: string, timeout?: number) => notify(message, 'success', timeout),
    error: (message: string, timeout?: number) => notify(message, 'error', timeout),
    info: (message: string, timeout?: number) => notify(message, 'info', timeout),
    warning: (message: string, timeout?: number) => notify(message, 'warning', timeout)
  }
}
