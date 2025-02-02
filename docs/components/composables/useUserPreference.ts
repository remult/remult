import { computed, ref, watch } from 'vue'

export type Framework = 'svelte' | 'vue' | 'react' | 'angular'

export interface UserPreferences {
  framework: Framework
  keyContext?: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  framework: 'react',
}

const STORAGE_KEY = 'user-preferences'

export function useUserPreference() {
  const preferences = ref<UserPreferences>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') ??
      DEFAULT_PREFERENCES,
  )

  watch(
    preferences,
    (newPreferences) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    },
    { deep: true },
  )

  const framework = computed({
    get: () => preferences.value.framework,
    set: (newFramework: Framework) => {
      preferences.value.framework = newFramework
    },
  })

  return {
    preferences,
    framework,
  }
}
