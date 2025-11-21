#!/usr/bin/env python3
"""
MAXIMIZE 60K OXYLABS REQUESTS - ENHANCED WITH PROGRESS & RESUME
This script will hit 60k Oxylabs requests as fast as possible by:
1. Expanding targets with MAXIMUM URL generation
2. Using ultra-fast processing settings
3. Progress bars and request counting
4. Resume functionality from any point
5. Maximum throughput optimization
6. Parallel sharding across multiple processes
"""

import os
import sys
import json
import time
import logging
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set
import yaml
from urllib.parse import urlparse
from tqdm import tqdm
import threading

# Add scraper directory to path
sys.path.append('scraper')
from scrape_only_v3 import ScrapeOnlySmartScraperV3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/maximize_60k_enhanced_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class UltraAggressiveExpanderEnhanced:
    def __init__(self, targets_file: str = 'scraper/targets.yaml', seed_files: List[str] = None, shard_id: int = 0):
        self.targets_file = targets_file
        self.seed_files = seed_files or []
        self.targets: List[Dict] = []
        self.expanded_targets: List[Dict] = []
        self.processed_domains: Set[str] = set()
        self.shard_id = shard_id
        self.load_targets()

        # ULTRA-AGGRESSIVE settings
        self.batch_size = 1000
        self.max_urls_per_target = 200
        
        # Progress tracking (shard-specific)
        self.progress_file = f'scraping_progress_shard_{self.shard_id}.json'
        self.request_count = 0
        self.start_time = None
        self.resume_data = self.load_progress()

    def _read_targets_yaml(self, path: str) -> List[Dict]:
        try:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f) or {}
                    return data.get('targets', [])
        except Exception as e:
            logger.warning(f"Failed to read targets from {path}: {e}")
        return []

    def load_targets(self):
        # Base targets
        targets = self._read_targets_yaml(self.targets_file)
        # Merge any seed files
        for seed in self.seed_files:
            seed_targets = self._read_targets_yaml(seed)
            if seed_targets:
                targets.extend(seed_targets)
        # Deduplicate by URL
        seen_urls: Set[str] = set()
        dedup: List[Dict] = []
        for t in targets:
            url = t.get('url')
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            dedup.append(t)
        self.targets = dedup
        logger.info(f"Loaded {len(self.targets)} merged targets from base and seeds")

    def _empty_progress(self) -> Dict:
        return {
            'request_count': 0,
            'processed_urls': [],
            'failed_urls': [],
            'last_target_index': 0,
            'last_url_index': 0
        }

    def load_progress(self) -> Dict:
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r') as f:
                    data = json.load(f)
                    if 'processed_urls' in data and isinstance(data['processed_urls'], list):
                        data['processed_urls'] = set(data['processed_urls'])
                    if 'failed_urls' in data and isinstance(data['failed_urls'], list):
                        data['failed_urls'] = set(data['failed_urls'])
                    data.setdefault('request_count', 0)
                    data.setdefault('last_target_index', 0)
                    data.setdefault('last_url_index', 0)
                    logger.info(f"Loaded progress: {data['request_count']} requests completed (shard {self.shard_id})")
                    return data
            except Exception as e:
                logger.warning(f"Could not load progress: {e}")
        d = self._empty_progress()
        d['processed_urls'] = set()
        d['failed_urls'] = set()
        return d

    def save_progress(self, target_index: int, url_index: int, url: str, success: bool):
        if success:
            self.resume_data['processed_urls'].add(url)
        else:
            self.resume_data['failed_urls'].add(url)
        
        to_save = dict(self.resume_data)
        to_save['request_count'] = self.request_count
        to_save['last_target_index'] = target_index
        to_save['last_url_index'] = url_index
        to_save['processed_urls'] = list(self.resume_data['processed_urls'])
        to_save['failed_urls'] = list(self.resume_data['failed_urls'])
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(to_save, f)
        except Exception as e:
            logger.warning(f"Could not save progress: {e}")

    def generate_maximum_urls(self, base_url: str, target_name: str) -> List[str]:
        additional_urls: List[str] = []
        try:
            parsed = urlparse(base_url)
            domain = parsed.netloc
            scheme = parsed.scheme

            # Common paths per category
            cat_paths = [
                '/about','/news','/contact','/sitemap','/privacy','/terms','/help','/support','/faq','/resources','/tools','/data',
                '/blog','/articles','/press','/media','/events','/webinars','/training','/documentation','/api','/developers','/partners',
                '/careers','/investors','/analytics','/insights','/reports'
            ]
            for p in cat_paths:
                additional_urls.append(f"{scheme}://{domain}{p}")

            for i in range(2, 51):
                additional_urls.append(f"{base_url}?page={i}")
                additional_urls.append(f"{base_url}/page/{i}")
                additional_urls.append(f"{base_url}/p/{i}")

            search_terms = [
                'health','finance','research','news','data','analysis','technology','innovation','development','growth','investment',
                'market','industry','trends','insights','reports','studies','publications','papers','articles','blogs','updates'
            ]
            for term in search_terms:
                additional_urls.append(f"{base_url}?search={term}")
                additional_urls.append(f"{base_url}/search?q={term}")
                additional_urls.append(f"{base_url}/search/{term}")

            variations = [
                'about','contact','privacy','terms','sitemap','help','support','faq','resources','tools','data','api','docs','blog','news','press',
                'media','events','webinars','training','documentation','developers','partners','careers','investors'
            ]
            for v in variations:
                additional_urls.append(f"{base_url}/{v}")
                additional_urls.append(f"{base_url}/en/{v}")
                additional_urls.append(f"{base_url}/us/{v}")

            current_year = datetime.now().year
            for year in range(current_year - 5, current_year + 1):
                additional_urls.append(f"{base_url}/{year}")
                additional_urls.append(f"{base_url}/archive/{year}")
                additional_urls.append(f"{base_url}/news/{year}")

            for cat in ['news','research','insights','analysis','reports','data']:
                additional_urls.append(f"{base_url}/category/{cat}")
                additional_urls.append(f"{base_url}/topics/{cat}")
        except Exception as e:
            logger.warning(f"Error generating URLs for {base_url}: {e}")

        # Cap additional URLs dynamically to hit the caller's desired per-target size
        max_additional = max(150, int(self.max_urls_per_target) - 1)
        if len(additional_urls) > max_additional:
            additional_urls = additional_urls[:max_additional]
        return additional_urls

    def expand_targets_maximum(self, max_urls_per_target: int = 200) -> List[Dict]:
        expanded: List[Dict] = []
        for target in self.targets:
            base_url = target.get('url', '')
            if not base_url:
                continue
            expanded_target = target.copy()
            additional_urls = self.generate_maximum_urls(base_url, target.get('name', 'target'))
            all_urls = [base_url] + additional_urls
            expanded_target['urls'] = all_urls[:max_urls_per_target]
            expanded_target['original_url'] = base_url
            expanded_target['expanded_count'] = len(expanded_target['urls'])
            expanded_target['domain'] = urlparse(base_url).netloc
            if 'url' in expanded_target:
                del expanded_target['url']
            expanded.append(expanded_target)
        self.expanded_targets = expanded
        return expanded

    def process_targets_ultra_aggressive_enhanced(self, expanded_targets: List[Dict], max_workers: int = 200) -> Dict:
        if not expanded_targets:
            return {'success': 0, 'failed': 0, 'total': 0}

        scraper = ScrapeOnlySmartScraperV3(
            config_file=self.targets_file,
            fast_mode=True,
            concurrency=max_workers,
            target_concurrency=1,
            fresh=False
        )
        scraper.oxylabs_wait_ms = 100
        scraper.oxylabs_render_js = False
        scraper.max_concurrent = max_workers

        total_urls = sum(len(t['urls']) for t in expanded_targets)
        already = self.resume_data.get('request_count', 0)
        remaining = max(0, total_urls - already)

        main_progress = tqdm(total=remaining, desc=f'Oxylabs Requests (shard {self.shard_id})', unit='req', position=0,
                             bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]')
        target_progress = tqdm(total=len(expanded_targets), desc=f'Targets (shard {self.shard_id})', unit='target', position=1, leave=False)

        request_times: List[float] = []
        def update_rate():
            while True:
                time.sleep(5)
                recent = [t for t in request_times if time.time() - t < 60]
                main_progress.set_postfix({'rate': f'{len(recent)}/min', 'total': f'{self.request_count:,}', 'goal': '60k'})
        threading.Thread(target=update_rate, daemon=True).start()

        total_success = len(self.resume_data.get('processed_urls', []))
        total_failed = len(self.resume_data.get('failed_urls', []))
        total_processed = already

        start_target_index = self.resume_data.get('last_target_index', 0)
        start_url_index = self.resume_data.get('last_url_index', 0)

        try:
            for ti in range(start_target_index, len(expanded_targets)):
                target = expanded_targets[ti]
                target_progress.update(1)
                url_start = start_url_index if ti == start_target_index else 0
                for ui in range(url_start, len(target['urls'])):
                    url = target['urls'][ui]
                    if url in self.resume_data['processed_urls']:
                        continue
                    try:
                        single = {'name': f"expanded_{target.get('name','t')}_{ui}", 'url': url, 'type': 'expanded_target', 'priority': 'high'}
                        success = scraper.scrape_target(single)
                        self.request_count += 1
                        total_processed += 1
                        request_times.append(time.time())
                        if success:
                            total_success += 1
                        else:
                            total_failed += 1
                        main_progress.update(1)
                        if total_processed % 10 == 0:
                            self.save_progress(ti, ui, url, success)
                            scraper.save_state()
                        if self.request_count >= 60000:
                            raise KeyboardInterrupt
                    except Exception:
                        total_failed += 1
                        total_processed += 1
                        self.request_count += 1
                        main_progress.update(1)
                        self.save_progress(ti, ui, url, False)
        except KeyboardInterrupt:
            self.save_progress(ti, ui, url, success if 'success' in locals() else False)
        finally:
            main_progress.close()
            target_progress.close()

        duration = 0
        return {'success': total_success, 'failed': total_failed, 'total': total_processed, 'duration': duration,
                'expanded_targets': len(expanded_targets), 'oxylabs_requests': self.request_count}

    def estimate_60k_completion(self, total_urls: int) -> Dict:
        avg_time_per_url = 0.3
        rpm = 500
        minutes = (total_urls * avg_time_per_url) / 60
        return {'total_urls': total_urls, 'estimated_minutes': minutes, 'estimated_hours': minutes/60, 'requests_per_minute': rpm,
                'target_60k': 60000, 'will_hit_target': total_urls >= 60000}

def main():
    parser = argparse.ArgumentParser(description='MAXIMIZE 60K OXYLABS REQUESTS - ENHANCED WITH PROGRESS & RESUME')
    parser.add_argument('--max-workers', type=int, default=200)
    parser.add_argument('--batch-size', type=int, default=1000)
    parser.add_argument('--max-urls-per-target', type=int, default=200)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--num-shards', type=int, default=1, help='Total shards for parallel runs')
    parser.add_argument('--shard-id', type=int, default=0, help='This process shard id (0-indexed)')
    args = parser.parse_args()

    os.makedirs('logs', exist_ok=True)

    seed_files = []
    for p in ['additional_specialized_links.yaml', 'final_specialized_links.yaml']:
        if os.path.exists(p):
            seed_files.append(p)

    expander = UltraAggressiveExpanderEnhanced(seed_files=seed_files, shard_id=args.shard_id)
    expander.batch_size = args.batch_size
    expander.max_urls_per_target = args.max_urls_per_target

    expanded_targets = expander.expand_targets_maximum(args.max_urls_per_target)
    if not expanded_targets:
        logger.info('No targets to expand')
        return

    # Apply sharding on expanded targets (round-robin to balance)
    if args.num_shards > 1:
        expanded_targets = expanded_targets[args.shard_id::args.num_shards]
        logger.info(f"Shard {args.shard_id}/{args.num_shards}: {len(expanded_targets)} targets")

    total_urls = sum(len(t['urls']) for t in expanded_targets)
    est = expander.estimate_60k_completion(total_urls)
    logger.info(f"Total targets: {len(expander.targets)} | Expanded (this shard): {len(expanded_targets)} | Total URLs (this shard): {total_urls}")
    logger.info(f"Estimated time: {est['estimated_hours']:.1f} hours | RPM: {est['requests_per_minute']}")

    if args.dry_run:
        logger.info('DRY RUN - showing first 3 expanded targets:')
        for t in expanded_targets[:3]:
            logger.info(f"  {t.get('name','t')}: {len(t['urls'])} URLs")
        return

    results = expander.process_targets_ultra_aggressive_enhanced(expanded_targets, max_workers=args.max_workers)
    logger.info(f"Completed: total={results['total']} success={results['success']} failed={results['failed']} requests={results['oxylabs_requests']}")

if __name__ == '__main__':
    main()
