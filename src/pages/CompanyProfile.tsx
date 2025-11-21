import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, DollarSign, Microscope, FileCheck } from 'lucide-react';
import { fetchCompanyDetails } from '../services/ai';
import { dealStageToVar, badgeClassesFromVar } from '../lib/badges';

const CompanyProfile: React.FC<{ companyName: string; onBack: () => void }> = ({ companyName, onBack }) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<{ clinical_trials: any[]; regulatory: any[] }>({ clinical_trials: [], regulatory: [] });

  useEffect(() => {
    fetchCompanyDetails(companyName).then((res) => {
      setDeals(res.deals || []);
      setCompanyData({ clinical_trials: res.clinical_trials || [], regulatory: res.regulatory || [] });
    }).catch(() => {
      setDeals([]);
      setCompanyData({ clinical_trials: [], regulatory: [] });
    });
  }, [companyName]);

  const totalFunding = deals.reduce((sum, deal) => sum + (deal.value_usd || deal.value || 0), 0);

  return (
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="btn-outline p-2 rounded">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
            <Building2 className="h-6 w-6 text-[var(--color-background-surface)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{companyName}</h1>
            <p className="text-[var(--color-text-secondary)]">Company Profile</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-[var(--color-primary-teal)]" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Funding</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">${(totalFunding / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-[var(--color-primary-teal)]" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Funding Rounds</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{deals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-3">
            <Microscope className="h-6 w-6 text-[var(--color-primary-teal)]" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Clinical Trials</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{companyData.clinical_trials.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funding History */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Funding History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-background-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Investors</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider-gray)]">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[var(--color-background-default)] transition-colors">
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{new Date(deal.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`${badgeClassesFromVar(dealStageToVar(deal.stage || deal.type))} px-2 py-1 rounded text-xs`}>{deal.stage || deal.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[var(--color-primary-teal)]">${((deal.value_usd || deal.value) / 1000000).toFixed(1)}M</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{(deal.investors || []).join(', ')}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{deal.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Trials */}
      {companyData.clinical_trials.length > 0 && (
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-2 mb-4">
            <Microscope className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Clinical Trials</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-background-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Trial ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Indication</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Phase</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider-gray)]">
                {companyData.clinical_trials.map((trial, index) => (
                  <tr key={index} className="hover:bg-[var(--color-background-default)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[var(--color-primary-teal)]">{trial.trial_id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{trial.indication}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Phase {trial.phase}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trial.status === 'Active' || trial.status === 'Recruiting' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-100'
                      }`}>
                        {trial.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regulatory Approvals */}
      {companyData.regulatory.length > 0 && (
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-2 mb-4">
            <FileCheck className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regulatory Approvals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-background-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Regulatory Body</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider-gray)]">
                {companyData.regulatory.map((reg, index) => (
                  <tr key={index} className="hover:bg-[var(--color-background-default)] transition-colors">
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{reg.body}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)] font-medium">{reg.product}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reg.status === 'Approved' || reg.status === '510(k) Cleared'
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{new Date(reg.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;