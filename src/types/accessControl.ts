import { AccountTier, UserRole } from './userTypes';

export type AdPolicy = 'none' | 'minimal' | 'blog-only';

export interface TierPolicy {
  modules: string[];
  aiEnabled: boolean;
  aiMonthlyQuota?: number;
  adPolicy: AdPolicy;
}

export type AccessMatrix = Record<UserRole, Record<AccountTier, TierPolicy>>;

export const DEFAULT_FREE_THIRD_MODULE_BY_ROLE: Record<UserRole, string> = {
  investors_finance: 'companies',
  industry_executives: 'companies',
  health_science_experts: 'clinical_trials',
  media_advisors: 'dealflow_tracker',
  startup: 'investor_search',
};

export const ACCESS_MATRIX: AccessMatrix = {
  investors_finance: {
    free: {
      modules: ['dashboard', 'nation_pulse', DEFAULT_FREE_THIRD_MODULE_BY_ROLE.investors_finance],
      aiEnabled: false,
      adPolicy: 'minimal',
    },
    paid: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 200,
      adPolicy: 'none',
    },
    enterprise: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      adPolicy: 'none',
    },
    academic: {
      modules: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 50,
      adPolicy: 'minimal',
    },
  },
  industry_executives: {
    free: {
      modules: ['dashboard', 'nation_pulse', DEFAULT_FREE_THIRD_MODULE_BY_ROLE.industry_executives],
      aiEnabled: false,
      adPolicy: 'minimal',
    },
    paid: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 200,
      adPolicy: 'none',
    },
    enterprise: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      adPolicy: 'none',
    },
    academic: {
      modules: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 50,
      adPolicy: 'minimal',
    },
  },
  health_science_experts: {
    free: {
      modules: ['dashboard', 'nation_pulse', DEFAULT_FREE_THIRD_MODULE_BY_ROLE.health_science_experts],
      aiEnabled: false,
      adPolicy: 'minimal',
    },
    paid: {
      modules: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 150,
      adPolicy: 'none',
    },
    enterprise: {
      modules: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      adPolicy: 'none',
    },
    academic: {
      modules: ['dashboard', 'grant_funding_tracker', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 50,
      adPolicy: 'minimal',
    },
  },
  media_advisors: {
    free: {
      modules: ['dashboard', 'nation_pulse', DEFAULT_FREE_THIRD_MODULE_BY_ROLE.media_advisors],
      aiEnabled: false,
      adPolicy: 'minimal',
    },
    paid: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 150,
      adPolicy: 'none',
    },
    enterprise: {
      modules: ['dashboard', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'companies', 'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      adPolicy: 'none',
    },
    academic: {
      modules: ['dashboard', 'dealflow_tracker', 'companies', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 50,
      adPolicy: 'minimal',
    },
  },
  startup: {
    free: {
      modules: ['dashboard', 'nation_pulse', DEFAULT_FREE_THIRD_MODULE_BY_ROLE.startup],
      aiEnabled: false,
      adPolicy: 'minimal',
    },
    paid: {
      modules: ['dashboard', 'my_profile', 'analytics', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 200,
      adPolicy: 'none',
    },
    enterprise: {
      modules: ['dashboard', 'my_profile', 'analytics', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'grant_funding_tracker', 'public_markets', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      adPolicy: 'none',
    },
    academic: {
      modules: ['dashboard', 'my_profile', 'fundraising_crm', 'investor_search', 'dealflow_tracker', 'regulatory', 'clinical_trials', 'nation_pulse'],
      aiEnabled: true,
      aiMonthlyQuota: 50,
      adPolicy: 'minimal',
    },
  },
}; 