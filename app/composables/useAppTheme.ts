import { useTheme as useVuetifyTheme } from 'vuetify'

export function useAppTheme () {
  const theme = useVuetifyTheme()

  const isDark = computed({
    get: () => theme.global.name.value === 'dark',
    set: (value: boolean) => {
      theme.global.name.value = value ? 'dark' : 'light'
      if (import.meta.client) {
        localStorage.setItem('theme', value ? 'dark' : 'light')
      }
    }
  })

  function init () {
    if (!import.meta.client) return
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') {
      theme.global.name.value = saved
    }
  }

  function toggle () {
    isDark.value = !isDark.value
  }

  return { theme, isDark, toggle, init }
}
