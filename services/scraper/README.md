# Clean Scraper Project for AI Training

This project is consolidated to focus on scraping text content and organizing it into training data.

## Project Structure

```
├── scraper/
│   ├── scrape_only_v3.py      # Main scraper (uses Oxylabs; text-only, no media)
│   └── targets.yaml           # Target websites configuration
├── training_data/             # Organized training data outputs
├── output/                    # Raw scraped files (.html, .txt, .json)
├── logs/                      # Log files
├── run_continuous_scraper.py  # Continuous runner (auto restarts; periodic organizing)
├── organize_training_data.py  # Organizes scraped data into training JSONs
├── oxylabs_config.yaml        # Oxylabs credentials and API URL
└── requirements.txt           # Python dependencies
```

## Quick Start (Windows Terminal)

1) Install dependencies
```bash
python -m pip install -r requirements.txt
```

2) Configure
- Edit `scraper/targets.yaml` to list sites to scrape
- Ensure `oxylabs_config.yaml` has your `username`/`password`

3) Run continuous scraping (runs until you stop it)
```bash
python run_continuous_scraper.py start
```
- Stop anytime with Ctrl+C. It will shut down gracefully; data organization is manual (run it when you want).

4) Check outputs
- Raw scraped: `output/scraped_data/`
- Organized training: `training_data/organized_scraped_data.json` and `training_data/scraped_<category>_data.json`
- Logs: `logs/continuous_scraper.log`, `logs/training_data_organization.log`

## Notes
- Media and documents are disabled by default; the scraper collects text and HTML only.
- Oxylabs credentials are read from `oxylabs_config.yaml`.
- Organization is manual-only. Run it when you want:
```bash
python organize_training_data.py
``` 