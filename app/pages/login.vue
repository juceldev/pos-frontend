<template>
  <div class="login-wrapper d-flex align-center justify-center pa-4">
    <v-card class="login-card pa-6 pa-md-8" flat width="100%" max-width="420" rounded="xl" elevation="8">
      <div class="text-center">
        <div class="login-logo-wrap ">
          <img src="/logo.jpg" alt="Madoxx.qwe PC" class="login-logo" />
        </div>
      </div>

      <v-fade-transition mode="out-in">
        <div v-if="!auth.ready" key="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="40" width="4" />
          <p class="text-body-2 mt-4 text-medium-emphasis">
            Loading session…
          </p>
        </div>

        <v-form v-else key="form" ref="formRef" v-model="valid" @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            label="Username"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            :rules="[rules.required]"
            autocomplete="username"
            class="modern-field mb-3"
          />

          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            :rules="[rules.required]"
            autocomplete="current-password"
            class="modern-field mb-4"
            @click:append-inner="showPassword = !showPassword"
          />

          <div class="d-flex align-center justify-space-between mb-6">
            <v-switch
              v-model="remember"
              label="Remember me"
              color="primary"
              density="compact"
              hide-details
              class="modern-remember"
            />
          </div>

          <v-expand-transition>
            <v-alert
              v-if="auth.error"
              type="error"
              density="compact"
              rounded="lg"
              class="mb-4"
            >
              {{ auth.error }}
            </v-alert>
          </v-expand-transition>

          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            rounded="lg"
            height="48"
            :loading="auth.loading"
            :disabled="!valid"
            class="text-uppercase font-weight-bold"
          >
            Sign In
          </v-btn>
        </v-form>
      </v-fade-transition>

      <div class="text-center text-caption text-medium-emphasis mt-6">
        © {{ new Date().getFullYear() }} Madoxx.qwe PC
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import '~/assets/styles/login.css'

import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth'
})

const auth = useAuthStore()
const router = useRouter()

const formRef = ref()
const valid = ref(false)
const showPassword = ref(false)
const username = ref('')
const password = ref('')
const remember = ref(false)

const rules = {
  required: (value: string) => !!value || 'Required'
}

async function handleLogin () {
  const isValid = await formRef.value?.validate()
  if (!isValid) return

  const success = await auth.login(username.value, password.value)
  if (success) {
    if (import.meta.client) {
      if (remember.value) {
        localStorage.setItem('pos_remember_user', username.value)
      } else {
        localStorage.removeItem('pos_remember_user')
      }
    }
    await router.push('/')
  }
}

onMounted(() => {
  if (import.meta.client) {
    const remembered = localStorage.getItem('pos_remember_user')
    if (remembered) {
      username.value = remembered
      remember.value = true
    }
  }
})

watchEffect(() => {
  if (auth.ready && auth.isLoggedIn) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: white;
  /* border-radius: 20px; */
  /* box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); */
}

.login-logo {
  max-width: 240px;
  height: auto;
  max-height: 120px;
  object-fit: contain;
}

:deep(.modern-remember .v-label) {
  font-size: 0.875rem;
  opacity: 0.85;
}
</style>
