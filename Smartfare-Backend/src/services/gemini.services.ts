import { GoogleGenerativeAI } from "@google/generative-ai";
import { TrainSearchParams } from "../models/train-search-params"
import { TrainOffer } from "../models/train-offer";
import { AIRecommendation } from '../models/AI-recommendation';

import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const GEMINI_MODELS = (process.env.GEMINI_MODEL || "gemini-2.5-flash,gemini-2.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter((m) => m.startsWith("gemini-"));

export class GeminiService {

  private getModel(modelName: string) {
    return genAI.getGenerativeModel({ model: modelName })
  }
  private async generateWithFallback(prompt: string) {
    let lastError: unknown;

    for (const model of GEMINI_MODELS) {
      try {
        const result = await this.getModel(model).generateContent(prompt);
        return result.response;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
  async searchTrainOffers(params: TrainSearchParams): Promise<TrainOffer[]> {
    const prompt = `Sei un assistente specializzato nella ricerca di biglietti ferroviari in Italia.
                    Ricerca biglietti treno per:

                    - Partenza: ${params.from}
                    - Arrivo: ${params.to}
                    - Data: ${params.date}
                    - Passeggeri: ${params.passengers || 1}

                    Trova le migliori offerte da TUTTE le compagnie ferroviarie italiane:
                    1. Trenitalia (Frecciarossa, Frecciargento, Frecciabianca, Intercity, Regionale)
                    2. Italo (Italo, Italobus)
                    3. Trenord (per Lombardia)
                    4. Altri operatori regionali

                    Per ogni offerta, fornisci i seguenti dettagli in formato JSON:
                    {
                      "company": "nome compagnia",
                      "departureTime": "HH:MM",
                      "arrivalTime": "HH:MM",
                      "duration": "Xh Ymin",
                      "price": numero (in euro),
                      "trainType": "tipo treno (es: Frecciarossa, Italo, Regionale)",
                      "changes": numero cambi,
                      "availability": "disponibile/pochi posti/esaurito",
                      "link": "URL dove acquistare (se disponibile)"
                    }

                    Restituisci un array JSON con TUTTE le offerte trovate, ordinate per orario di partenza.
                    Includi sia opzioni economiche che premium.

                    IMPORTANTE: Rispondi SOLO con un JSON array valido, senza testo aggiuntivo.`;
    try {
      let offers: TrainOffer[] = [];
      const response = await this.generateWithFallback(prompt);
      const text = response.text();
      console.log(text);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn("Nessun JSON trovato nella risposta di Gemini");
      } else {
        offers = JSON.parse(jsonMatch[0]);
      }
      return offers;
    } catch (error) {
      console.error("Errore ricerca con Gemini:", error);
      return [];
    }
  }
  
  async getRecommendations(
    offers: TrainOffer[],
    userPreferences?: {
      maxPrice?: number;
      preferredTime?: string;
      maxChanges?: number;
    }
  ): Promise<AIRecommendation> {
    const prompt = `
Sei un esperto consulente di viaggi in treno. Analizza queste offerte e fornisci una raccomandazione:

OFFERTE DISPONIBILI:
${JSON.stringify(offers, null, 2)}

PREFERENZE UTENTE:
${userPreferences ? JSON.stringify(userPreferences, null, 2) : "Nessuna preferenza specifica"}

Fornisci un'analisi dettagliata in formato JSON:
{
  "bestOffer": <l'offerta migliore tra quelle disponibili>,
  "reasoning": "Spiegazione dettagliata del perché questa è la scelta migliore",
  "alternatives": [<array di 2-3 alternative valide>],
  "priceAnalysis": "Analisi dei prezzi e confronto tra le offerte",
  "suggestion": "Consiglio finale: quando comprare, cosa considerare, ecc."
}

Considera:
- Rapporto qualità/prezzo
- Tempo di viaggio
- Numero di cambi
- Disponibilità
- Preferenze utente

IMPORTANTE: Rispondi SOLO con un JSON valido, senza testo aggiuntivo.
`;

    try {
      const response = await this.generateWithFallback(prompt);
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Risposta non valida da Gemini");
      }

      const recommendation: AIRecommendation = JSON.parse(jsonMatch[0]);
      return recommendation;
    } catch (error) {
      console.error("Errore raccomandazione con Gemini:", error);

      // Fallback: seleziona la migliore offerta manualmente
      const sortedOffers = [...offers].sort((a, b) => {
        const scoreA = this.calculateOfferScore(a);
        const scoreB = this.calculateOfferScore(b);
        return scoreB - scoreA;
      });

      return {
        bestOffer: sortedOffers[0],
        reasoning: "Migliore rapporto qualità/prezzo considerando tempo di viaggio e costi",
        alternatives: sortedOffers.slice(1, 3),
        priceAnalysis: `Prezzi da ${Math.min(...offers.map((o) => o.price))}€ a ${Math.max(...offers.map((o) => o.price))}€`,
        suggestion: "Confronta le alternative in base alle tue preferenze di viaggio"
      };
    }
  }

  private calculateOfferScore(offer: TrainOffer): number {
    let score = 100;

    // Penalizza prezzo alto
    score -= offer.price * 0.5;

    // Penalizza cambi
    score -= offer.changes * 10;

    // Penalizza durata (estrai ore)
    const durationMatch = offer.duration.match(/(\d+)h/);
    if (durationMatch) {
      score -= parseInt(durationMatch[1]) * 5;
    }

    // Bonus per disponibilità
    if (offer.availability === "disponibile") {
      score += 20;
    }

    return score;
  }
}


export const geminiService = new GeminiService();