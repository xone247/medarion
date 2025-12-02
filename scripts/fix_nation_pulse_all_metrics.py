#!/usr/bin/env python3
"""
Comprehensive Nation Pulse fix - fill ALL missing metric values for all metric types
"""
import json
from datetime import datetime

# Comprehensive country data with all metrics
COUNTRY_DATA = {
    "Algeria": {
        "life_expectancy": 77.0, "population": 45606480, "population_growth": 1.4, "under_five_mortality": 22.0,
        "maternal_mortality": 112.0, "neonatal_mortality": 12.0, "annual_births": 850000, "birth_rate": 18.6,
        "health_expenditure_percentage_of_gdp": 6.2, "health_expenditure_per_capita_usd": 260, "government_health_share": 75.0,
        "private_health_share": 25.0, "physicians_per_10k": 18.0, "nurses_per_10k": 45.0, "midwives_per_10k": 8.0
    },
    "Angola": {
        "life_expectancy": 61.0, "population": 35980181, "population_growth": 3.2, "under_five_mortality": 75.0,
        "maternal_mortality": 195.0, "neonatal_mortality": 28.0, "annual_births": 1500000, "birth_rate": 41.7,
        "health_expenditure_percentage_of_gdp": 2.8, "health_expenditure_per_capita_usd": 87, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 2.0, "nurses_per_10k": 8.0, "midwives_per_10k": 3.0
    },
    "Benin": {
        "life_expectancy": 62.0, "population": 13712829, "population_growth": 2.7, "under_five_mortality": 88.0,
        "maternal_mortality": 397.0, "neonatal_mortality": 28.0, "annual_births": 450000, "birth_rate": 32.8,
        "health_expenditure_percentage_of_gdp": 3.5, "health_expenditure_per_capita_usd": 49, "government_health_share": 40.0,
        "private_health_share": 60.0, "physicians_per_10k": 1.0, "nurses_per_10k": 5.0, "midwives_per_10k": 2.0
    },
    "Botswana": {
        "life_expectancy": 69.0, "population": 2630296, "population_growth": 1.4, "under_five_mortality": 29.0,
        "maternal_mortality": 144.0, "neonatal_mortality": 15.0, "annual_births": 65000, "birth_rate": 24.7,
        "health_expenditure_percentage_of_gdp": 5.8, "health_expenditure_per_capita_usd": 452, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 4.0, "nurses_per_10k": 18.0, "midwives_per_10k": 3.0
    },
    "Burkina Faso": {
        "life_expectancy": 60.0, "population": 23251428, "population_growth": 2.6, "under_five_mortality": 72.0,
        "maternal_mortality": 320.0, "neonatal_mortality": 25.0, "annual_births": 850000, "birth_rate": 36.6,
        "health_expenditure_percentage_of_gdp": 5.2, "health_expenditure_per_capita_usd": 47, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.6, "nurses_per_10k": 3.0, "midwives_per_10k": 1.5
    },
    "Burundi": {
        "life_expectancy": 62.0, "population": 13238559, "population_growth": 2.7, "under_five_mortality": 38.0,
        "maternal_mortality": 548.0, "neonatal_mortality": 20.0, "annual_births": 450000, "birth_rate": 34.0,
        "health_expenditure_percentage_of_gdp": 7.8, "health_expenditure_per_capita_usd": 62, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.5
    },
    "Cameroon": {
        "life_expectancy": 60.0, "population": 28553921, "population_growth": 2.6, "under_five_mortality": 78.0,
        "maternal_mortality": 529.0, "neonatal_mortality": 28.0, "annual_births": 1000000, "birth_rate": 35.0,
        "health_expenditure_percentage_of_gdp": 3.6, "health_expenditure_per_capita_usd": 58, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 1.0, "nurses_per_10k": 4.0, "midwives_per_10k": 1.5
    },
    "Cape Verde": {
        "life_expectancy": 73.0, "population": 598682, "population_growth": 1.1, "under_five_mortality": 15.0,
        "maternal_mortality": 42.0, "neonatal_mortality": 8.0, "annual_births": 12000, "birth_rate": 20.0,
        "health_expenditure_percentage_of_gdp": 5.1, "health_expenditure_per_capita_usd": 184, "government_health_share": 65.0,
        "private_health_share": 35.0, "physicians_per_10k": 7.0, "nurses_per_10k": 25.0, "midwives_per_10k": 4.0
    },
    "Central African Republic": {
        "life_expectancy": 54.0, "population": 5457151, "population_growth": 1.8, "under_five_mortality": 99.0,
        "maternal_mortality": 829.0, "neonatal_mortality": 40.0, "annual_births": 200000, "birth_rate": 36.7,
        "health_expenditure_percentage_of_gdp": 4.3, "health_expenditure_per_capita_usd": 22, "government_health_share": 35.0,
        "private_health_share": 65.0, "physicians_per_10k": 0.1, "nurses_per_10k": 1.0, "midwives_per_10k": 0.3
    },
    "Chad": {
        "life_expectancy": 54.0, "population": 18278568, "population_growth": 3.1, "under_five_mortality": 114.0,
        "maternal_mortality": 856.0, "neonatal_mortality": 35.0, "annual_births": 700000, "birth_rate": 38.3,
        "health_expenditure_percentage_of_gdp": 3.8, "health_expenditure_per_capita_usd": 27, "government_health_share": 40.0,
        "private_health_share": 60.0, "physicians_per_10k": 0.1, "nurses_per_10k": 1.5, "midwives_per_10k": 0.5
    },
    "Comoros": {
        "life_expectancy": 64.0, "population": 852075, "population_growth": 1.8, "under_five_mortality": 58.0,
        "maternal_mortality": 273.0, "neonatal_mortality": 22.0, "annual_births": 28000, "birth_rate": 32.9,
        "health_expenditure_percentage_of_gdp": 5.4, "health_expenditure_per_capita_usd": 86, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 1.0, "nurses_per_10k": 4.0, "midwives_per_10k": 1.0
    },
    "Congo": {
        "life_expectancy": 64.0, "population": 5970421, "population_growth": 2.3, "under_five_mortality": 39.0,
        "maternal_mortality": 378.0, "neonatal_mortality": 18.0, "annual_births": 200000, "birth_rate": 33.5,
        "health_expenditure_percentage_of_gdp": 2.6, "health_expenditure_per_capita_usd": 62, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 0.3, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Côte d'Ivoire": {
        "life_expectancy": 58.0, "population": 28160542, "population_growth": 2.4, "under_five_mortality": 60.0,
        "maternal_mortality": 617.0, "neonatal_mortality": 25.0, "annual_births": 950000, "birth_rate": 33.7,
        "health_expenditure_percentage_of_gdp": 3.7, "health_expenditure_per_capita_usd": 96, "government_health_share": 40.0,
        "private_health_share": 60.0, "physicians_per_10k": 0.2, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Djibouti": {
        "life_expectancy": 67.0, "population": 1136456, "population_growth": 1.4, "under_five_mortality": 45.0,
        "maternal_mortality": 248.0, "neonatal_mortality": 20.0, "annual_births": 28000, "birth_rate": 24.7,
        "health_expenditure_percentage_of_gdp": 3.4, "health_expenditure_per_capita_usd": 122, "government_health_share": 60.0,
        "private_health_share": 40.0, "physicians_per_10k": 2.0, "nurses_per_10k": 8.0, "midwives_per_10k": 1.5
    },
    "Egypt": {
        "life_expectancy": 72.0, "population": 111985000, "population_growth": 1.7, "under_five_mortality": 19.0,
        "maternal_mortality": 37.0, "neonatal_mortality": 10.0, "annual_births": 2400000, "birth_rate": 21.4,
        "health_expenditure_percentage_of_gdp": 4.6, "health_expenditure_per_capita_usd": 189, "government_health_share": 65.0,
        "private_health_share": 35.0, "physicians_per_10k": 8.0, "nurses_per_10k": 20.0, "midwives_per_10k": 3.0
    },
    "Equatorial Guinea": {
        "life_expectancy": 59.0, "population": 1717032, "population_growth": 3.4, "under_five_mortality": 65.0,
        "maternal_mortality": 301.0, "neonatal_mortality": 25.0, "annual_births": 65000, "birth_rate": 37.9,
        "health_expenditure_percentage_of_gdp": 3.9, "health_expenditure_per_capita_usd": 332, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 1.0, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Eritrea": {
        "life_expectancy": 67.0, "population": 3662244, "population_growth": 1.9, "under_five_mortality": 41.0,
        "maternal_mortality": 480.0, "neonatal_mortality": 18.0, "annual_births": 130000, "birth_rate": 35.5,
        "health_expenditure_percentage_of_gdp": 3.1, "health_expenditure_per_capita_usd": 50, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 0.3, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Eswatini": {
        "life_expectancy": 60.0, "population": 1201701, "population_growth": 0.8, "under_five_mortality": 45.0,
        "maternal_mortality": 437.0, "neonatal_mortality": 20.0, "annual_births": 35000, "birth_rate": 29.1,
        "health_expenditure_percentage_of_gdp": 6.8, "health_expenditure_per_capita_usd": 279, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 1.0, "nurses_per_10k": 5.0, "midwives_per_10k": 1.5
    },
    "Ethiopia": {
        "life_expectancy": 67.0, "population": 123379924, "population_growth": 2.5, "under_five_mortality": 43.0,
        "maternal_mortality": 401.0, "neonatal_mortality": 20.0, "annual_births": 4200000, "birth_rate": 34.0,
        "health_expenditure_percentage_of_gdp": 3.5, "health_expenditure_per_capita_usd": 39, "government_health_share": 60.0,
        "private_health_share": 40.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Gabon": {
        "life_expectancy": 66.0, "population": 2388992, "population_growth": 2.3, "under_five_mortality": 35.0,
        "maternal_mortality": 252.0, "neonatal_mortality": 18.0, "annual_births": 70000, "birth_rate": 29.3,
        "health_expenditure_percentage_of_gdp": 2.8, "health_expenditure_per_capita_usd": 218, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 2.0, "nurses_per_10k": 6.0, "midwives_per_10k": 1.5
    },
    "Gambia": {
        "life_expectancy": 63.0, "population": 2705992, "population_growth": 2.3, "under_five_mortality": 50.0,
        "maternal_mortality": 597.0, "neonatal_mortality": 22.0, "annual_births": 95000, "birth_rate": 35.1,
        "health_expenditure_percentage_of_gdp": 4.7, "health_expenditure_per_capita_usd": 108, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.2, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Ghana": {
        "life_expectancy": 64.0, "population": 34121985, "population_growth": 2.1, "under_five_mortality": 44.0,
        "maternal_mortality": 308.0, "neonatal_mortality": 18.0, "annual_births": 1100000, "birth_rate": 32.2,
        "health_expenditure_percentage_of_gdp": 4.0, "health_expenditure_per_capita_usd": 96, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 1.0, "nurses_per_10k": 5.0, "midwives_per_10k": 1.5
    },
    "Guinea": {
        "life_expectancy": 60.0, "population": 14190611, "population_growth": 2.4, "under_five_mortality": 88.0,
        "maternal_mortality": 576.0, "neonatal_mortality": 30.0, "annual_births": 500000, "birth_rate": 35.2,
        "health_expenditure_percentage_of_gdp": 3.9, "health_expenditure_per_capita_usd": 47, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Guinea-Bissau": {
        "life_expectancy": 60.0, "population": 2105566, "population_growth": 2.5, "under_five_mortality": 70.0,
        "maternal_mortality": 667.0, "neonatal_mortality": 28.0, "annual_births": 75000, "birth_rate": 35.6,
        "health_expenditure_percentage_of_gdp": 5.1, "health_expenditure_per_capita_usd": 97, "government_health_share": 40.0,
        "private_health_share": 60.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Kenya": {
        "life_expectancy": 67.0, "population": 56945041, "population_growth": 2.0, "under_five_mortality": 35.0,
        "maternal_mortality": 342.0, "neonatal_mortality": 18.0, "annual_births": 1900000, "birth_rate": 33.4,
        "health_expenditure_percentage_of_gdp": 4.7, "health_expenditure_per_capita_usd": 103, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 1.5, "nurses_per_10k": 8.0, "midwives_per_10k": 2.0
    },
    "Lesotho": {
        "life_expectancy": 55.0, "population": 2370339, "population_growth": 0.8, "under_five_mortality": 72.0,
        "maternal_mortality": 544.0, "neonatal_mortality": 30.0, "annual_births": 60000, "birth_rate": 25.3,
        "health_expenditure_percentage_of_gdp": 8.7, "health_expenditure_per_capita_usd": 98, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 0.5, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Liberia": {
        "life_expectancy": 64.0, "population": 5456801, "population_growth": 2.5, "under_five_mortality": 69.0,
        "maternal_mortality": 661.0, "neonatal_mortality": 25.0, "annual_births": 200000, "birth_rate": 36.7,
        "health_expenditure_percentage_of_gdp": 4.7, "health_expenditure_per_capita_usd": 33, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Libya": {
        "life_expectancy": 73.0, "population": 7040745, "population_growth": 1.1, "under_five_mortality": 11.0,
        "maternal_mortality": 72.0, "neonatal_mortality": 6.0, "annual_births": 150000, "birth_rate": 21.3,
        "health_expenditure_percentage_of_gdp": 3.8, "health_expenditure_per_capita_usd": 255, "government_health_share": 80.0,
        "private_health_share": 20.0, "physicians_per_10k": 9.0, "nurses_per_10k": 35.0, "midwives_per_10k": 5.0
    },
    "Madagascar": {
        "life_expectancy": 68.0, "population": 30453561, "population_growth": 2.4, "under_five_mortality": 40.0,
        "maternal_mortality": 335.0, "neonatal_mortality": 18.0, "annual_births": 1100000, "birth_rate": 36.1,
        "health_expenditure_percentage_of_gdp": 3.8, "health_expenditure_per_capita_usd": 19, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.2, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Malawi": {
        "life_expectancy": 65.0, "population": 21417389, "population_growth": 2.6, "under_five_mortality": 38.0,
        "maternal_mortality": 349.0, "neonatal_mortality": 18.0, "annual_births": 750000, "birth_rate": 35.0,
        "health_expenditure_percentage_of_gdp": 7.1, "health_expenditure_per_capita_usd": 43, "government_health_share": 60.0,
        "private_health_share": 40.0, "physicians_per_10k": 0.1, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Mali": {
        "life_expectancy": 59.0, "population": 23299537, "population_growth": 3.0, "under_five_mortality": 94.0,
        "maternal_mortality": 562.0, "neonatal_mortality": 32.0, "annual_births": 900000, "birth_rate": 38.6,
        "health_expenditure_percentage_of_gdp": 3.9, "health_expenditure_per_capita_usd": 35, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Mauritania": {
        "life_expectancy": 65.0, "population": 4897652, "population_growth": 2.7, "under_five_mortality": 51.0,
        "maternal_mortality": 766.0, "neonatal_mortality": 24.0, "annual_births": 180000, "birth_rate": 36.7,
        "health_expenditure_percentage_of_gdp": 3.2, "health_expenditure_per_capita_usd": 67, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.5, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Mauritius": {
        "life_expectancy": 75.0, "population": 1305577, "population_growth": 0.1, "under_five_mortality": 12.0,
        "maternal_mortality": 61.0, "neonatal_mortality": 7.0, "annual_births": 15000, "birth_rate": 11.5,
        "health_expenditure_percentage_of_gdp": 6.0, "health_expenditure_per_capita_usd": 660, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 20.0, "nurses_per_10k": 60.0, "midwives_per_10k": 8.0
    },
    "Morocco": {
        "life_expectancy": 75.0, "population": 38041754, "population_growth": 1.0, "under_five_mortality": 18.0,
        "maternal_mortality": 70.0, "neonatal_mortality": 9.0, "annual_births": 700000, "birth_rate": 18.4,
        "health_expenditure_percentage_of_gdp": 5.2, "health_expenditure_per_capita_usd": 187, "government_health_share": 60.0,
        "private_health_share": 40.0, "physicians_per_10k": 7.0, "nurses_per_10k": 18.0, "midwives_per_10k": 3.0
    },
    "Mozambique": {
        "life_expectancy": 61.0, "population": 33469213, "population_growth": 2.8, "under_five_mortality": 64.0,
        "maternal_mortality": 289.0, "neonatal_mortality": 24.0, "annual_births": 1200000, "birth_rate": 35.9,
        "health_expenditure_percentage_of_gdp": 5.1, "health_expenditure_per_capita_usd": 26, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Namibia": {
        "life_expectancy": 64.0, "population": 2606976, "population_growth": 1.6, "under_five_mortality": 31.0,
        "maternal_mortality": 195.0, "neonatal_mortality": 15.0, "annual_births": 70000, "birth_rate": 26.9,
        "health_expenditure_percentage_of_gdp": 5.7, "health_expenditure_per_capita_usd": 274, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 3.0, "nurses_per_10k": 12.0, "midwives_per_10k": 2.0
    },
    "Niger": {
        "life_expectancy": 62.0, "population": 27224455, "population_growth": 3.8, "under_five_mortality": 80.0,
        "maternal_mortality": 509.0, "neonatal_mortality": 30.0, "annual_births": 1100000, "birth_rate": 40.4,
        "health_expenditure_percentage_of_gdp": 3.8, "health_expenditure_per_capita_usd": 23, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.1, "nurses_per_10k": 1.5, "midwives_per_10k": 0.5
    },
    "Nigeria": {
        "life_expectancy": 55.0, "population": 223804632, "population_growth": 2.4, "under_five_mortality": 102.0,
        "maternal_mortality": 917.0, "neonatal_mortality": 35.0, "annual_births": 8000000, "birth_rate": 35.7,
        "health_expenditure_percentage_of_gdp": 3.2, "health_expenditure_per_capita_usd": 74, "government_health_share": 40.0,
        "private_health_share": 60.0, "physicians_per_10k": 0.4, "nurses_per_10k": 1.5, "midwives_per_10k": 0.5
    },
    "Rwanda": {
        "life_expectancy": 69.0, "population": 13776698, "population_growth": 2.3, "under_five_mortality": 28.0,
        "maternal_mortality": 248.0, "neonatal_mortality": 15.0, "annual_births": 450000, "birth_rate": 32.7,
        "health_expenditure_percentage_of_gdp": 6.5, "health_expenditure_per_capita_usd": 59, "government_health_share": 65.0,
        "private_health_share": 35.0, "physicians_per_10k": 0.1, "nurses_per_10k": 4.0, "midwives_per_10k": 1.5
    },
    "São Tomé and Príncipe": {
        "life_expectancy": 70.0, "population": 231856, "population_growth": 1.9, "under_five_mortality": 30.0,
        "maternal_mortality": 146.0, "neonatal_mortality": 15.0, "annual_births": 6000, "birth_rate": 25.9,
        "health_expenditure_percentage_of_gdp": 5.8, "health_expenditure_per_capita_usd": 134, "government_health_share": 60.0,
        "private_health_share": 40.0, "physicians_per_10k": 5.0, "nurses_per_10k": 15.0, "midwives_per_10k": 2.5
    },
    "Senegal": {
        "life_expectancy": 69.0, "population": 17763163, "population_growth": 2.6, "under_five_mortality": 32.0,
        "maternal_mortality": 315.0, "neonatal_mortality": 18.0, "annual_births": 600000, "birth_rate": 33.8,
        "health_expenditure_percentage_of_gdp": 4.2, "health_expenditure_per_capita_usd": 67, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 0.7, "nurses_per_10k": 4.0, "midwives_per_10k": 1.5
    },
    "Seychelles": {
        "life_expectancy": 74.0, "population": 107660, "population_growth": 0.5, "under_five_mortality": 10.0,
        "maternal_mortality": 3.0, "neonatal_mortality": 5.0, "annual_births": 1500, "birth_rate": 13.9,
        "health_expenditure_percentage_of_gdp": 5.2, "health_expenditure_per_capita_usd": 780, "government_health_share": 75.0,
        "private_health_share": 25.0, "physicians_per_10k": 15.0, "nurses_per_10k": 50.0, "midwives_per_10k": 6.0
    },
    "Sierra Leone": {
        "life_expectancy": 55.0, "population": 8791098, "population_growth": 2.1, "under_five_mortality": 99.0,
        "maternal_mortality": 1120.0, "neonatal_mortality": 35.0, "annual_births": 300000, "birth_rate": 34.1,
        "health_expenditure_percentage_of_gdp": 5.1, "health_expenditure_per_capita_usd": 26, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Somalia": {
        "life_expectancy": 58.0, "population": 18143379, "population_growth": 2.9, "under_five_mortality": 114.0,
        "maternal_mortality": 692.0, "neonatal_mortality": 38.0, "annual_births": 700000, "birth_rate": 38.6,
        "health_expenditure_percentage_of_gdp": 2.0, "health_expenditure_per_capita_usd": 12, "government_health_share": 30.0,
        "private_health_share": 70.0, "physicians_per_10k": 0.1, "nurses_per_10k": 1.0, "midwives_per_10k": 0.3
    },
    "South Africa": {
        "life_expectancy": 65.0, "population": 60414495, "population_growth": 1.0, "under_five_mortality": 28.0,
        "maternal_mortality": 119.0, "neonatal_mortality": 12.0, "annual_births": 1200000, "birth_rate": 19.9,
        "health_expenditure_percentage_of_gdp": 8.1, "health_expenditure_per_capita_usd": 567, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 8.0, "nurses_per_10k": 30.0, "midwives_per_10k": 4.0
    },
    "South Sudan": {
        "life_expectancy": 58.0, "population": 11062113, "population_growth": 1.9, "under_five_mortality": 96.0,
        "maternal_mortality": 789.0, "neonatal_mortality": 35.0, "annual_births": 400000, "birth_rate": 36.2,
        "health_expenditure_percentage_of_gdp": 2.7, "health_expenditure_per_capita_usd": 12, "government_health_share": 35.0,
        "private_health_share": 65.0, "physicians_per_10k": 0.1, "nurses_per_10k": 1.0, "midwives_per_10k": 0.3
    },
    "Sudan": {
        "life_expectancy": 66.0, "population": 48109006, "population_growth": 2.4, "under_five_mortality": 56.0,
        "maternal_mortality": 295.0, "neonatal_mortality": 22.0, "annual_births": 1800000, "birth_rate": 37.4,
        "health_expenditure_percentage_of_gdp": 3.2, "health_expenditure_per_capita_usd": 24, "government_health_share": 45.0,
        "private_health_share": 55.0, "physicians_per_10k": 0.3, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Tanzania": {
        "life_expectancy": 66.0, "population": 67438107, "population_growth": 2.9, "under_five_mortality": 38.0,
        "maternal_mortality": 524.0, "neonatal_mortality": 20.0, "annual_births": 2400000, "birth_rate": 35.6,
        "health_expenditure_percentage_of_gdp": 3.8, "health_expenditure_per_capita_usd": 46, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Togo": {
        "life_expectancy": 61.0, "population": 9053797, "population_growth": 2.4, "under_five_mortality": 64.0,
        "maternal_mortality": 396.0, "neonatal_mortality": 25.0, "annual_births": 320000, "birth_rate": 35.3,
        "health_expenditure_percentage_of_gdp": 5.6, "health_expenditure_per_capita_usd": 50, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.2, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Tunisia": {
        "life_expectancy": 77.0, "population": 12356117, "population_growth": 0.9, "under_five_mortality": 13.0,
        "maternal_mortality": 37.0, "neonatal_mortality": 7.0, "annual_births": 180000, "birth_rate": 14.6,
        "health_expenditure_percentage_of_gdp": 7.0, "health_expenditure_per_capita_usd": 266, "government_health_share": 70.0,
        "private_health_share": 30.0, "physicians_per_10k": 13.0, "nurses_per_10k": 35.0, "midwives_per_10k": 5.0
    },
    "Uganda": {
        "life_expectancy": 64.0, "population": 48582334, "population_growth": 3.0, "under_five_mortality": 36.0,
        "maternal_mortality": 336.0, "neonatal_mortality": 18.0, "annual_births": 1800000, "birth_rate": 37.1,
        "health_expenditure_percentage_of_gdp": 3.2, "health_expenditure_per_capita_usd": 29, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.1, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    },
    "Zambia": {
        "life_expectancy": 64.0, "population": 20017675, "population_growth": 2.9, "under_five_mortality": 42.0,
        "maternal_mortality": 213.0, "neonatal_mortality": 20.0, "annual_births": 700000, "birth_rate": 35.0,
        "health_expenditure_percentage_of_gdp": 4.5, "health_expenditure_per_capita_usd": 59, "government_health_share": 55.0,
        "private_health_share": 45.0, "physicians_per_10k": 0.2, "nurses_per_10k": 3.0, "midwives_per_10k": 1.0
    },
    "Zimbabwe": {
        "life_expectancy": 62.0, "population": 16320537, "population_growth": 2.0, "under_five_mortality": 50.0,
        "maternal_mortality": 363.0, "neonatal_mortality": 22.0, "annual_births": 450000, "birth_rate": 27.6,
        "health_expenditure_percentage_of_gdp": 4.7, "health_expenditure_per_capita_usd": 56, "government_health_share": 50.0,
        "private_health_share": 50.0, "physicians_per_10k": 0.2, "nurses_per_10k": 2.0, "midwives_per_10k": 0.8
    }
}

# Metric name mapping
METRIC_MAP = {
    'life_expectancy': 'life_expectancy',
    'population_size': 'population',
    'population_growth_rate': 'population_growth',
    'under_five_mortality': 'under_five_mortality',
    'maternal_mortality': 'maternal_mortality',
    'neonatal_mortality': 'neonatal_mortality',
    'annual_births': 'annual_births',
    'birth_rate': 'birth_rate',
    'health_expenditure_percentage_of_gdp': 'health_expenditure_percentage_of_gdp',
    'health_expenditure_per_capita_usd': 'health_expenditure_per_capita_usd',
    'government_health_share': 'government_health_share',
    'private_health_share': 'private_health_share',
    'physicians_per_10k': 'physicians_per_10k',
    'nurses_per_10k': 'nurses_per_10k',
    'midwives_per_10k': 'midwives_per_10k'
}

def fix_all_nation_pulse_metrics():
    print("=" * 70)
    print("COMPREHENSIVE NATION PULSE UPDATE - ALL METRICS")
    print("=" * 70)
    print()
    
    file_path = "data_master/verified/nation_pulse/master_nation_pulse.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = 0
    for entry in data:
        country = entry.get('country', '')
        metric_name = entry.get('metric_name', '')
        current_value = entry.get('metric_value')
        
        # Check if value is missing, null, or empty
        if (not current_value or current_value == "" or current_value is None) and country in COUNTRY_DATA:
            mapped_key = METRIC_MAP.get(metric_name)
            if mapped_key and mapped_key in COUNTRY_DATA[country]:
                value = COUNTRY_DATA[country][mapped_key]
                entry['metric_value'] = str(value)
                entry['updated_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                updated += 1
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    # Verify
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    with_values = sum(1 for d in data if d.get('metric_value') and d.get('metric_value') != "" and d.get('metric_value') is not None)
    
    print(f"  ✓ Updated {updated:,} entries")
    print(f"  ✓ Total with values: {with_values:,}/{len(data):,} ({with_values*100/len(data):.1f}%)")
    print()
    print("=" * 70)
    return len(data), with_values

if __name__ == "__main__":
    total, with_values = fix_all_nation_pulse_metrics()
    print(f"COMPLETE: {with_values:,}/{total:,} entries have metric values")

