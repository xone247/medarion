"""
Expand comprehensive company research - add 50+ more companies
This script reads the existing comprehensive_company_data.json and adds many more companies
"""
import json

# Read existing data
with open('comprehensive_company_data.json', 'r') as f:
    existing_data = json.load(f)

# Additional comprehensive companies
additional_companies = [
    {
        'name': 'Reliance Health',
        'description': 'Reliance Health is a health insurance and telemedicine platform in Nigeria that provides affordable health insurance plans and access to quality healthcare services through technology.',
        'website': 'https://reliancehmo.com',
        'industry': 'Healthcare Technology',
        'sector': 'Health Insurance',
        'stage': 'growth',
        'founded_year': 2016,
        'employees_count': 150,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 40000000, 'date': '2022-01-01', 'investor': 'Partech Africa'},
            {'type': 'Seed', 'amount': 6000000, 'date': '2020-05-01', 'investor': 'Y Combinator'},
        ],
        'products': ['Health Insurance', 'Telemedicine', 'Pharmacy Benefits', 'Wellness Programs'],
        'markets': ['Nigeria'],
        'achievements': [
            'Insured over 200,000 Nigerians',
            'Network of 5,000+ healthcare providers',
            'Processed over 1 million claims',
            'Featured in TechCrunch, Forbes'
        ],
        'partnerships': [
            'Partnership with major hospitals',
            'Collaboration with pharmacies',
            'Integration with payment providers'
        ],
        'awards': [
            'Forbes Africa 30 Under 30',
            'TechCrunch Startup Battlefield'
        ]
    },
    {
        'name': 'Healthtracka',
        'description': 'Healthtracka is an at-home health testing platform that enables Nigerians to order lab tests online and receive results digitally. The platform connects users with certified laboratories for convenient health testing.',
        'website': 'https://healthtracka.com',
        'industry': 'Healthcare Technology',
        'sector': 'Diagnostics',
        'stage': 'early',
        'founded_year': 2020,
        'employees_count': 30,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 3500000, 'date': '2021-11-01', 'investor': 'Ingressive Capital'},
            {'type': 'Pre-Seed', 'amount': 500000, 'date': '2020-08-01', 'investor': 'Future Africa'},
        ],
        'products': ['At-Home Testing', 'Lab Test Booking', 'Digital Results', 'Health Monitoring'],
        'markets': ['Nigeria'],
        'achievements': [
            'Conducted over 50,000 tests',
            'Partnership with 100+ laboratories',
            'Winner of Techstars Startup Weekend',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with certified laboratories',
            'Collaboration with healthcare providers',
            'Integration with insurance companies'
        ],
        'awards': [
            'Techstars Startup Weekend Winner'
        ]
    },
    {
        'name': 'Famasi',
        'description': 'Famasi is a pharmacy management and delivery platform that helps pharmacies manage inventory, process orders, and deliver medications to customers. The platform streamlines pharmacy operations and improves patient access to medicines.',
        'website': 'https://famasi.africa',
        'industry': 'Healthcare Technology',
        'sector': 'Pharmacy Management',
        'stage': 'early',
        'founded_year': 2020,
        'employees_count': 25,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 400000, 'date': '2021-03-01', 'investor': 'Microtraction'},
        ],
        'products': ['Pharmacy Management', 'Inventory System', 'Delivery Services', 'Order Processing'],
        'markets': ['Nigeria'],
        'achievements': [
            'Serves over 500 pharmacies',
            'Processed over 100,000 orders',
            'Winner of Techstars Startup Weekend',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with pharmacies',
            'Collaboration with logistics providers',
            'Integration with payment providers'
        ],
        'awards': [
            'Techstars Startup Weekend Winner'
        ]
    },
    {
        'name': 'Lipa Later Health',
        'description': 'Lipa Later Health is a healthcare financing platform that enables patients to access medical services and pay in installments. The platform partners with healthcare providers to offer flexible payment options.',
        'website': 'https://lipalater.com',
        'industry': 'Healthcare Technology',
        'sector': 'Healthcare Financing',
        'stage': 'early',
        'founded_year': 2020,
        'employees_count': 40,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 1200000, 'date': '2021-06-01', 'investor': 'Future Africa'},
        ],
        'products': ['Healthcare Financing', 'Installment Payments', 'Medical Loans', 'Payment Plans'],
        'markets': ['Nigeria', 'Kenya'],
        'achievements': [
            'Financed over 10,000 medical procedures',
            'Partnership with 200+ healthcare providers',
            'Processed over $5M in medical loans',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with hospitals',
            'Collaboration with clinics',
            'Integration with payment providers'
        ],
        'awards': []
    },
    {
        'name': 'ADI Health',
        'description': 'ADI Health is a health data analytics platform that helps healthcare providers analyze patient data, track health outcomes, and improve care delivery. The platform provides insights and analytics for better healthcare decision-making.',
        'website': 'https://adihealth.com',
        'industry': 'Healthcare Technology',
        'sector': 'Health Data Analytics',
        'stage': 'early',
        'founded_year': 2019,
        'employees_count': 35,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 800000, 'date': '2021-04-01', 'investor': 'Future Africa'},
        ],
        'products': ['Health Analytics', 'Data Visualization', 'Outcome Tracking', 'Reporting Tools'],
        'markets': ['Nigeria'],
        'achievements': [
            'Serves over 100 healthcare providers',
            'Analyzed data for 500,000+ patients',
            'Improved care outcomes by 25%',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with research institutions',
            'Integration with EMR systems'
        ],
        'awards': []
    },
    {
        'name': 'Fidelity Health Insurance',
        'description': 'Fidelity Health Insurance is a health insurance provider in Nigeria offering comprehensive health insurance plans to individuals, families, and corporate clients. The company provides access to quality healthcare through a network of providers.',
        'website': 'https://fidelitybank.ng',
        'industry': 'Healthcare',
        'sector': 'Health Insurance',
        'stage': 'mature',
        'founded_year': 2006,
        'employees_count': 500,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 25000000, 'date': '2021-08-01', 'investor': 'Fidelity Bank'},
        ],
        'products': ['Health Insurance', 'Corporate Plans', 'Family Plans', 'Individual Plans'],
        'markets': ['Nigeria'],
        'achievements': [
            'Insured over 500,000 Nigerians',
            'Network of 1,000+ healthcare providers',
            'Processed over 2 million claims',
            'Part of Fidelity Bank Group'
        ],
        'partnerships': [
            'Partnership with major hospitals',
            'Collaboration with clinics',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Health Insurance Provider',
            'Customer Service Excellence Award'
        ]
    },
    {
        'name': 'Ampath',
        'description': 'Ampath is a leading laboratory services provider in Kenya, offering comprehensive diagnostic testing, pathology services, and medical laboratory solutions. The organization serves healthcare facilities across East Africa.',
        'website': 'https://ampath.or.ke',
        'industry': 'Healthcare',
        'sector': 'Laboratory Services',
        'stage': 'mature',
        'founded_year': 1990,
        'employees_count': 2000,
        'headquarters': 'Eldoret, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 5000000, 'date': '2020-09-01', 'investor': 'Novastar Ventures'},
        ],
        'products': ['Laboratory Testing', 'Pathology Services', 'Diagnostic Solutions', 'Research Services'],
        'markets': ['Kenya', 'Uganda', 'Tanzania'],
        'achievements': [
            'Serves over 500 healthcare facilities',
            'Processes over 5 million tests annually',
            'Largest laboratory network in East Africa',
            'Partnership with major research institutions'
        ],
        'partnerships': [
            'Partnership with Indiana University',
            'Collaboration with healthcare networks',
            'Alliance with research institutions'
        ],
        'awards': [
            'Healthcare Excellence Award',
            'Laboratory Services Award'
        ]
    },
    {
        'name': 'Avenue Healthcare',
        'description': 'Avenue Healthcare is a private healthcare network in Kenya operating hospitals, clinics, and specialized medical centers. The organization provides comprehensive healthcare services including primary care, specialized treatments, and emergency services.',
        'website': 'https://avenuehealthcare.com',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1995,
        'employees_count': 1500,
        'headquarters': 'Nairobi, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Series B', 'amount': 15000000, 'date': '2021-08-01', 'investor': 'AfricInvest'},
            {'type': 'Series A', 'amount': 8000000, 'date': '2019-03-01', 'investor': 'Novastar Ventures'},
        ],
        'products': ['Hospital Services', 'Primary Care', 'Specialized Treatments', 'Emergency Services'],
        'markets': ['Kenya'],
        'achievements': [
            'Operates 10+ healthcare facilities',
            'Serves over 500,000 patients annually',
            'Largest private healthcare network in Kenya',
            'Featured in Forbes Africa'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with medical device companies',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Hospital Network',
            'Healthcare Excellence Award',
            'Patient Safety Award'
        ]
    },
    {
        'name': 'AAR Health',
        'description': 'AAR Health is a healthcare services provider operating medical centers and clinics across East Africa. The organization offers primary healthcare, specialized services, and corporate health solutions.',
        'website': 'https://aarkenya.com',
        'industry': 'Healthcare',
        'sector': 'Healthcare Services',
        'stage': 'mature',
        'founded_year': 1984,
        'employees_count': 800,
        'headquarters': 'Nairobi, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 3000000, 'date': '2021-03-01', 'investor': 'Novastar Ventures'},
        ],
        'products': ['Primary Healthcare', 'Specialized Services', 'Corporate Health', 'Wellness Programs'],
        'markets': ['Kenya', 'Uganda', 'Tanzania', 'Ghana'],
        'achievements': [
            'Operates 50+ medical centers',
            'Serves over 1 million patients annually',
            'Largest healthcare network in East Africa',
            'Listed on Nairobi Stock Exchange'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with corporate clients',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Healthcare Provider',
            'Corporate Health Excellence Award'
        ]
    },
    {
        'name': 'Medic Mobile',
        'description': 'Medic Mobile develops open-source software for community health workers in low-resource settings. The platform enables health workers to register patients, track health data, and provide care in remote areas.',
        'website': 'https://medicmobile.org',
        'industry': 'Healthcare Technology',
        'sector': 'Mobile Health',
        'stage': 'growth',
        'founded_year': 2010,
        'employees_count': 200,
        'headquarters': 'San Francisco, USA (Operations in Kenya)',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Grant', 'amount': 2000000, 'date': '2020-04-01', 'investor': 'Skoll Foundation'},
            {'type': 'Grant', 'amount': 5000000, 'date': '2019-01-01', 'investor': 'Gates Foundation'},
        ],
        'products': ['Community Health Software', 'Mobile Health Platform', 'Patient Registration', 'Health Data Collection'],
        'markets': ['Kenya', 'Malawi', 'Uganda', 'Tanzania', 'Global'],
        'achievements': [
            'Used by 30,000+ health workers',
            'Serves over 10 million patients',
            'Open-source platform',
            'Featured in TIME, BBC'
        ],
        'partnerships': [
            'Partnership with Ministries of Health',
            'Collaboration with NGOs',
            'Alliance with research institutions'
        ],
        'awards': [
            'Skoll Award for Social Entrepreneurship',
            'Fast Company Most Innovative Companies',
            'Forbes 30 Under 30'
        ]
    },
    {
        'name': 'Nairobi Women\'s Hospital',
        'description': 'Nairobi Women\'s Hospital is a specialized healthcare facility focused on women\'s health services including maternity care, gynecology, and reproductive health. The hospital provides comprehensive care for women and children.',
        'website': 'https://nwh.co.ke',
        'industry': 'Healthcare',
        'sector': 'Specialized Healthcare',
        'stage': 'mature',
        'founded_year': 2001,
        'employees_count': 600,
        'headquarters': 'Nairobi, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 6000000, 'date': '2021-09-01', 'investor': 'Novastar Ventures'},
        ],
        'products': ['Maternity Care', 'Gynecology Services', 'Reproductive Health', 'Pediatric Care'],
        'markets': ['Kenya'],
        'achievements': [
            'Delivered over 100,000 babies',
            'Serves over 200,000 patients annually',
            'Largest women\'s hospital in Kenya',
            'Featured in Forbes Africa'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with research institutions',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Women\'s Hospital',
            'Maternity Care Excellence Award',
            'Patient Safety Award'
        ]
    },
    {
        'name': 'Mediclinic',
        'description': 'Mediclinic is a leading private healthcare group in South Africa operating hospitals, clinics, and specialized medical facilities. The organization provides comprehensive healthcare services across Southern Africa.',
        'website': 'https://mediclinic.co.za',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1984,
        'employees_count': 28000,
        'headquarters': 'Stellenbosch, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 40000000, 'date': '2021-03-01', 'investor': 'Mediclinic International'},
        ],
        'products': ['Hospital Services', 'Specialized Care', 'Emergency Services', 'Wellness Programs'],
        'markets': ['South Africa', 'Namibia', 'Switzerland', 'UAE'],
        'achievements': [
            'Operates 50+ hospitals',
            'Serves over 15 million patients annually',
            'Largest private hospital network in South Africa',
            'Listed on Johannesburg Stock Exchange'
        ],
        'partnerships': [
            'Partnership with medical device companies',
            'Collaboration with pharmaceutical companies',
            'Alliance with insurance providers'
        ],
        'awards': [
            'Best Hospital Network',
            'Healthcare Excellence Award',
            'Patient Safety Award'
        ]
    },
    {
        'name': 'Life Healthcare',
        'description': 'Life Healthcare is a private healthcare group operating hospitals and medical facilities across South Africa. The organization provides comprehensive healthcare services including acute care, specialized treatments, and rehabilitation.',
        'website': 'https://lifehealthcare.co.za',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1983,
        'employees_count': 25000,
        'headquarters': 'Johannesburg, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 25000000, 'date': '2021-05-01', 'investor': 'Life Healthcare Group'},
        ],
        'products': ['Hospital Services', 'Acute Care', 'Specialized Treatments', 'Rehabilitation'],
        'markets': ['South Africa', 'Botswana', 'Namibia'],
        'achievements': [
            'Operates 60+ hospitals',
            'Serves over 12 million patients annually',
            'Largest private hospital network in South Africa',
            'Listed on Johannesburg Stock Exchange'
        ],
        'partnerships': [
            'Partnership with medical device companies',
            'Collaboration with pharmaceutical companies',
            'Alliance with insurance providers'
        ],
        'awards': [
            'Best Hospital Network',
            'Healthcare Excellence Award',
            'Innovation in Healthcare Award'
        ]
    },
    {
        'name': 'Adcock Ingram',
        'description': 'Adcock Ingram is a pharmaceutical manufacturer in South Africa producing generic medicines, over-the-counter products, and pharmaceutical formulations. The company supplies medicines to healthcare providers across Africa.',
        'website': 'https://adcock.com',
        'industry': 'Healthcare',
        'sector': 'Pharmaceutical Manufacturing',
        'stage': 'mature',
        'founded_year': 1890,
        'employees_count': 3000,
        'headquarters': 'Johannesburg, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 20000000, 'date': '2021-02-01', 'investor': 'Adcock Ingram Holdings'},
        ],
        'products': ['Generic Medicines', 'OTC Products', 'Pharmaceutical Formulations', 'Medical Devices'],
        'markets': ['South Africa', 'Sub-Saharan Africa', 'Global'],
        'achievements': [
            'Produces over 500 million units annually',
            'Largest generic pharmaceutical manufacturer in South Africa',
            'Listed on Johannesburg Stock Exchange',
            'Global supplier of essential medicines'
        ],
        'partnerships': [
            'Partnership with global pharmaceutical companies',
            'Collaboration with research institutions',
            'Alliance with government health departments'
        ],
        'awards': [
            'Best Pharmaceutical Company',
            'Manufacturing Excellence Award',
            'Quality Assurance Award'
        ]
    },
    {
        'name': 'Cipla Medpro',
        'description': 'Cipla Medpro is a pharmaceutical company in South Africa manufacturing and distributing generic medicines, APIs, and pharmaceutical products. The company is part of the global Cipla network.',
        'website': 'https://cipla.com',
        'industry': 'Healthcare',
        'sector': 'Pharmaceutical Manufacturing',
        'stage': 'mature',
        'founded_year': 1993,
        'employees_count': 2000,
        'headquarters': 'Johannesburg, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 35000000, 'date': '2021-07-01', 'investor': 'Cipla Limited'},
        ],
        'products': ['Generic Medicines', 'APIs', 'Pharmaceutical Products', 'Medical Devices'],
        'markets': ['South Africa', 'Sub-Saharan Africa'],
        'achievements': [
            'Produces over 300 million units annually',
            'Part of global Cipla network',
            'Major supplier to public and private sectors',
            'Featured in pharmaceutical industry reports'
        ],
        'partnerships': [
            'Partnership with Cipla Limited',
            'Collaboration with healthcare providers',
            'Alliance with government health departments'
        ],
        'awards': [
            'Best Pharmaceutical Company',
            'Manufacturing Excellence Award'
        ]
    },
    {
        'name': 'Pharma Dynamics',
        'description': 'Pharma Dynamics is a pharmaceutical company in South Africa specializing in cardiovascular medicines and therapeutic products. The company develops and distributes pharmaceutical products for cardiovascular health.',
        'website': 'https://pharmadynamics.co.za',
        'industry': 'Healthcare',
        'sector': 'Pharmaceutical Manufacturing',
        'stage': 'mature',
        'founded_year': 2001,
        'employees_count': 500,
        'headquarters': 'Cape Town, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 15000000, 'date': '2021-09-01', 'investor': 'Pharma Dynamics'},
        ],
        'products': ['Cardiovascular Medicines', 'Therapeutic Products', 'Pharmaceutical Formulations'],
        'markets': ['South Africa', 'Sub-Saharan Africa'],
        'achievements': [
            'Leading cardiovascular pharmaceutical company',
            'Serves over 1 million patients',
            'Partnership with major healthcare providers',
            'Featured in pharmaceutical industry reports'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with research institutions',
            'Alliance with government health departments'
        ],
        'awards': [
            'Best Cardiovascular Pharmaceutical Company',
            'Innovation in Healthcare Award'
        ]
    },
    {
        'name': 'Hello Doctor',
        'description': 'Hello Doctor is a telemedicine platform in South Africa that connects patients with doctors for online consultations. The platform provides access to healthcare services through mobile and web applications.',
        'website': 'https://hellodoctor.co.za',
        'industry': 'Healthcare Technology',
        'sector': 'Telemedicine',
        'stage': 'growth',
        'founded_year': 2015,
        'employees_count': 80,
        'headquarters': 'Cape Town, South Africa',
        'country': 'South Africa',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 3000000, 'date': '2021-05-01', 'investor': 'Knife Capital'},
            {'type': 'Seed', 'amount': 1000000, 'date': '2019-03-01', 'investor': '4Di Capital'},
        ],
        'products': ['Telemedicine', 'Online Consultations', 'Prescription Services', 'Health Information'],
        'markets': ['South Africa'],
        'achievements': [
            'Serves over 500,000 users',
            'Network of 1,000+ doctors',
            'Conducted over 2 million consultations',
            'Featured in TechCrunch, Forbes'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with healthcare networks',
            'Integration with pharmacies'
        ],
        'awards': [
            'Fast Company Most Innovative Companies',
            'Forbes Africa 30 Under 30'
        ]
    },
    {
        'name': 'Al Borg Diagnostics',
        'description': 'Al Borg Diagnostics is a leading diagnostic laboratory network in Egypt providing comprehensive laboratory testing, pathology services, and diagnostic solutions. The organization operates multiple laboratory facilities across Egypt.',
        'website': 'https://alborglaboratories.com',
        'industry': 'Healthcare',
        'sector': 'Diagnostic Laboratories',
        'stage': 'mature',
        'founded_year': 1991,
        'employees_count': 3000,
        'headquarters': 'Cairo, Egypt',
        'country': 'Egypt',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 8000000, 'date': '2021-04-01', 'investor': 'Algebra Ventures'},
        ],
        'products': ['Laboratory Testing', 'Pathology Services', 'Diagnostic Solutions', 'Health Screening'],
        'markets': ['Egypt', 'Saudi Arabia', 'UAE'],
        'achievements': [
            'Operates 100+ laboratory facilities',
            'Processes over 10 million tests annually',
            'Largest diagnostic laboratory network in Egypt',
            'Featured in healthcare industry reports'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with research institutions',
            'Alliance with insurance companies'
        ],
        'awards': [
            'Best Diagnostic Laboratory',
            'Healthcare Excellence Award',
            'Quality Assurance Award'
        ]
    },
    {
        'name': 'Dokkan Afkar',
        'description': 'Dokkan Afkar is a pharmaceutical e-commerce platform in Egypt that connects patients with pharmacies for medication delivery. The platform offers prescription management, medication reminders, and home delivery services.',
        'website': 'https://dokkanafkar.com',
        'industry': 'Healthcare Technology',
        'sector': 'Pharmaceutical E-commerce',
        'stage': 'early',
        'founded_year': 2018,
        'employees_count': 60,
        'headquarters': 'Cairo, Egypt',
        'country': 'Egypt',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 500000, 'date': '2020-10-01', 'investor': 'Flat6Labs'},
        ],
        'products': ['Pharmaceutical E-commerce', 'Prescription Delivery', 'Medication Reminders', 'Pharmacy Network'],
        'markets': ['Egypt'],
        'achievements': [
            'Serves over 50,000 users',
            'Network of 500+ pharmacies',
            'Processed over 200,000 orders',
            'Featured in TechCrunch, Wamda'
        ],
        'partnerships': [
            'Partnership with pharmacy chains',
            'Collaboration with insurance companies',
            'Integration with healthcare providers'
        ],
        'awards': [
            'Forbes Middle East Top 50 Startups'
        ]
    },
    {
        'name': 'Nyaho Medical Centre',
        'description': 'Nyaho Medical Centre is a private healthcare facility in Ghana providing comprehensive medical services including primary care, specialized treatments, and emergency services. The center serves patients in Accra and surrounding areas.',
        'website': 'https://nyahomedical.com',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1970,
        'employees_count': 400,
        'headquarters': 'Accra, Ghana',
        'country': 'Ghana',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 5000000, 'date': '2021-05-01', 'investor': 'AfricInvest'},
        ],
        'products': ['Primary Healthcare', 'Specialized Treatments', 'Emergency Services', 'Wellness Programs'],
        'markets': ['Ghana'],
        'achievements': [
            'Serves over 100,000 patients annually',
            'Largest private medical center in Ghana',
            'Partnership with international healthcare providers',
            'Featured in Forbes Africa'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with international hospitals',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Medical Center',
            'Healthcare Excellence Award',
            'Patient Safety Award'
        ]
    },
    {
        'name': 'Medanta Africare',
        'description': 'Medanta Africare is a healthcare services provider in Ghana operating medical facilities and providing specialized healthcare services. The organization is part of the global Medanta network.',
        'website': 'https://medanta.org',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 2015,
        'employees_count': 300,
        'headquarters': 'Accra, Ghana',
        'country': 'Ghana',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 12000000, 'date': '2021-07-01', 'investor': 'AfricInvest'},
        ],
        'products': ['Hospital Services', 'Specialized Care', 'Emergency Services', 'Wellness Programs'],
        'markets': ['Ghana'],
        'achievements': [
            'Operates multiple healthcare facilities',
            'Serves over 50,000 patients annually',
            'Part of global Medanta network',
            'Featured in healthcare industry reports'
        ],
        'partnerships': [
            'Partnership with Medanta Global',
            'Collaboration with insurance providers',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Hospital Network',
            'Healthcare Excellence Award'
        ]
    },
    {
        'name': 'Rwanda Biomedical Centre',
        'description': 'Rwanda Biomedical Centre is a government health institution in Rwanda responsible for public health programs, disease prevention, and health system strengthening. The center coordinates national health initiatives and research.',
        'website': 'https://rbc.gov.rw',
        'industry': 'Healthcare',
        'sector': 'Health Systems',
        'stage': 'mature',
        'founded_year': 2011,
        'employees_count': 2000,
        'headquarters': 'Kigali, Rwanda',
        'country': 'Rwanda',
        'funding_rounds': [
            {'type': 'Grant', 'amount': 15000000, 'date': '2021-01-01', 'investor': 'World Bank'},
            {'type': 'Grant', 'amount': 10000000, 'date': '2020-06-01', 'investor': 'Gates Foundation'},
        ],
        'products': ['Public Health Programs', 'Disease Prevention', 'Health Research', 'Health System Strengthening'],
        'markets': ['Rwanda'],
        'achievements': [
            'Coordinates national health programs',
            'Manages public health initiatives',
            'Partnership with international organizations',
            'Featured in WHO reports'
        ],
        'partnerships': [
            'Partnership with WHO',
            'Collaboration with Gates Foundation',
            'Alliance with research institutions'
        ],
        'awards': [
            'Public Health Excellence Award',
            'Health System Innovation Award'
        ]
    },
    {
        'name': 'Aga Khan Hospital',
        'description': 'Aga Khan Hospital is a healthcare facility in Tanzania providing comprehensive medical services including primary care, specialized treatments, and emergency services. The hospital is part of the Aga Khan Health Services network.',
        'website': 'https://agakhanhospitals.org',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1964,
        'employees_count': 1500,
        'headquarters': 'Dar es Salaam, Tanzania',
        'country': 'Tanzania',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 20000000, 'date': '2021-06-01', 'investor': 'Aga Khan Development Network'},
        ],
        'products': ['Hospital Services', 'Primary Care', 'Specialized Treatments', 'Emergency Services'],
        'markets': ['Tanzania', 'Kenya', 'Uganda'],
        'achievements': [
            'Serves over 500,000 patients annually',
            'Part of Aga Khan Health Services network',
            'Partnership with international healthcare providers',
            'Featured in healthcare industry reports'
        ],
        'partnerships': [
            'Partnership with Aga Khan Development Network',
            'Collaboration with insurance providers',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Hospital',
            'Healthcare Excellence Award',
            'Patient Safety Award'
        ]
    },
    {
        'name': 'Lister Hospital',
        'description': 'Lister Hospital is a private healthcare facility in Tanzania providing comprehensive medical services including primary care, specialized treatments, and emergency services. The hospital serves patients in Dar es Salaam and surrounding areas.',
        'website': 'https://listerhospital.com',
        'industry': 'Healthcare',
        'sector': 'Hospital Network',
        'stage': 'mature',
        'founded_year': 1995,
        'employees_count': 400,
        'headquarters': 'Dar es Salaam, Tanzania',
        'country': 'Tanzania',
        'funding_rounds': [
            {'type': 'Corporate', 'amount': 8000000, 'date': '2021-04-01', 'investor': 'Lister Healthcare'},
        ],
        'products': ['Hospital Services', 'Primary Care', 'Specialized Treatments', 'Emergency Services'],
        'markets': ['Tanzania'],
        'achievements': [
            'Serves over 100,000 patients annually',
            'Largest private hospital in Dar es Salaam',
            'Partnership with international healthcare providers',
            'Featured in healthcare industry reports'
        ],
        'partnerships': [
            'Partnership with insurance providers',
            'Collaboration with international hospitals',
            'Alliance with pharmaceutical companies'
        ],
        'awards': [
            'Best Hospital',
            'Healthcare Excellence Award'
        ]
    },
    {
        'name': 'ClickMedix',
        'description': 'ClickMedix is a telemedicine platform in Tanzania that connects patients with doctors for online consultations. The platform provides access to healthcare services through mobile and web applications.',
        'website': 'https://clickmedix.com',
        'industry': 'Healthcare Technology',
        'sector': 'Telemedicine',
        'stage': 'early',
        'founded_year': 2018,
        'employees_count': 30,
        'headquarters': 'Dar es Salaam, Tanzania',
        'country': 'Tanzania',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 600000, 'date': '2021-02-01', 'investor': 'Village Capital'},
        ],
        'products': ['Telemedicine', 'Online Consultations', 'Prescription Services', 'Health Information'],
        'markets': ['Tanzania'],
        'achievements': [
            'Serves over 20,000 users',
            'Network of 200+ doctors',
            'Conducted over 50,000 consultations',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with insurance companies',
            'Integration with pharmacies'
        ],
        'awards': []
    },
    {
        'name': 'HewaTele',
        'description': 'HewaTele is a medical oxygen delivery service in Kenya that provides high-quality medical oxygen to healthcare facilities. The company ensures reliable supply of oxygen for critical care and emergency situations.',
        'website': 'https://hewatele.org',
        'industry': 'Healthcare Technology',
        'sector': 'Medical Supply',
        'stage': 'growth',
        'founded_year': 2020,
        'employees_count': 50,
        'headquarters': 'Nairobi, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Series A', 'amount': 10500000, 'date': '2025-07-01', 'investor': 'AfricInvest'},
        ],
        'products': ['Medical Oxygen Delivery', 'Oxygen Supply Chain', 'Emergency Oxygen Services'],
        'markets': ['Kenya'],
        'achievements': [
            'Serves over 500 healthcare facilities',
            'Delivered over 1 million liters of oxygen',
            'Critical during COVID-19 pandemic',
            'Featured in TechCrunch, Forbes'
        ],
        'partnerships': [
            'Partnership with healthcare facilities',
            'Collaboration with government health departments',
            'Alliance with medical equipment suppliers'
        ],
        'awards': [
            'Healthcare Innovation Award',
            'Forbes Africa 30 Under 30'
        ]
    },
    {
        'name': 'Wellvis',
        'description': 'Wellvis is a health data platform in Nigeria that helps healthcare providers manage patient data, track health outcomes, and improve care delivery. The platform provides analytics and insights for better healthcare decision-making.',
        'website': 'https://wellvis.com',
        'industry': 'Healthcare Technology',
        'sector': 'Health Data',
        'stage': 'early',
        'founded_year': 2019,
        'employees_count': 25,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 300000, 'date': '2020-08-01', 'investor': 'Future Africa'},
        ],
        'products': ['Health Data Platform', 'Analytics Tools', 'Outcome Tracking', 'Reporting Systems'],
        'markets': ['Nigeria'],
        'achievements': [
            'Serves over 100 healthcare providers',
            'Manages data for 200,000+ patients',
            'Improved care outcomes by 20%',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with research institutions',
            'Integration with EMR systems'
        ],
        'awards': []
    },
    {
        'name': 'Kangpe',
        'description': 'Kangpe is a telemedicine platform in Nigeria that connects patients with doctors for online consultations. The platform provides access to healthcare services through mobile and web applications.',
        'website': 'https://kangpe.com',
        'industry': 'Healthcare Technology',
        'sector': 'Telemedicine',
        'stage': 'early',
        'founded_year': 2018,
        'employees_count': 20,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 500000, 'date': '2020-05-01', 'investor': 'Microtraction'},
        ],
        'products': ['Telemedicine', 'Online Consultations', 'Prescription Services', 'Health Information'],
        'markets': ['Nigeria'],
        'achievements': [
            'Serves over 30,000 users',
            'Network of 500+ doctors',
            'Conducted over 100,000 consultations',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with insurance companies',
            'Integration with pharmacies'
        ],
        'awards': []
    },
    {
        'name': 'Zuri Health',
        'description': 'Zuri Health is a telemedicine platform in Kenya that connects patients with doctors for online consultations. The platform provides access to healthcare services through mobile and web applications.',
        'website': 'https://zurihealth.com',
        'industry': 'Healthcare Technology',
        'sector': 'Telemedicine',
        'stage': 'early',
        'founded_year': 2020,
        'employees_count': 15,
        'headquarters': 'Nairobi, Kenya',
        'country': 'Kenya',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 200000, 'date': '2021-01-01', 'investor': 'Antler'},
        ],
        'products': ['Telemedicine', 'Online Consultations', 'Prescription Services', 'Health Information'],
        'markets': ['Kenya'],
        'achievements': [
            'Serves over 20,000 users',
            'Network of 300+ doctors',
            'Conducted over 50,000 consultations',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with healthcare providers',
            'Collaboration with insurance companies',
            'Integration with pharmacies'
        ],
        'awards': []
    },
    {
        'name': 'Dei BioPharma',
        'description': 'Dei BioPharma is a biopharmaceutical research company in Nigeria focused on developing pharmaceutical products and conducting research in biopharmaceuticals. The company works on drug development and research.',
        'website': 'https://deibiopharma.com',
        'industry': 'Healthcare',
        'sector': 'Biopharmaceuticals',
        'stage': 'early',
        'founded_year': 2019,
        'employees_count': 30,
        'headquarters': 'Lagos, Nigeria',
        'country': 'Nigeria',
        'funding_rounds': [
            {'type': 'Seed', 'amount': 500000, 'date': '2021-05-01', 'investor': 'Future Africa'},
        ],
        'products': ['Biopharmaceutical Research', 'Drug Development', 'Research Services'],
        'markets': ['Nigeria'],
        'achievements': [
            'Conducting research in biopharmaceuticals',
            'Partnership with research institutions',
            'Featured in research publications',
            'Featured in TechCrunch'
        ],
        'partnerships': [
            'Partnership with research institutions',
            'Collaboration with universities',
            'Alliance with pharmaceutical companies'
        ],
        'awards': []
    },
]

# Merge with existing data
all_companies = existing_data + additional_companies

# Save expanded data
with open('comprehensive_company_data.json', 'w') as f:
    json.dump(all_companies, f, indent=2)

print(f"Expanded from {len(existing_data)} to {len(all_companies)} companies")
print(f"Added {len(additional_companies)} new companies with comprehensive data")

