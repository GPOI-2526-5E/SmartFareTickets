import { GoogleGenerativeAI } from "@google/generative-ai";
import { TrainSearchParams } from "../models/train-search-params"
import { TrainOffer } from "../models/train-offer";
import { AIRecommendation } from '../models/AI-recommendation';
import { getCollection, getDatabase } from "../config/database";

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
    try {
      console.log("🔌 Avvio query DB Trains", {
        from: params.from,
        to: params.to,
        date: params.date,
        passengers: params.passengers || 1,
      });
      const trainsCollection = getCollection("Trains");
      const { datePrefix, startDate, endDate } = this.normalizeDateInput(params.date);

      console.log("🗓️ Filtro data normalizzato", {
        datePrefix,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });

      const originRegex = new RegExp(`^${this.escapeRegex(params.from)}$`, "i");
      const destinationRegex = new RegExp(`^${this.escapeRegex(params.to)}$`, "i");

      const filter: any = {
        origin: originRegex,
        destination: destinationRegex,
      };

      if (startDate && endDate && datePrefix) {
        filter.$or = [
          { departureTime: { $gte: startDate, $lt: endDate } },
          { departureTime: { $regex: datePrefix } },
        ];
      } else if (datePrefix) {
        filter.departureTime = { $regex: datePrefix };
      }

      console.log("🔍 Filtro query Trains", filter);

      const trains = await trainsCollection.find(filter).toArray();

      console.log("✅ Trains trovati", { count: trains.length });

      if (trains.length === 0) {
        try {
          const database = getDatabase();
          const estimatedCount = await trainsCollection.estimatedDocumentCount();
          const sampleDoc = await trainsCollection.findOne();

          console.log("🧪 Trains diagnostics", {
            dbName: database.databaseName,
            collection: "Trains",
            estimatedCount,
            sampleKeys: sampleDoc ? Object.keys(sampleDoc) : [],
            sampleDepartureTime: sampleDoc?.departureTime ?? sampleDoc?.departureDate,
            sampleOrigin: sampleDoc?.origin ?? sampleDoc?.departure,
            sampleDestination: sampleDoc?.destination ?? sampleDoc?.arrival,
          });
        } catch (diagError) {
          console.error("❌ Errore diagnostica Trains:", diagError);
        }
      }

      const offers: TrainOffer[] = trains.map((train: any) => {
        const departureParts = this.extractDateTimeParts(train.departureTime || train.departureDate);
        const arrivalParts = this.extractDateTimeParts(train.arrivalTime || train.arrivalDate);
        const priceInfo = this.extractPriceTrend(train);

        return {
          company: train.company || "",
          departureDate: departureParts.date || datePrefix || "",
          departureTime: departureParts.time || "",
          arrivalTime: arrivalParts.time || "",
          duration: this.formatDuration(train.durationMin, train.duration),
          price: Number(train.priceEUR ?? train.price ?? 0),
          trainType: train.trainType || "",
          changes: Number(train.changes ?? 0),
          availability: this.mapAvailability(train.seatsAvailable),
          link: train.link,
          departure: train.origin || train.departure || "",
          arrival: train.destination || train.arrival || "",
          ...priceInfo,
        };
      });

      return offers;
    } catch (error) {
      console.error("Errore ricerca DB Trains:", error);
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
Se sono presenti campi come "previousPrice" o "priceTrend", indica se il prezzo e' in aumento, in discesa o stabile.

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

  private normalizeDateInput(dateInput: string): {
    datePrefix?: string;
    startDate?: Date;
    endDate?: Date;
  } {
    if (!dateInput) {
      return {};
    }

    const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const itaMatch = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    let datePrefix: string | undefined;

    if (isoMatch) {
      datePrefix = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    } else if (itaMatch) {
      datePrefix = `${itaMatch[3]}-${itaMatch[2]}-${itaMatch[1]}`;
    } else {
      const parsed = new Date(dateInput);
      if (!Number.isNaN(parsed.getTime())) {
        datePrefix = parsed.toISOString().slice(0, 10);
      }
    }

    if (!datePrefix) {
      return {};
    }

    const startDate = new Date(`${datePrefix}T00:00:00.000Z`);
    const endDate = new Date(`${datePrefix}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    return { datePrefix, startDate, endDate };
  }

  private extractDateTimeParts(value: unknown): { date?: string; time?: string } {
    if (typeof value === "string") {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (match) {
        return { date: match[1], time: match[2] };
      }

      const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (dateOnly) {
        return { date: dateOnly[1] };
      }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return {
        date: value.toISOString().slice(0, 10),
        time: value.toISOString().slice(11, 16),
      };
    }

    return {};
  }

  private formatDuration(durationMin?: number, durationText?: string): string {
    if (typeof durationText === "string" && durationText.trim().length > 0) {
      return durationText;
    }

    if (typeof durationMin === "number" && !Number.isNaN(durationMin)) {
      const hours = Math.floor(durationMin / 60);
      const minutes = durationMin % 60;
      return `${hours}h ${minutes}min`;
    }

    return "";
  }

  private mapAvailability(seatsAvailable?: number): string {
    if (typeof seatsAvailable !== "number") {
      return "disponibile";
    }

    if (seatsAvailable <= 0) {
      return "esaurito";
    }

    if (seatsAvailable <= 10) {
      return "pochi posti";
    }

    return "disponibile";
  }

  private extractPriceTrend(train: any): { previousPrice?: number; priceTrend?: string } {
    const currentPrice = Number(train.priceEUR ?? train.price ?? NaN);
    const previousPrice = Number(
      train.previousPriceEUR ?? train.previousPrice ?? train.lastPrice ?? NaN
    );

    if (Number.isNaN(currentPrice) || Number.isNaN(previousPrice)) {
      return {};
    }

    if (currentPrice > previousPrice) {
      return { previousPrice, priceTrend: "in aumento" };
    }

    if (currentPrice < previousPrice) {
      return { previousPrice, priceTrend: "in discesa" };
    }

    return { previousPrice, priceTrend: "stabile" };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}


export const geminiService = new GeminiService();