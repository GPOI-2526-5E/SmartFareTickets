import { Router, Request, Response } from "express";
import { geminiService } from "../services/gemini.services";
import { TrainSearchParams } from "../models/train-search-params";

const router = Router();

/**
 * POST /api/search - Cerca biglietti treno
 * Body: { from, to, date, passengers }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { from, to, date, passengers = 1 } = req.body;

    // Validazione
    if (!from || !to || !date) {
      return res.status(400).json({
        error: "Parametri mancanti",
        required: ["from", "to", "date"]
      });
    }

    const searchParams: TrainSearchParams = {
      from,
      to,
      date,
      passengers: Number(passengers) || 1
    };

    // Cerca con Gemini
    console.log(`🔍 Ricerca nuova: ${from} → ${to} (${date})`);
    const offers = await geminiService.searchTrainOffers(searchParams);

    // Ottieni raccomandazioni
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

export default router;
