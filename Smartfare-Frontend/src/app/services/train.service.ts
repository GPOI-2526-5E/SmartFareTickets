import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TrainOffer {
  company: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  trainType: string;
  changes: number;
  availability: string;
  link?: string;
}

export interface AIRecommendation {
  bestOffer: TrainOffer;
  reasoning: string;
  alternatives: TrainOffer[];
  priceAnalysis: string;
  suggestion: string;
}

export interface SearchResponse {
  source: 'cache' | 'live';
  offers: TrainOffer[];
  recommendation: AIRecommendation;
  searchedAt?: Date;
  cachedAt?: Date;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrainService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  searchTrains(params: SearchParams): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${this.apiUrl}/search`, params);
  }

  getCompanies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/companies`);
  }

  analyzeOffers(offers: TrainOffer[], preferences?: any): Observable<AIRecommendation> {
    return this.http.post<AIRecommendation>(`${this.apiUrl}/analyze`, {
      offers,
      preferences
    });
  }
}
