import { Router, Request, Response } from "express";
import { geminiService } from "../services/gemini.services";
import { TrainSearchParams } from "../models/train-search-params";

const router = Router();

/**
 * GET /api/health - Health check con test di ricerca
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Cerca treni dal 1° al 30 marzo 2026
    console.log(`🔍 Ricerca nuova: Cesena → Brescia (01/03/2026 - 30/03/2026)`);
    
    const { getCollection } = await import("../config/database");
    const trainsCollection = getCollection("Trains");
    
    const originRegex = /^Cesena$/i;
    const destinationRegex = /^Brescia$/i;
    
    // Range di date: dal 01/03/2026 al 30/03/2026
    const startDate = new Date("2026-03-01T00:00:00.000Z");
    const endDate = new Date("2026-03-31T00:00:00.000Z");
    
    const filter = {
      origin: originRegex,
      destination: destinationRegex,
      $or: [
        { departureTime: { $gte: startDate, $lt: endDate } },
        { departureTime: { $regex: "2026-03-" } }
      ]
    };
    
    const trains = await trainsCollection.find(filter).toArray();
    console.log(`✅ Treni trovati per marzo 2026: ${trains.length}`);
    
    // Converti i risultati in TrainOffer
    const offers = trains.map((train: any) => {
      const departureParts = extractDateTimeParts(train.departureTime || train.departureDate);
      const arrivalParts = extractDateTimeParts(train.arrivalTime || train.arrivalDate);
      
      return {
        company: train.company || "",
        departureDate: departureParts.date || "",
        departureTime: departureParts.time || "",
        arrivalTime: arrivalParts.time || "",
        duration: formatDuration(train.durationMin, train.duration),
        price: Number(train.priceEUR ?? train.price ?? 0),
        trainType: train.trainType || "",
        changes: Number(train.changes ?? 0),
        availability: mapAvailability(train.seatsAvailable),
        link: train.link,
        departure: train.origin || train.departure || "",
        arrival: train.destination || train.arrival || "",
      };
    });

    // Ottieni raccomandazioni da Gemini
    const recommendation = await geminiService.getRecommendations(offers);

    res.json({
      source: "live",
      offers,
      recommendation,
      searchedAt: new Date()
    });
  } catch (error: any) {
    console.error("Errore ricerca:", error);
    res.status(500).json({
      error: "Errore durante la ricerca",
      message: error.message
    });
  }
});

// Helper functions
function extractDateTimeParts(value: unknown): { date?: string; time?: string } {
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
  if (value instanceof Date && !isNaN(value.getTime())) {
    return {
      date: value.toISOString().slice(0, 10),
      time: value.toISOString().slice(11, 16),
    };
  }
  return {};
}

function formatDuration(durationMin?: number, durationText?: string): string {
  if (typeof durationText === "string" && durationText.trim().length > 0) {
    return durationText;
  }
  if (typeof durationMin === "number" && !isNaN(durationMin)) {
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    return `${hours}h ${minutes}min`;
  }
  return "";
}

function mapAvailability(seatsAvailable?: number): string {
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

/**
 * GET /api/health/db-stats - Diagnostica database
 */
router.get("/db-stats", async (req: Request, res: Response) => {
  try {
    const { getCollection } = await import("../config/database");
    const trainsCollection = getCollection("Trains");
    
    const totalTrains = await trainsCollection.estimatedDocumentCount();
    
    // Conta treni per Cesena-Brescia
    const cesenaBresciaCount = await trainsCollection.countDocuments({
      origin: /^Cesena$/i,
      destination: /^Brescia$/i
    });
    
    // Conta treni per il 04/03/2026
    const date040326Count = await trainsCollection.countDocuments({
      departureTime: { $regex: "2026-03-04" }
    });
    
    // Trova le tratte più comuni per il 04/03/2026
    const topRoutesForDate = await trainsCollection.aggregate([
      { $match: { departureTime: { $regex: "2026-03-04" } } },
      { $group: { _id: { origin: "$origin", destination: "$destination" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    // Campioni per il 04/03/2026
    const sampleTrains = await trainsCollection
      .find({ departureTime: { $regex: "2026-03-04" } })
      .limit(5)
      .toArray();
    
    // Trova le tratte più comuni (tutte le date)
    const topRoutes = await trainsCollection.aggregate([
      { $group: { _id: { origin: "$origin", destination: "$destination" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    res.json({
      database: "Smartfare",
      collection: "Trains",
      stats: {
        totalTrains,
        cesenaBresciaCount,
        date040326Count,
        topRoutesForDate040326: topRoutesForDate.map(r => ({
          from: r._id.origin,
          to: r._id.destination,
          count: r.count
        })),
        topRoutes: topRoutes.map(r => ({
          from: r._id.origin,
          to: r._id.destination,
          count: r.count
        })),
        sampleTrains: sampleTrains.map(t => ({
          origin: t.origin,
          destination: t.destination,
          departureTime: t.departureTime,
          company: t.company,
          price: t.priceEUR
        }))
      }
    });
  } catch (error: any) {
    console.error("Errore stats DB:", error);
    res.status(500).json({
      error: "Errore durante le statistiche",
      message: error.message
    });
  }
});

export default router;
