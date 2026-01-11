interface ConsentSettings {
  analytics: boolean
  errorLogging: boolean
  performanceMonitoring: boolean
}

class ConsentManager {
  private static instance: ConsentManager
  private consentKey = "user_logging_consent"
  private defaultSettings: ConsentSettings = {
    analytics: false,
    errorLogging: true, // Error logging defaults to on for app functionality
    performanceMonitoring: false,
  }

  private currentSettings: ConsentSettings

  private constructor() {
    this.currentSettings = this.loadSettings()
  }

  public static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager()
    }
    return ConsentManager.instance
  }

  private loadSettings(): ConsentSettings {
    if (typeof window === "undefined") {
      return this.defaultSettings
    }

    try {
      const savedSettings = localStorage.getItem(this.consentKey)
      if (savedSettings) {
        return JSON.parse(savedSettings)
      }
    } catch (e) {
      console.error("Error loading consent settings", e)
    }

    return this.defaultSettings
  }

  public saveSettings(settings: Partial<ConsentSettings>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...settings,
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.consentKey, JSON.stringify(this.currentSettings))
      } catch (e) {
        console.error("Error saving consent settings", e)
      }
    }
  }

  public getSettings(): ConsentSettings {
    return { ...this.currentSettings }
  }

  public hasConsented(category: keyof ConsentSettings): boolean {
    return this.currentSettings[category]
  }

  public resetToDefaults(): void {
    this.saveSettings(this.defaultSettings)
  }
}

export const consentManager = ConsentManager.getInstance()
