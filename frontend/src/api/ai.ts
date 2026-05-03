import axios from 'axios'

const API_KEY = (import.meta as any).env.VITE_AZURE_OPENAI_KEY
const ENDPOINT = (import.meta as any).env.VITE_AZURE_OPENAI_ENDPOINT

/**
 * Direct service for calling Azure OpenAI from the frontend.
 * Note: Use with caution as keys are exposed in the client.
 */
export const azureAiService = {
  /**
   * Generates a response from the configured Azure OpenAI deployment
   */
  generateResponse: async (prompt: string, systemMessage: string = "You are a helpful medical assistant.") => {
    if (!API_KEY || !ENDPOINT) {
      console.warn("Azure OpenAI keys are missing in frontend .env")
      return null
    }

    try {
      const response = await axios.post(
        ENDPOINT,
        {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.choices[0].message.content
    } catch (error) {
      console.error("Azure OpenAI API Error:", error)
      throw error
    }
  }
}
