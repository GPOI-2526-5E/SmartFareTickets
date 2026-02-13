import { Router, Request, Response } from "express";
import { geminiService } from "../services/gemini.services";
import { TrainSearchParams } from "../models/train-search-params";

const router = Router();

/**
 * GET /api/health - Health check con test di ricerca
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const searchParams: TrainSearchParams = {
      from: "Torino",
      to: "Bologna",
      date: "20/03/2026",
      passengers: 1
    };

    // Cerca con Gemini
    console.log(`🔍 Ricerca nuova: Torino → Bologna (20/03/2026)`);
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
