import { GoogleGenAI } from "@google/genai";
import { Appointment, Service, User } from '../types';
import { MOCK_SERVICES } from '../constants';

const API_KEY = process.env.API_KEY || ''; 

// Helper to determine if we can use AI
const hasKey = !!API_KEY;

export const getSmartRecommendation = async (
  user: User, 
  lastAppointment: Appointment | null
): Promise<string> => {
  if (!hasKey) {
    // Fallback logic if no API Key
    if (lastAppointment) {
      return `Welcome back, ${user.name}! Based on your last visit for ${lastAppointment.services.map(s => s.name).join(', ')}, we recommend a trim today to keep you looking sharp.`;
    }
    return `Welcome, ${user.name}! Try our popular 'Groom Package' for a complete makeover.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Construct context
    const historyText = user.visitHistory.length > 0 
      ? user.visitHistory.map(h => `${h.date}: ${h.services.map(s => s.name).join(', ')}`).join('; ')
      : "No previous history.";
    
    const availableServices = MOCK_SERVICES.map(s => s.name).join(', ');

    const prompt = `
      You are an expert salon receptionist AI for Padla Hair Salon.
      Customer Name: ${user.name}
      Visit History: ${historyText}
      Available Services: ${availableServices}
      
      Suggest the next best service for this customer in 1-2 sentences. 
      If they are new, suggest a popular combo.
      Tone: Professional, warm, and inviting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Welcome back! Ready for a fresh look?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Welcome back, ${user.name}! We're ready to make you look your best.`;
  }
};

export const getSmartTimeSlotSuggestion = async (
    date: string,
    existingAppointments: Appointment[]
): Promise<string | null> => {
     // This would use Gemini to analyze peak times and suggest a slot
     // Simplified for this demo
     return null;
}
