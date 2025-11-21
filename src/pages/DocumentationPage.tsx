import React, { useState } from 'react';
import { Globe, Book, Code, Database, Key, ArrowLeft, Search, ExternalLink, Copy, Check } from 'lucide-react';

interface DocumentationPageProps {
  onBack: () => void;
}

const DocumentationPage: React.FC<DocumentationPageProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'api-reference', title: 'API Reference', icon: Code },
    { id: 'data-models', title: 'Data Models', icon: Database },
    { id: 'examples', title: 'Code Examples', icon: Code },
    { id: 'webhooks', title: 'Webhooks', icon: ExternalLink }
  ];

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const CodeBlock = ({ code, language = 'javascript', id }: { code: string; language?: string; id: string }) => (
    <div className="relative bg-gray-900 dark:bg-gray-950 rounded-xl p-5 mb-6 border border-gray-800 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs font-mono uppercase tracking-wide">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-sm"
        >
          {copiedCode === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copiedCode === id ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="text-green-400 text-sm overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Getting Started</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Welcome to the Medarion API documentation. Our API provides comprehensive access to African healthcare 
                investment data, company information, and market intelligence.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Base URL</h3>
              <code className="text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                https://api.medarion.com/v1
              </code>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                <li>Sign up for a Medarion account and obtain your API key</li>
                <li>Make your first API request to test connectivity</li>
                <li>Explore our endpoints to access healthcare data</li>
                <li>Integrate our data into your applications</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">First API Call</h3>
              <CodeBlock
                id="first-call"
                code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.medarion.com/v1/deals`}
                language="bash"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Rate Limits</h4>
              <p className="text-yellow-800 dark:text-yellow-200">
                API requests are limited to 1000 requests per hour for free tier users. 
                Premium users have higher limits based on their subscription plan.
              </p>
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Authentication</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The Medarion API uses API keys for authentication. Include your API key in the Authorization header 
                of all requests.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Key Authentication</h3>
              <CodeBlock
                id="auth-header"
                code={`Authorization: Bearer YOUR_API_KEY`}
                language="http"
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">JavaScript Example</h3>
              <CodeBlock
                id="js-auth"
                code={`const apiKey = 'your_api_key_here';

const response = await fetch('https://api.medarion.com/v1/deals', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Python Example</h3>
              <CodeBlock
                id="python-auth"
                code={`import requests

api_key = 'your_api_key_here'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.medarion.com/v1/deals', headers=headers)
data = response.json()
print(data)`}
                language="python"
              />
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Security Best Practices</h4>
              <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                <li>Never expose your API key in client-side code</li>
                <li>Store API keys securely using environment variables</li>
                <li>Rotate your API keys regularly</li>
                <li>Use HTTPS for all API requests</li>
              </ul>
            </div>
          </div>
        );

      case 'api-reference':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">API Reference</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Complete reference for all available endpoints in the Medarion API.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Deals Endpoint</h3>
                <div className="mb-4">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-mono">
                    GET
                  </span>
                  <code className="ml-2 text-gray-700 dark:text-gray-300">/v1/deals</code>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Retrieve investment deals and grants data across African healthcare companies.
                </p>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Query Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-2 text-gray-900 dark:text-white">Parameter</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white">Type</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr>
                        <td className="p-2 font-mono text-gray-700 dark:text-gray-300">country</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">string</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">Filter by country (e.g., "Nigeria", "Kenya")</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-gray-700 dark:text-gray-300">sector</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">string</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">Filter by sector (e.g., "Telemedicine", "AI Diagnostics")</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-gray-700 dark:text-gray-300">limit</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">integer</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">Number of results to return (default: 50, max: 100)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 mt-4">Example Response</h4>
                <CodeBlock
                  id="deals-response"
                  code={`{
  "data": [
    {
      "id": "deal_123",
      "company_name": "AfyaConnect",
      "amount": 3200000,
      "deal_type": "Seed",
      "sector": "Telemedicine",
      "country": "Kenya",
      "date": "2024-07-15",
      "investors": ["Savannah Capital", "Nile Ventures"]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 50
  }
}`}
                  language="json"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Companies Endpoint</h3>
                <div className="mb-4">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-mono">
                    GET
                  </span>
                  <code className="ml-2 text-gray-700 dark:text-gray-300">/v1/companies</code>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Access comprehensive company profiles and information.
                </p>

                <CodeBlock
                  id="companies-response"
                  code={`{
  "data": [
    {
      "id": "company_456",
      "name": "AfyaConnect",
      "sector": "Telemedicine",
      "country": "Kenya",
      "founded_year": 2020,
      "team_size": 25,
      "total_funding": 13200000,
      "description": "AI-powered telemedicine platform..."
    }
  ]
}`}
                  language="json"
                />
              </div>
            </div>
          </div>
        );

      case 'data-models':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Data Models</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Detailed schemas for all data objects returned by the Medarion API.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Deal Object</h3>
                <CodeBlock
                  id="deal-schema"
                  code={`{
  "id": "string",                    // Unique deal identifier
  "company_name": "string",          // Name of the company
  "company_id": "string",            // Company identifier
  "amount": "number",                // Deal amount in USD
  "deal_type": "string",             // Type: Seed, Series A, Grant, etc.
  "sector": "string",                // Healthcare sector
  "country": "string",               // Country where company is based
  "date": "string",                  // Deal date (ISO 8601)
  "investors": ["string"],           // Array of investor names
  "description": "string",           // Deal description
  "source": "string"                 // Data source
}`}
                  language="json"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Company Object</h3>
                <CodeBlock
                  id="company-schema"
                  code={`{
  "id": "string",                    // Unique company identifier
  "name": "string",                  // Company name
  "sector": "string",                // Healthcare sector
  "country": "string",               // Country
  "description": "string",           // Company description
  "website": "string",               // Company website URL
  "founded_year": "number",          // Year founded
  "team_size": "number",             // Number of employees
  "total_funding": "number",         // Total funding raised in USD
  "last_funding_date": "string",     // Last funding date (ISO 8601)
  "created_at": "string",            // Record creation date
  "updated_at": "string"             // Last update date
}`}
                  language="json"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Clinical Trial Object</h3>
                <CodeBlock
                  id="trial-schema"
                  code={`{
  "id": "string",                    // Unique trial identifier
  "company_name": "string",          // Sponsoring company
  "trial_id": "string",              // Official trial ID (e.g., NCT number)
  "indication": "string",            // Medical condition being studied
  "phase": "string",                 // Trial phase (I, II, III, IV)
  "status": "string",                // Current status
  "start_date": "string",            // Trial start date
  "end_date": "string",              // Trial end date (if completed)
  "description": "string"            // Trial description
}`}
                  language="json"
                />
              </div>
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Code Examples</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Practical examples showing how to integrate Medarion API into your applications.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">React Integration</h3>
                <CodeBlock
                  id="react-example"
                  code={`import React, { useState, useEffect } from 'react';

const MedarionDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('https://api.medarion.com/v1/deals', {
          headers: {
            'Authorization': \`Bearer \${process.env.REACT_APP_MEDARION_API_KEY}\`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        setDeals(data.data);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) return <div>Loading deals...</div>;

  return (
    <div>
      <h2>Recent Healthcare Deals</h2>
      {deals.map(deal => (
        <div key={deal.id} className="deal-card">
          <h3>{deal.company_name}</h3>
          <p>Amount: \${deal.amount.toLocaleString()}</p>
          <p>Sector: {deal.sector}</p>
          <p>Country: {deal.country}</p>
        </div>
      ))}
    </div>
  );
};

export default MedarionDeals;`}
                  language="jsx"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Node.js Backend</h3>
                <CodeBlock
                  id="nodejs-example"
                  code={`const express = require('express');
const axios = require('axios');

const app = express();
const MEDARION_API_KEY = process.env.MEDARION_API_KEY;

// Endpoint to get deals by country
app.get('/api/deals/:country', async (req, res) => {
  try {
    const { country } = req.params;
    
    const response = await axios.get('https://api.medarion.com/v1/deals', {
      headers: {
        'Authorization': \`Bearer \${MEDARION_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      params: {
        country: country,
        limit: 50
      }
    });

    res.json({
      success: true,
      data: response.data.data,
      total: response.data.pagination.total
    });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals'
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}
                  language="javascript"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Python Data Analysis</h3>
                <CodeBlock
                  id="python-analysis"
                  code={`import requests
import pandas as pd
import matplotlib.pyplot as plt

class MedarionAnalyzer:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://api.medarion.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_deals(self, **params):
        """Fetch deals data with optional filters"""
        response = requests.get(
            f'{self.base_url}/deals',
            headers=self.headers,
            params=params
        )
        return response.json()['data']
    
    def analyze_sector_trends(self):
        """Analyze investment trends by sector"""
        deals = self.get_deals(limit=100)
        df = pd.DataFrame(deals)
        
        # Group by sector and sum amounts
        sector_analysis = df.groupby('sector').agg({
            'amount': ['sum', 'count', 'mean']
        }).round(2)
        
        return sector_analysis
    
    def plot_country_distribution(self):
        """Create visualization of deals by country"""
        deals = self.get_deals(limit=100)
        df = pd.DataFrame(deals)
        
        country_counts = df['country'].value_counts()
        
        plt.figure(figsize=(10, 6))
        country_counts.plot(kind='bar')
        plt.title('Healthcare Deals by Country')
        plt.xlabel('Country')
        plt.ylabel('Number of Deals')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

# Usage
analyzer = MedarionAnalyzer('your_api_key_here')
trends = analyzer.analyze_sector_trends()
print(trends)`}
                  language="python"
                />
              </div>
            </div>
          </div>
        );

      case 'webhooks':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Webhooks</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Set up webhooks to receive real-time notifications when new data is added to the Medarion platform.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Webhook Events</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li><code>deal.created</code> - New investment deal added</li>
                <li><code>company.created</code> - New company profile added</li>
                <li><code>trial.updated</code> - Clinical trial status updated</li>
                <li><code>regulatory.approved</code> - New regulatory approval</li>
              </ul>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Webhook Payload Example</h3>
                <CodeBlock
                  id="webhook-payload"
                  code={`{
  "event": "deal.created",
  "timestamp": "2024-12-20T10:30:00Z",
  "data": {
    "id": "deal_789",
    "company_name": "HealthTech Innovations",
    "amount": 2500000,
    "deal_type": "Seed",
    "sector": "AI Diagnostics",
    "country": "Nigeria",
    "date": "2024-12-20",
    "investors": ["African Health Fund"]
  },
  "webhook_id": "wh_abc123"
}`}
                  language="json"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Webhook Handler Example</h3>
                <CodeBlock
                  id="webhook-handler"
                  code={`const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhooks/medarion', (req, res) => {
  const signature = req.headers['x-medarion-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== \`sha256=\${expectedSignature}\`) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'deal.created':
      console.log('New deal:', data.company_name, data.amount);
      // Process new deal data
      break;
      
    case 'company.created':
      console.log('New company:', data.name, data.sector);
      // Process new company data
      break;
      
    default:
      console.log('Unknown event:', event);
  }
  
  res.status(200).send('OK');
});

app.listen(3000);`}
                  language="javascript"
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Webhook Security</h4>
              <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                All webhook payloads are signed with HMAC SHA256. Always verify the signature before processing webhook data.
              </p>
              <p className="text-yellow-800 dark:text-yellow-200">
                The signature is included in the <code>X-Medarion-Signature</code> header.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background-default)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]" style={{ 
        marginTop: '-100px',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        left: '50%',
        right: '50%',
        width: '100vw',
        paddingTop: '120px',
        paddingBottom: '48px',
        position: 'relative',
      }}>
        <div aria-hidden className="absolute inset-0 z-0">
          <img
            src={(import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
            className="w-full h-full object-cover blur-[2px] scale-105 opacity-90"
            style={{ filter: 'brightness(0.4) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ background: 'linear-gradient(90deg, var(--color-primary-teal) 0%, var(--color-accent-sky) 100%)' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-[var(--color-primary-teal)]/20 backdrop-blur-sm mb-6">
              <Code className="h-8 w-8 text-white" />
            </div>
            <div className="mx-auto w-16 h-1 rounded-full bg-[var(--color-primary-teal)] mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              API Documentation
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Comprehensive guides and references for integrating with the Medarion API
            </p>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="w-72 bg-[var(--color-background-surface)] border-r border-[var(--color-divider-gray)] min-h-screen sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-transparent text-sm"
              />
            </div>
            
            <nav className="space-y-1">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-[var(--color-primary-teal)] text-white shadow-sm'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background-default)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;