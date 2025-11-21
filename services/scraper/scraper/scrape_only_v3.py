#!/usr/bin/env python3
"""
Scrape-Only Smart Scraper v3 - For large-scale data collection (NO AI/Ollama/Mistral integration)
"""

import os
import sys
import time
import json
import signal
import threading
import requests
import cloudscraper
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import yaml
import pickle
from pathlib import Path
import logging
from typing import Dict, List, Optional, Tuple, Set
import hashlib
import gzip
import shutil
import re
import argparse
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor, as_completed
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn, TimeRemainingColumn, TaskProgressColumn
from rich.console import Console

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/scraper_v3.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScrapeOnlySmartScraperV3:
    def __init__(self, config_file: str = 'scraper/targets.yaml', fast_mode: bool = False, concurrency: Optional[int] = None, target_concurrency: Optional[int] = None, fresh: bool = False):
        self.config_file = config_file
        self.fast_mode = fast_mode
        self.targets = self.load_targets()
        self.session = self._create_session()
        self.scraper = cloudscraper.create_scraper()
        
        # Oxylabs configuration
        self.oxylabs_config = self.load_oxylabs_config()
        self.oxylabs_enabled = self.oxylabs_config.get('enabled', True)
        self.oxylabs_username = self.oxylabs_config.get('username', '')
        self.oxylabs_password = self.oxylabs_config.get('password', '')
        self.oxylabs_api_url = self.oxylabs_config.get('api_url', 'https://realtime.oxylabs.io/v1/queries')
        self.max_concurrent = self.oxylabs_config.get('max_concurrent', 5)
        if concurrency and concurrency > 0:
            self.max_concurrent = concurrency
        # Fast mode Oxylabs tuning
        self.oxylabs_render_js = True
        self.oxylabs_wait_ms = 5000
        
        # Media configuration
        self.download_media_enabled = False
        
        # Document configuration
        self.download_documents_enabled = True
        self.allowed_doc_extensions = ['.pdf']
        self.max_document_size_mb = 25
        self.max_docs_per_site = 150
        self.downloaded_doc_hashes: Set[str] = set()
        
        # Crawl policy (best practices)
        self.same_domain_only = True
        self.max_depth = 2
        self.max_pages_per_site = 300
        self.min_text_length_chars = 300
        self.max_pagination_pages = 50
        
        # State management
        self.state_file = 'scraper_state_v3.pkl'
        self.checkpoint_file = 'scraper_checkpoint_v3.json'
        self.data_size_file = 'data_size_tracker.json'
        self.state_lock = threading.Lock()
        self.targets_progress: Dict[str, Dict] = {}
        self.completed_targets: Set[str] = set()
        
        # Top-level concurrency across multiple sites
        self.target_max_concurrent = target_concurrency if (target_concurrency and target_concurrency > 0) else 3
        
        # Configuration
        self.max_data_size_gb = None  # Unlimited data per run
        self.pause_duration = 300  # 5 minutes pause between runs
        self.max_retries = 3
        self.connection_timeout = 30
        self.request_delay = 2  # Delay between requests
        
        # Apply fast mode overrides
        if self.fast_mode:
            self.request_delay = 0
            self.connection_timeout = 20
            self.download_documents_enabled = False
            self.max_pages_per_site = 1000
            self.max_pagination_pages = 200
            # Use faster Oxylabs parameters
            self.oxylabs_render_js = False
            self.oxylabs_wait_ms = 1000
        
        # Runtime state
        self.current_run_data_size = 0
        self.total_data_size = 0
        self.processed_urls = set()
        self.failed_urls = set()
        self.paused = False
        self.should_stop = False
        
        # Fresh start optionally clears state
        if fresh:
            try:
                for p in [self.state_file, self.checkpoint_file, self.data_size_file]:
                    if os.path.exists(p):
                        os.remove(p)
            except Exception:
                pass
        
        # Load previous state
        self.load_state()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle interrupt signals gracefully"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.pause_scraping()
        self.save_state()
        sys.exit(0)
    
    def _create_session(self):
        """Create a requests session with proper headers"""
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        return session
    
    def load_oxylabs_config(self) -> Dict:
        """Load Oxylabs configuration from file"""
        config_file = 'oxylabs_config.yaml'
        default_config = {
            'enabled': True,
            'username': '',
            'password': '',
            'api_url': 'https://realtime.oxylabs.io/v1/queries'
        }
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f) or {}
                    return config.get('oxylabs', default_config)
        except Exception as e:
            logger.warning(f"Failed to load Oxylabs config: {e}")
        return default_config
    
    def load_targets(self) -> List[Dict]:
        """Load targets from YAML file"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                return data.get('targets', [])
        except Exception as e:
            logger.error(f"Failed to load targets: {e}")
            return []
    
    def load_state(self):
        """Load previous scraping state"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'rb') as f:
                    state = pickle.load(f)
                    self.processed_urls = state.get('processed_urls', set())
                    self.failed_urls = state.get('failed_urls', set())
                    self.total_data_size = state.get('total_data_size', 0)
                    self.downloaded_doc_hashes = state.get('downloaded_doc_hashes', set())
                    logger.info(f"Loaded state: {len(self.processed_urls)} processed URLs, {len(self.failed_urls)} failed URLs")
        
            if os.path.exists(self.data_size_file):
                with open(self.data_size_file, 'r') as f:
                    data_size_data = json.load(f)
                    self.total_data_size = data_size_data.get('total_data_size', 0)
                    logger.info(f"Total data size: {self.total_data_size / (1024**3):.2f} GB")
            
            if os.path.exists(self.checkpoint_file):
                with open(self.checkpoint_file, 'r', encoding='utf-8') as f:
                    cp = json.load(f)
                    self.targets_progress = cp.get('targets', {}) or {}
                    completed = [name for name, meta in self.targets_progress.items() if meta.get('completed')]
                    self.completed_targets = set(completed)
        except Exception as e:
            logger.error(f"Failed to load state: {e}")
    
    def save_state(self):
        """Save current scraping state"""
        try:
            state = {
                'processed_urls': self.processed_urls,
                'failed_urls': self.failed_urls,
                'total_data_size': self.total_data_size,
                'downloaded_doc_hashes': self.downloaded_doc_hashes,
                'timestamp': datetime.now().isoformat()
            }
            
            with open(self.state_file, 'wb') as f:
                pickle.dump(state, f)
            
            # Save data size separately
            data_size_data = {
                'total_data_size': self.total_data_size,
                'current_run_data_size': self.current_run_data_size,
                'timestamp': datetime.now().isoformat()
            }
            
            with open(self.data_size_file, 'w') as f:
                json.dump(data_size_data, f, indent=2)
            
            # Checkpoint progress for resume-aware UI
            checkpoint = {
                'targets': self.targets_progress,
                'timestamp': datetime.now().isoformat()
            }
            with open(self.checkpoint_file, 'w', encoding='utf-8') as f:
                json.dump(checkpoint, f, indent=2, ensure_ascii=False)
            
            logger.info("State saved successfully")
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
    
    def _update_target_progress(self, target_name: str, scraped_count: Optional[int] = None, failed_inc: int = 0, completed: Optional[bool] = None):
        with self.state_lock:
            entry = self.targets_progress.get(target_name, {"scraped": 0, "failed": 0, "completed": False})
            if scraped_count is not None:
                entry["scraped"] = scraped_count
            if failed_inc:
                entry["failed"] = entry.get("failed", 0) + failed_inc
            if completed is not None:
                entry["completed"] = bool(completed)
                if completed:
                    self.completed_targets.add(target_name)
            entry["timestamp"] = datetime.now().isoformat()
            self.targets_progress[target_name] = entry
    
    def pause_scraping(self):
        """Pause scraping and save state"""
        logger.info("Pausing scraping...")
        self.paused = True
        self.save_state()
        logger.info("Scraping paused. State saved.")
    
    def resume_scraping(self):
        """Resume scraping from saved state"""
        logger.info("Resuming scraping...")
        self.paused = False
        self.load_state()
        logger.info("Scraping resumed.")
    
    def stop_scraping(self):
        """Stop scraping permanently"""
        logger.info("Stopping scraping...")
        self.should_stop = True
        self.save_state()
        logger.info("Scraping stopped. State saved.")
    
    def get_data_size_gb(self) -> float:
        """Get current data size in GB"""
        return self.current_run_data_size / (1024**3)
    
    def should_pause_for_data_limit(self) -> bool:
        """Check if we should pause due to data size limit"""
        # No data limit per run
        return False
    
    def fetch_url_with_oxylabs(self, url: str, retries: int = 3) -> Optional[str]:
        """Fetch URL using the Oxylabs Scraper API with retry logic"""
        if not self.oxylabs_username or not self.oxylabs_password:
            logger.error("Oxylabs credentials not configured.")
            return None
        username = self.oxylabs_username
        password = self.oxylabs_password
        api_url = self.oxylabs_api_url
        headers = {'Content-Type': 'application/json'}
        payload = {
            "source": "universal",
            "url": url,
            "parse": False,
            "render_js": self.oxylabs_render_js,
            "wait": self.oxylabs_wait_ms
        }
        for attempt in range(retries):
            try:
                logger.info(f"Fetching {url} via Oxylabs (attempt {attempt + 1})")
                response = requests.post(api_url, headers=headers, json=payload, auth=(username, password), timeout=self.connection_timeout)
                response.raise_for_status()
                data = response.json()
                results = data.get('results', [])
                if results and 'content' in results[0]:
                    content = results[0]['content']
                    logger.info(f"Successfully fetched {len(content)} characters from {url}")
                    return content
                else:
                    logger.error(f"No content found in Oxylabs response for {url}")
                    return None
            except Exception as e:
                logger.warning(f"Oxylabs fetch failed for {url}: {e}")
                if attempt == retries - 1:
                    logger.error(f"Failed to fetch {url} after {retries} attempts")
                    return None
                time.sleep(2 ** attempt)
        return None

    def fetch_url_with_retry(self, url: str, max_retries: int = None) -> Optional[str]:
        # Always use Oxylabs for all fetches
        return self.fetch_url_with_oxylabs(url, retries=max_retries or 3)
    
    def detect_free_api(self, base_url: str) -> Optional[str]:
        """Try to auto-detect a free/public API endpoint for the site"""
        # Check robots.txt for API endpoints
        try:
            robots_url = urljoin(base_url, '/robots.txt')
            robots_txt = self.fetch_url_with_oxylabs(robots_url)
            if robots_txt:
                api_candidates = re.findall(r'(\/api\/[\w\-/]+)', robots_txt)
                if api_candidates:
                    for candidate in api_candidates:
                        api_url = urljoin(base_url, candidate)
                        # Try a test fetch
                        resp = self.fetch_url_with_oxylabs(api_url)
                        if resp and len(resp) > 50:
                            logger.info(f"Detected possible free API: {api_url}")
                            return api_url
        except Exception as e:
            logger.warning(f"Error checking robots.txt for API: {e}")
        # Try common API paths
        common_api_paths = ['/api/', '/api/v1/', '/api/public/', '/data/', '/openapi/']
        for path in common_api_paths:
            api_url = urljoin(base_url, path)
            try:
                resp = self.fetch_url_with_oxylabs(api_url)
                if resp and len(resp) > 50:
                    logger.info(f"Detected possible free API: {api_url}")
                    return api_url
            except Exception as e:
                continue
        return None

    def extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract links with priority for pagination and content-rich sections; filter and normalize"""
        links: List[str] = []
        pagination_keywords = ['next', 'more', 'older', 'page', '>>', '›', '»']
        data_keywords = ['blog', 'news', 'article', 'story', 'press', 'media', 'research', 'report', 'publication', 'publications', 'dataset', 'data', 'archive', 'journals', 'papers', 'docs']
        skip_parts = ['login', 'signin', 'cart', 'checkout', 'account', 'privacy', 'terms', 'subscribe']
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin(base_url, href)
            if not self._is_valid_url(full_url, base_url):
                continue
            # Skip low-value paths
            lower_url = full_url.lower()
            if any(f"/{part}" in lower_url for part in skip_parts) or any(f"?{q}=" in lower_url for q in ['q', 's', 'search']) or '#comment' in lower_url:
                continue
            text = a.get_text(strip=True).lower()
            # Prioritize pagination and data-rich links
            if any(kw in text for kw in pagination_keywords) or any(kw in lower_url for kw in pagination_keywords):
                links.insert(0, full_url)
            elif any(kw in text for kw in data_keywords) or any(kw in lower_url for kw in data_keywords):
                links.insert(0, full_url)
            else:
                links.append(full_url)
        # Remove duplicates, keep order
        seen = set()
        unique_links: List[str] = []
        for link in links:
            norm = self.normalize_url(link)
            if norm not in seen:
                unique_links.append(norm)
                seen.add(norm)
        return unique_links
    
    def _is_valid_url(self, url: str, base_url: str) -> bool:
        # Only follow http(s) links, avoid mailto, javascript, etc.
        if not url.startswith(('http://', 'https://')):
            return False
        # Optionally, restrict to same domain
        if self.same_domain_only:
            base_domain = urlparse(base_url).netloc
            url_domain = urlparse(url).netloc
            return base_domain == url_domain
        return True
    
    def extract_text_content(self, soup: BeautifulSoup) -> str:
        # Remove script/style
        for tag in soup(['script', 'style', 'noscript']):
            tag.decompose()
        text = soup.get_text(separator=' ', strip=True)
        return text
    
    def extract_media_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        media_urls = []
        # Images
        for img in soup.find_all('img', src=True):
            src = img['src']
            full_url = urljoin(base_url, src)
            if full_url.startswith(('http://', 'https://')):
                media_urls.append(full_url)
        # Videos
        for video in soup.find_all('video', src=True):
            src = video['src']
            full_url = urljoin(base_url, src)
            if full_url.startswith(('http://', 'https://')):
                media_urls.append(full_url)
        # Audio
        for audio in soup.find_all(['audio', 'source'], src=True):
            src = audio['src']
            full_url = urljoin(base_url, src)
            if full_url.startswith(('http://', 'https://')):
                media_urls.append(full_url)
        return list(set(media_urls))
    
    def download_media(self, media_urls: List[str], url_hash: str, timestamp: str) -> List[str]:
        """Download all media files via Oxylabs and return list of local file paths"""
        media_dir = Path('output/scraped_data/media')
        media_dir.mkdir(parents=True, exist_ok=True)
        local_paths = []
        for media_url in media_urls:
            try:
                ext = os.path.splitext(urlparse(media_url).path)[1]
                if not ext or len(ext) > 8:
                    ext = ''
                media_hash = hashlib.md5(media_url.encode()).hexdigest()[:8]
                filename = f"{url_hash}_{media_hash}_{timestamp}{ext}"
                local_path = media_dir / filename
                if local_path.exists():
                    local_paths.append(str(local_path))
                    continue
                # Download via Oxylabs
                content = self.fetch_url_with_oxylabs(media_url)
                if content:
                    with open(local_path, 'wb') as f:
                        if isinstance(content, str):
                            f.write(content.encode('utf-8'))
                        else:
                            f.write(content)
                    local_paths.append(str(local_path))
                    logger.info(f"Downloaded media via Oxylabs: {media_url} -> {local_path}")
                else:
                    logger.warning(f"Failed to download media via Oxylabs: {media_url}")
            except Exception as e:
                logger.warning(f"Error downloading media {media_url}: {e}")
        return local_paths
    
    def is_document_url(self, url: str) -> bool:
        try:
            path = urlparse(url).path.lower()
            return any(path.endswith(ext) for ext in self.allowed_doc_extensions)
        except Exception:
            return False

    def extract_document_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        doc_links: List[str] = []
        for a in soup.find_all('a', href=True):
            href = urljoin(base_url, a['href'])
            if self._is_valid_url(href, base_url) and self.is_document_url(href):
                doc_links.append(self.normalize_url(href))
        # unique preserve order
        seen = set()
        unique_docs = []
        for u in doc_links:
            if u not in seen:
                unique_docs.append(u)
                seen.add(u)
        return unique_docs
    
    def download_document(self, url: str, url_hash: str, timestamp: str) -> Optional[Path]:
        """Download a document (PDF) and return local path if successful"""
        try:
            docs_dir = Path('output/scraped_data/docs')
            docs_dir.mkdir(parents=True, exist_ok=True)
            ext = os.path.splitext(urlparse(url).path)[1]
            if not ext or len(ext) > 8:
                ext = '.pdf'
            file_hash = hashlib.md5(url.encode()).hexdigest()[:10]
            filename = f"doc_{url_hash}_{file_hash}_{timestamp}{ext}"
            local_path = docs_dir / filename
            if local_path.exists():
                return local_path
            # Try Oxylabs first
            content = self.fetch_url_with_oxylabs(url)
            binary_data: Optional[bytes] = None
            if isinstance(content, bytes):
                binary_data = content
            elif isinstance(content, str):
                # Detect PDF header in text form
                if content.startswith('%PDF-'):
                    binary_data = content.encode('latin1', errors='ignore')
            # Fallback to direct request
            if binary_data is None:
                try:
                    resp = self.session.get(url, timeout=60)
                    if resp.status_code == 200:
                        binary_data = resp.content
                except Exception as e:
                    logger.warning(f"Direct download failed for {url}: {e}")
            if not binary_data:
                logger.warning(f"No document data for {url}")
                return None
            # Size check
            max_bytes = int(self.max_document_size_mb * 1024 * 1024)
            if len(binary_data) > max_bytes:
                logger.info(f"Skipping large document ({len(binary_data)/1024/1024:.1f} MB): {url}")
                return None
            with open(local_path, 'wb') as f:
                f.write(binary_data)
            return local_path
        except Exception as e:
            logger.warning(f"Error downloading document {url}: {e}")
            return None

    def extract_text_from_pdf(self, pdf_path: Path) -> Optional[str]:
        try:
            from pdfminer.high_level import extract_text as pdf_extract_text
            text = pdf_extract_text(str(pdf_path))
            if text and len(text.strip()) > 0:
                return text
        except Exception as e:
            logger.warning(f"PDF text extraction failed for {pdf_path}: {e}")
        return None

    def save_document_text(self, doc_url: str, local_pdf_path: Path, extracted_text: str, target: Dict) -> int:
        try:
            output_dir = Path('output/scraped_data')
            output_dir.mkdir(parents=True, exist_ok=True)
            url_hash = hashlib.md5(doc_url.encode()).hexdigest()[:8]
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            text_file = output_dir / f"{target['name']}_{url_hash}_{timestamp}_doc.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(extracted_text)
            meta = {
                'url': doc_url,
                'target': target,
                'timestamp': datetime.now().isoformat(),
                'source_type': 'document',
                'document_local_path': str(local_pdf_path),
                'text_length': len(extracted_text)
            }
            meta_file = output_dir / f"{target['name']}_{url_hash}_{timestamp}_doc.json"
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(meta, f, indent=2, ensure_ascii=False)
            total_size = len(extracted_text) + len(json.dumps(meta))
            logger.info(f"Saved document text for {doc_url} -> {text_file}")
            return total_size
        except Exception as e:
            logger.error(f"Failed to save document text for {doc_url}: {e}")
            return 0
    
    def save_content(self, url: str, html_content: str, text_content: str, 
                    media_urls: List[str], target: Dict) -> int:
        try:
            output_dir = Path('output/scraped_data')
            output_dir.mkdir(parents=True, exist_ok=True)
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            html_file = output_dir / f"{target['name']}_{url_hash}_{timestamp}.html"
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            text_file = output_dir / f"{target['name']}_{url_hash}_{timestamp}.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(text_content)
            # Download media and get local paths (skip if disabled)
            local_media_paths = self.download_media(media_urls, url_hash, timestamp) if (self.download_media_enabled and media_urls) else []
            metadata = {
                'url': url,
                'target': target,
                'timestamp': datetime.now().isoformat(),
                'media_urls': media_urls if self.download_media_enabled else [],
                'media_local_paths': local_media_paths,
                'text_length': len(text_content),
                'html_length': len(html_content)
            }
            meta_file = output_dir / f"{target['name']}_{url_hash}_{timestamp}.json"
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            total_size = len(html_content) + len(text_content) + len(json.dumps(metadata))
            logger.info(f"Saved content for {url} ({total_size / 1024:.1f} KB)")
            return total_size
        except Exception as e:
            logger.error(f"Failed to save content for {url}: {e}")
            return 0
    
    def normalize_url(self, url: str) -> str:
        """Normalize URL by removing tracking params and fragments"""
        try:
            parsed = urlparse(url)
            # Remove fragment
            fragmentless = parsed._replace(fragment='')
            # Remove tracking query params
            query_pairs = []
            if fragmentless.query:
                for part in fragmentless.query.split('&'):
                    if not part:
                        continue
                    key = part.split('=')[0].lower()
                    if key.startswith('utm_') or key in {'gclid', 'fbclid', 'mc_eid', 'mc_cid', 'ref'}:
                        continue
                    query_pairs.append(part)
            new_query = '&'.join(query_pairs)
            cleaned = fragmentless._replace(query=new_query)
            # Normalize trailing slash for path-only URLs
            path = cleaned.path or '/'
            normalized = cleaned._replace(path=path)
            return normalized.geturl()
        except Exception:
            return url
    
    def _inc_sizes(self, inc: int):
        with self.state_lock:
            self.current_run_data_size += inc
            self.total_data_size += inc
    
    def _add_processed(self, url: str):
        with self.state_lock:
            self.processed_urls.add(url)
    
    def _add_failed(self, url: str):
        with self.state_lock:
            self.failed_urls.add(url)
    
    def _add_doc_hash(self, h: str):
        with self.state_lock:
            self.downloaded_doc_hashes.add(h)
    
    def scrape_target(self, target: Dict, on_progress=None) -> bool:
        logger.info(f"Starting to scrape target: {target['name']}")
        root_url = target['url']
        urls_to_scrape: List[Tuple[str, int]] = [(self.normalize_url(root_url), 0)]
        scraped_urls = set()
        scraped_count = 0
        docs_downloaded_for_site = 0
        # Try to auto-detect a free API
        api_url = self.detect_free_api(root_url)
        if api_url:
            # Try to fetch and save API data
            api_data = self.fetch_url_with_oxylabs(api_url)
            if api_data:
                output_dir = Path('output/scraped_data/api')
                output_dir.mkdir(parents=True, exist_ok=True)
                api_file = output_dir / f"{target['name'].replace(' ', '_')}_api.json"
                with open(api_file, 'w', encoding='utf-8') as f:
                    f.write(api_data)
                logger.info(f"Saved API data for {target['name']} to {api_file}")
        if self.fast_mode:
            # Concurrent scraping with a simple worker pool
            queue: Queue = Queue()
            seen = set()
            lock = threading.Lock()
            stop_event = threading.Event()
            queue.put((self.normalize_url(root_url), 0))
            seen.add(self.normalize_url(root_url))

            def worker():
                nonlocal scraped_count, docs_downloaded_for_site
                while not stop_event.is_set():
                    try:
                        current = queue.get(timeout=2)
                    except Empty:
                        # No more work for now
                        if queue.empty():
                            break
                        else:
                            continue
                    try:
                        url, depth = current if isinstance(current, tuple) else (current, 0)
                        url = self.normalize_url(url)
                        with lock:
                            if url in self.processed_urls or url in scraped_urls:
                                queue.task_done()
                                continue
                            if scraped_count >= self.max_pages_per_site or depth > self.max_depth:
                                queue.task_done()
                                continue
                        html_content = self.fetch_url_with_retry(url)
                        if not html_content:
                            self._add_failed(url)
                            queue.task_done()
                            continue
                        soup = BeautifulSoup(html_content, 'html.parser')
                        text_content = self.extract_text_content(soup)
                        if len(text_content) >= self.min_text_length_chars:
                            media_urls: List[str] = []
                            data_size = self.save_content(url, html_content, text_content, media_urls, target)
                            self._inc_sizes(data_size)
                            with lock:
                                scraped_count += 1
                                self._update_target_progress(target['name'], scraped_count=scraped_count)
                                if on_progress:
                                    try:
                                        on_progress(target['name'], scraped_count, self.current_run_data_size, self.total_data_size)
                                    except Exception:
                                        pass
                        self._add_processed(url)
                        with lock:
                            scraped_urls.add(url)
                        # Enqueue new links quickly
                        new_links = self.extract_links(soup, root_url if self.same_domain_only else url)
                        with lock:
                            for link in new_links:
                                if link not in seen and link not in self.processed_urls and link not in scraped_urls:
                                    seen.add(link)
                                    queue.put((link, depth + 1))
                    except Exception as e:
                        logger.error(f"Error scraping {url}: {e}")
                        self._add_failed(url)
                    finally:
                        queue.task_done()
            workers = []
            for _ in range(max(1, self.max_concurrent)):
                t = threading.Thread(target=worker, daemon=True)
                workers.append(t)
                t.start()
            queue.join()
            stop_event.set()
            for t in workers:
                t.join(timeout=2)
        else:
            while urls_to_scrape and not self.should_stop and not self.paused:
                if self.should_pause_for_data_limit():
                    logger.info(f"Data size limit reached ({self.get_data_size_gb():.2f} GB). Pausing...")
                    self.pause_scraping()
                    return True
                if scraped_count >= self.max_pages_per_site:
                    logger.info(f"Reached max pages per site ({self.max_pages_per_site}). Moving to next target.")
                    break
                current = urls_to_scrape.pop(0)
                if isinstance(current, tuple):
                    url, depth = current
                else:
                    url, depth = current, 0
                url = self.normalize_url(url)
                if url in self.processed_urls or url in scraped_urls:
                    continue
                if depth > self.max_depth:
                    continue
                logger.info(f"Scraping (depth {depth}): {url}")
                try:
                    html_content = self.fetch_url_with_retry(url)
                    if not html_content:
                        self._add_failed(url)
                        continue
                    soup = BeautifulSoup(html_content, 'html.parser')
                    text_content = self.extract_text_content(soup)
                    # Quality filter: minimum content length
                    if len(text_content) < self.min_text_length_chars:
                        logger.info(f"Skipping save (content too short: {len(text_content)} chars) for {url}")
                    else:
                        media_urls = []  # media disabled by default
                        data_size = self.save_content(url, html_content, text_content, media_urls, target)
                        self._inc_sizes(data_size)
                        scraped_count += 1
                        self._update_target_progress(target['name'], scraped_count=scraped_count)
                        if on_progress:
                            try:
                                on_progress(target['name'], scraped_count, self.current_run_data_size, self.total_data_size)
                            except Exception:
                                pass
                    self._add_processed(url)
                    scraped_urls.add(url)
                    # Handle documents
                    if self.download_documents_enabled and docs_downloaded_for_site < self.max_docs_per_site:
                        doc_links = self.extract_document_links(soup, url)
                        for doc_url in doc_links:
                            if docs_downloaded_for_site >= self.max_docs_per_site:
                                break
                            # Avoid duplicates by URL and content hash
                            url_sig = hashlib.md5(doc_url.encode()).hexdigest()
                            if url_sig in self.downloaded_doc_hashes:
                                continue
                            dl_path = self.download_document(doc_url, hashlib.md5(url.encode()).hexdigest()[:8], datetime.now().strftime('%Y%m%d_%H%M%S'))
                            if not dl_path:
                                continue
                            # Hash file content to avoid duplicates
                            try:
                                with open(dl_path, 'rb') as f:
                                    content_bytes = f.read()
                                content_hash = hashlib.md5(content_bytes).hexdigest()
                                if content_hash in self.downloaded_doc_hashes:
                                    logger.info(f"Skipping duplicate document content: {doc_url}")
                                    continue
                                self._add_doc_hash(content_hash)
                                self._add_doc_hash(url_sig)
                            except Exception:
                                pass
                            # Extract text
                            extracted = None
                            if str(dl_path).lower().endswith('.pdf'):
                                extracted = self.extract_text_from_pdf(dl_path)
                            if extracted and len(extracted) >= self.min_text_length_chars:
                                inc = self.save_document_text(doc_url, dl_path, extracted, target)
                                self._inc_sizes(inc)
                                docs_downloaded_for_site += 1
                            else:
                                logger.info(f"Skipping document (no/low text): {doc_url}")
                    # Enqueue new links
                    new_links = self.extract_links(soup, root_url if self.same_domain_only else url)
                    # Optional simple pagination limit by counting page occurrences
                    pagination_added = 0
                    for link in new_links:
                        if link not in self.processed_urls and link not in scraped_urls:
                            if any(tok in link.lower() for tok in ['page=', '/page/']):
                                if pagination_added >= self.max_pagination_pages:
                                    continue
                                pagination_added += 1
                            urls_to_scrape.append((link, depth + 1))
                    time.sleep(self.request_delay)
                    if len(scraped_urls) % 10 == 0:
                        self.save_state()
                except Exception as e:
                    logger.error(f"Error scraping {url}: {e}")
                    self._add_failed(url)
                    continue
        logger.info(f"Finished scraping target: {target['name']}")
        self._update_target_progress(target['name'], completed=True)
        return True
    
    def run_scraper(self):
        logger.info("Starting Scrape-Only Smart Scraper v3 (NO AI/OLLAMA)...")
        logger.info("Target data size per run: unlimited")
        logger.info(f"Pause duration between runs: {self.pause_duration} seconds")
        run_count = 0
        console = Console()
        
        while not self.should_stop:
            run_count += 1
            logger.info(f"Starting run #{run_count}")
            self.current_run_data_size = 0
            
            # Determine which targets to run (skip already completed if present)
            pending_targets = [t for t in self.targets if t['name'] not in self.completed_targets]
            if not pending_targets:
                logger.info("All targets have been processed!")
                break
            
            # Progress UI
            progress = Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                TimeElapsedColumn(),
                TimeRemainingColumn(),
                transient=False,
                console=console
            )
            
            with progress:
                overall_task = progress.add_task("[bold]Overall[/bold]", total=len(pending_targets))
                # Map per-target tasks
                task_ids: Dict[str, int] = {}
                for t in pending_targets:
                    already = self.targets_progress.get(t['name'], {}).get('scraped', 0)
                    task_ids[t['name']] = progress.add_task(f"{t['name']}", total=self.max_pages_per_site, completed=already)
                
                def on_progress_cb(name: str, scraped: int, current_bytes: int, total_bytes: int):
                    task_id = task_ids.get(name)
                    if task_id is not None:
                        # Set progress to scraped (bounded by max_pages_per_site)
                        try:
                            progress.update(task_id, completed=min(scraped, self.max_pages_per_site), description=f"{name} | pages: {scraped} | run: {current_bytes/(1024**3):.2f} GB")
                        except Exception:
                            pass
                    # Persist checkpoint occasionally
                    if scraped % 10 == 0:
                        self.save_state()
                
                # Launch targets concurrently
                with ThreadPoolExecutor(max_workers=self.target_max_concurrent) as executor:
                    future_to_name = {}
                    for target in pending_targets:
                        future = executor.submit(self.scrape_target, target, on_progress_cb)
                        future_to_name[future] = target['name']
                    for future in as_completed(future_to_name):
                        name = future_to_name[future]
                        try:
                            _ = future.result()
                        except Exception as e:
                            logger.error(f"Target failed: {name}: {e}")
                        finally:
                            # Mark per-target task complete and advance overall
                            tid = task_ids.get(name)
                            if tid is not None:
                                try:
                                    progress.update(tid, completed=self.max_pages_per_site)
                                except Exception:
                                    pass
                            progress.advance(overall_task)
                
                # Save after batch
                self.save_state()
            
            if self.should_pause_for_data_limit() or self.paused:
                logger.info(f"Pausing scraping. Current data size: {self.get_data_size_gb():.2f} GB")
                self.save_state()
                if not self.should_stop:
                    logger.info(f"Waiting {self.pause_duration} seconds before next run...")
                    time.sleep(self.pause_duration)
                    self.resume_scraping()
            # If after run all targets completed, stop
            if all((t['name'] in self.completed_targets) for t in self.targets):
                logger.info("All targets have been processed!")
                break
        logger.info("Scraping completed!")
        logger.info(f"Total data collected: {self.total_data_size / (1024**3):.2f} GB")
        logger.info(f"Processed URLs: {len(self.processed_urls)}")
        logger.info(f"Failed URLs: {len(self.failed_urls)}")

def main():
    os.makedirs('logs', exist_ok=True)
    os.makedirs('output/scraped_data', exist_ok=True)
    parser = argparse.ArgumentParser(description='Scrape-Only Smart Scraper v3')
    parser.add_argument('--fast', action='store_true', help='Enable high-speed mode (aggressive)')
    parser.add_argument('--concurrency', type=int, default=None, help='Number of concurrent workers in fast mode')
    parser.add_argument('--targets-concurrency', type=int, default=None, help='Number of sites to scrape in parallel')
    parser.add_argument('--fresh', action='store_true', help='Start fresh (clear saved state and checkpoints)')
    args = parser.parse_args()
    scraper = ScrapeOnlySmartScraperV3(fast_mode=args.fast, concurrency=args.concurrency, target_concurrency=args.targets_concurrency, fresh=args.fresh)
    try:
        scraper.run_scraper()
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        scraper.pause_scraping()
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        scraper.save_state()

if __name__ == "__main__":
    main() 