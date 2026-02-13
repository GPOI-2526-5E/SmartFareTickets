import { TrainOffer } from "./train-offer";

export interface AIRecommendation {
    bestOffer: TrainOffer;
    reasoning: string;
    alternatives: TrainOffer[];
    priceAnalysis: string;
    suggestion: string;
}