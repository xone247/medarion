// Database Service Layer for Medarion Platform
// This service handles all database operations for admin interfaces

// Database connection configuration
const DB_CONFIG = {
  host: 'localhost',
  database: 'medarion_platform',
  username: 'root',
  password: ''
};

// Generic database service class
class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/database';
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Generic CRUD operations
  async create(table: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  }

  async read(table: string, id?: number, filters?: any): Promise<any> {
    try {
      let url = `${this.baseUrl}/${table}`;
      if (id) url += `/${id}`;
      if (filters) {
        const params = new URLSearchParams(filters);
        url += `?${params}`;
      }
      
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error(`Error reading ${table}:`, error);
      throw error;
    }
  }

  async update(table: string, id: number, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  async delete(table: string, id: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchCreate(table: string, data: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: data })
      });
      return await response.json();
    } catch (error) {
      console.error(`Error batch creating ${table}:`, error);
      throw error;
    }
  }

  async batchUpdate(table: string, updates: { id: number; data: any }[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      return await response.json();
    } catch (error) {
      console.error(`Error batch updating ${table}:`, error);
      throw error;
    }
  }

  // Search and filtering
  async search(table: string, query: string, fields?: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${table}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, fields })
      });
      return await response.json();
    } catch (error) {
      console.error(`Error searching ${table}:`, error);
      throw error;
    }
  }

  // Data import/export
  async importData(table: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('table', table);

      const response = await fetch(`${this.baseUrl}/${table}/import`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error(`Error importing data to ${table}:`, error);
      throw error;
    }
  }

  async exportData(table: string, format: 'csv' | 'json' | 'xlsx', filters?: any): Promise<Blob> {
    try {
      let url = `${this.baseUrl}/${table}/export?format=${format}`;
      if (filters) {
        const params = new URLSearchParams(filters);
        url += `&${params}`;
      }

      const response = await fetch(url);
      return await response.blob();
    } catch (error) {
      console.error(`Error exporting data from ${table}:`, error);
      throw error;
    }
  }
}

// Specialized services for each module
export class CompaniesService extends DatabaseService {
  async getCompanies(filters?: any): Promise<any[]> {
    return this.read('companies', undefined, filters);
  }

  async createCompany(companyData: any): Promise<any> {
    return this.create('companies', companyData);
  }

  async updateCompany(id: number, companyData: any): Promise<any> {
    return this.update('companies', id, companyData);
  }

  async deleteCompany(id: number): Promise<any> {
    return this.delete('companies', id);
  }

  async getCompanyStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/stats`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }
}

export class DealsService extends DatabaseService {
  async getDeals(filters?: any): Promise<any[]> {
    return this.read('deals', undefined, filters);
  }

  async createDeal(dealData: any): Promise<any> {
    return this.create('deals', dealData);
  }

  async updateDeal(id: number, dealData: any): Promise<any> {
    return this.update('deals', id, dealData);
  }

  async deleteDeal(id: number): Promise<any> {
    return this.delete('deals', id);
  }

  async getDealStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/deals/stats`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching deal stats:', error);
      throw error;
    }
  }
}

export class GrantsService extends DatabaseService {
  async getGrants(filters?: any): Promise<any[]> {
    return this.read('grants', undefined, filters);
  }

  async createGrant(grantData: any): Promise<any> {
    return this.create('grants', grantData);
  }

  async updateGrant(id: number, grantData: any): Promise<any> {
    return this.update('grants', id, grantData);
  }

  async deleteGrant(id: number): Promise<any> {
    return this.delete('grants', id);
  }
}

export class InvestorsService extends DatabaseService {
  async getInvestors(filters?: any): Promise<any[]> {
    return this.read('investors', undefined, filters);
  }

  async createInvestor(investorData: any): Promise<any> {
    return this.create('investors', investorData);
  }

  async updateInvestor(id: number, investorData: any): Promise<any> {
    return this.update('investors', id, investorData);
  }

  async deleteInvestor(id: number): Promise<any> {
    return this.delete('investors', id);
  }
}

export class ClinicalTrialsService extends DatabaseService {
  async getTrials(filters?: any): Promise<any[]> {
    return this.read('clinical_trials', undefined, filters);
  }

  async createTrial(trialData: any): Promise<any> {
    return this.create('clinical_trials', trialData);
  }

  async updateTrial(id: number, trialData: any): Promise<any> {
    return this.update('clinical_trials', id, trialData);
  }

  async deleteTrial(id: number): Promise<any> {
    return this.delete('clinical_trials', id);
  }
}

export class RegulatoryService extends DatabaseService {
  async getRegulatoryBodies(filters?: any): Promise<any[]> {
    return this.read('regulatory_bodies', undefined, filters);
  }

  async createRegulatoryBody(bodyData: any): Promise<any> {
    return this.create('regulatory_bodies', bodyData);
  }

  async updateRegulatoryBody(id: number, bodyData: any): Promise<any> {
    return this.update('regulatory_bodies', id, bodyData);
  }

  async getCompanyRegulatory(companyId?: number): Promise<any[]> {
    return this.read('company_regulatory', undefined, companyId ? { company_id: companyId } : undefined);
  }

  async createCompanyRegulatory(data: any): Promise<any> {
    return this.create('company_regulatory', data);
  }
}

export class ClinicalCentersService extends DatabaseService {
  async getCenters(filters?: any): Promise<any[]> {
    return this.read('clinical_centers', undefined, filters);
  }

  async createCenter(centerData: any): Promise<any> {
    return this.create('clinical_centers', centerData);
  }

  async updateCenter(id: number, centerData: any): Promise<any> {
    return this.update('clinical_centers', id, centerData);
  }

  async deleteCenter(id: number): Promise<any> {
    return this.delete('clinical_centers', id);
  }
}

export class InvestigatorsService extends DatabaseService {
  async getInvestigators(filters?: any): Promise<any[]> {
    return this.read('investigators', undefined, filters);
  }

  async createInvestigator(investigatorData: any): Promise<any> {
    return this.create('investigators', investigatorData);
  }

  async updateInvestigator(id: number, investigatorData: any): Promise<any> {
    return this.update('investigators', id, investigatorData);
  }

  async deleteInvestigator(id: number): Promise<any> {
    return this.delete('investigators', id);
  }
}

export class NationPulseService extends DatabaseService {
  async getNationPulseData(country?: string, dataType?: string): Promise<any[]> {
    const filters: any = {};
    if (country) filters.country = country;
    if (dataType) filters.data_type = dataType;
    return this.read('nation_pulse_data', undefined, filters);
  }

  async createNationPulseData(data: any): Promise<any> {
    return this.create('nation_pulse_data', data);
  }

  async updateNationPulseData(id: number, data: any): Promise<any> {
    return this.update('nation_pulse_data', id, data);
  }

  async deleteNationPulseData(id: number): Promise<any> {
    return this.delete('nation_pulse_data', id);
  }
}

export class PublicMarketsService extends DatabaseService {
  async getStocks(filters?: any): Promise<any[]> {
    return this.read('public_stocks', undefined, filters);
  }

  async createStock(stockData: any): Promise<any> {
    return this.create('public_stocks', stockData);
  }

  async updateStock(id: number, stockData: any): Promise<any> {
    return this.update('public_stocks', id, stockData);
  }

  async deleteStock(id: number): Promise<any> {
    return this.delete('public_stocks', id);
  }
}

export class CRMService extends DatabaseService {
  async getCRMInvestors(userId: number, filters?: any): Promise<any[]> {
    return this.read('crm_investors', undefined, { user_id: userId, ...filters });
  }

  async createCRMInvestor(investorData: any): Promise<any> {
    return this.create('crm_investors', investorData);
  }

  async updateCRMInvestor(id: number, investorData: any): Promise<any> {
    return this.update('crm_investors', id, investorData);
  }

  async deleteCRMInvestor(id: number): Promise<any> {
    return this.delete('crm_investors', id);
  }

  async getCRMMeetings(investorId: number): Promise<any[]> {
    return this.read('crm_meetings', undefined, { crm_investor_id: investorId });
  }

  async createCRMMeeting(meetingData: any): Promise<any> {
    return this.create('crm_meetings', meetingData);
  }
}

export class AIService extends DatabaseService {
  async getAIUsage(userId?: number, filters?: any): Promise<any[]> {
    const queryFilters = userId ? { user_id: userId, ...filters } : filters;
    return this.read('ai_usage_log', undefined, queryFilters);
  }

  async getAIModels(): Promise<any[]> {
    return this.read('ai_models');
  }

  async createAIModel(modelData: any): Promise<any> {
    return this.create('ai_models', modelData);
  }

  async updateAIModel(id: number, modelData: any): Promise<any> {
    return this.update('ai_models', id, modelData);
  }

  async getAIPrompts(): Promise<any[]> {
    return this.read('ai_prompts');
  }

  async createAIPrompt(promptData: any): Promise<any> {
    return this.create('ai_prompts', promptData);
  }

  async updateAIPrompt(id: number, promptData: any): Promise<any> {
    return this.update('ai_prompts', id, promptData);
  }

  async logAIUsage(usageData: any): Promise<any> {
    return this.create('ai_usage_log', usageData);
  }
}

export class AnalyticsService extends DatabaseService {
  async getUserActivity(userId?: number, filters?: any): Promise<any[]> {
    const queryFilters = userId ? { user_id: userId, ...filters } : filters;
    return this.read('user_activity_log', undefined, queryFilters);
  }

  async getSystemMetrics(filters?: any): Promise<any[]> {
    return this.read('system_metrics', undefined, filters);
  }

  async createSystemMetric(metricData: any): Promise<any> {
    return this.create('system_metrics', metricData);
  }
}

export class DataImportExportService extends DatabaseService {
  async getDataImports(userId?: number): Promise<any[]> {
    return this.read('data_imports', undefined, userId ? { user_id: userId } : undefined);
  }

  async getDataExports(userId?: number): Promise<any[]> {
    return this.read('data_exports', undefined, userId ? { user_id: userId } : undefined);
  }

  async createDataImport(importData: any): Promise<any> {
    return this.create('data_imports', importData);
  }

  async createDataExport(exportData: any): Promise<any> {
    return this.create('data_exports', exportData);
  }
}

// Export singleton instances
export const companiesService = new CompaniesService();
export const dealsService = new DealsService();
export const grantsService = new GrantsService();
export const investorsService = new InvestorsService();
export const clinicalTrialsService = new ClinicalTrialsService();
export const regulatoryService = new RegulatoryService();
export const clinicalCentersService = new ClinicalCentersService();
export const investigatorsService = new InvestigatorsService();
export const nationPulseService = new NationPulseService();
export const publicMarketsService = new PublicMarketsService();
export const crmService = new CRMService();
export const aiService = new AIService();
export const analyticsService = new AnalyticsService();
export const dataImportExportService = new DataImportExportService();

// Export the base service
export default DatabaseService;

