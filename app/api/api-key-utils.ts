"use server"

// Simple utility to get the API key from environment variables
export function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}
