// Centralized data service for fetching from database APIs
import { apiService } from './apiService';

export interface CompaniesResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface DealsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface GrantsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface InvestorsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface RegulatoryResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface PublicMarketsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface NationPulseResponse {
  success: boolean;
  data: any[];
  raw_data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface ClinicalTrialsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface ClinicalCentersResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface InvestigatorsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

class DataService {
  async getCompanies(params?: {
    industry?: string;
    stage?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompaniesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.industry) queryParams.append('industry', params.industry);
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/companies${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<CompaniesResponse>(url);
  }

  async getDeals(params?: {
    deal_type?: string;
    status?: string;
    company_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<DealsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.deal_type) queryParams.append('deal_type', params.deal_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/deals${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<DealsResponse>(url);
  }

  async getGrants(params?: {
    grant_type?: string;
    status?: string;
    funding_agency?: string;
    limit?: number;
    offset?: number;
  }): Promise<GrantsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.grant_type) queryParams.append('grant_type', params.grant_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.funding_agency) queryParams.append('funding_agency', params.funding_agency);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/grants${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<GrantsResponse>(url);
  }

  async getInvestors(params?: {
    type?: string;
    country?: string;
    sector?: string;
    limit?: number;
    offset?: number;
  }): Promise<InvestorsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.sector) queryParams.append('sector', params.sector);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/investors${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<InvestorsResponse>(url);
  }

  async getRegulatory(params?: {
    status?: string;
    body?: string;
    company_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<RegulatoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.body) queryParams.append('body', params.body);
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/regulatory${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<RegulatoryResponse>(url);
  }

  async getPublicMarkets(params?: {
    exchange?: string;
    sector?: string;
    country?: string;
    limit?: number;
    offset?: number;
  }): Promise<PublicMarketsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.exchange) queryParams.append('exchange', params.exchange);
    if (params?.sector) queryParams.append('sector', params.sector);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/admin/public-markets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<PublicMarketsResponse>(url);
  }

  async getCurrencyRates(params?: {
    base?: string;
    symbols?: string;
    source?: 'auto' | 'live' | 'db';
    max_age_hours?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.base) queryParams.append('base', params.base);
    if (params?.symbols) queryParams.append('symbols', params.symbols);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.max_age_hours !== undefined) queryParams.append('max_age_hours', String(params.max_age_hours));
    const url = `/api/currency${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<any>(url);
  }

  async getNationPulse(params?: {
    country?: string;
    data_type?: string;
    year?: number;
    limit?: number;
    offset?: number;
  }): Promise<NationPulseResponse> {
    const queryParams = new URLSearchParams();
    if (params?.country) queryParams.append('country', params.country);
    if (params?.data_type) queryParams.append('data_type', params.data_type);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/admin/nation-pulse${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<NationPulseResponse>(url);
  }

  async getClinicalTrials(params?: {
    phase?: string;
    status?: string;
    medical_condition?: string;
    sponsor?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClinicalTrialsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.phase) queryParams.append('phase', params.phase);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.medical_condition) queryParams.append('medical_condition', params.medical_condition);
    if (params?.sponsor) queryParams.append('sponsor', params.sponsor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/clinical-trials${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<ClinicalTrialsResponse>(url);
  }

  async getClinicalCenters(params?: {
    country?: string;
    city?: string;
    specialization?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClinicalCentersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.country) queryParams.append('country', params.country);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.specialization) queryParams.append('specialization', params.specialization);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/clinical-centers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<ClinicalCentersResponse>(url);
  }

  async getInvestigators(params?: {
    specialization?: string;
    country?: string;
    affiliation?: string;
    limit?: number;
    offset?: number;
  }): Promise<InvestigatorsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.specialization) queryParams.append('specialization', params.specialization);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.affiliation) queryParams.append('affiliation', params.affiliation);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/investigators${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiService.request<InvestigatorsResponse>(url);
  }
}

export const dataService = new DataService();

