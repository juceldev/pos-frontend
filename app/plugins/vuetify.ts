import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const lightColors = {
  primary: '#3F51B5',
  secondary: '#607D8B',
  accent: '#82B1FF',
  error: '#EF5350',
  info: '#29B6F6',
  success: '#66BB6A',
  warning: '#FFA726',
  background: '#F5F7FA',
  surface: '#FFFFFF'
}

const darkColors = {
  primary: '#5C6BC0',
  secondary: '#90A4AE',
  accent: '#82B1FF',
  error: '#EF5350',
  info: '#29B6F6',
  success: '#66BB6A',
  warning: '#FFA726',
  background: '#121212',
  surface: '#1E1E1E'
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: lightColors
        },
        dark: {
          dark: true,
          colors: darkColors
        }
      }
    },
    defaults: {
      VTextField: {
        variant: 'outlined',
        density: 'compact',
        hideDetails: 'auto'
      },
      VSelect: {
        variant: 'outlined',
        density: 'compact',
        hideDetails: 'auto'
      },
      VTextarea: {
        variant: 'outlined',
        density: 'compact',
        hideDetails: 'auto'
      },
      VAutocomplete: {
        variant: 'outlined',
        density: 'compact',
        hideDetails: 'auto'
      },
      VCombobox: {
        variant: 'outlined',
        density: 'compact',
        hideDetails: 'auto'
      },
      VDataTable: {
        density: 'compact',
        hover: true
      },
      VDataTableServer: {
        density: 'compact',
        hover: true
      },
      VChip: {
        size: 'small',
        label: true
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
