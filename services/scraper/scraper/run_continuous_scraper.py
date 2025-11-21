#!/usr/bin/env python3
"""
Continuous Scraper - Runs continuously; data organization is manual via CLI command
"""

import os
import sys
import time
import json
import signal
import threading
import subprocess
from datetime import datetime
from pathlib import Path
import logging
import argparse
import yaml

# Ensure logs directory exists before configuring logging
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/continuous_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

TARGETS_FILE = 'scraper/targets.yaml'
STATE_FILES = ['scraper_state_v3.pkl', 'data_size_tracker.json', 'scraper_checkpoint_v3.json']


def load_targets():
    """Load targets from YAML file"""
    try:
        if os.path.exists(TARGETS_FILE):
            with open(TARGETS_FILE, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f) or {}
                return data.get('targets', [])
    except Exception as e:
        logger.error(f"Error loading targets: {e}")
    return []


def save_targets(targets):
    """Save targets list back to YAML file"""
    try:
        os.makedirs(os.path.dirname(TARGETS_FILE), exist_ok=True)
        with open(TARGETS_FILE, 'w', encoding='utf-8') as f:
            yaml.safe_dump({'targets': targets}, f, sort_keys=False, allow_unicode=True)
        return True
    except Exception as e:
        logger.error(f"Error saving targets: {e}")
        return False


def add_target(name: str, url: str, target_type: str = 'html') -> bool:
    targets = load_targets()
    if any(t.get('url') == url for t in targets):
        logger.info(f"Target already exists: {url}")
        return False
    targets.append({'name': name, 'url': url, 'type': target_type})
    ok = save_targets(targets)
    if ok:
        logger.info(f"Added target: {name} ({url})")
    return ok


def remove_target(url: str) -> bool:
    targets = load_targets()
    new_targets = [t for t in targets if t.get('url') != url]
    if len(new_targets) == len(targets):
        logger.info(f"No target found for URL: {url}")
        return False
    ok = save_targets(new_targets)
    if ok:
        logger.info(f"Removed target: {url}")
    return ok


def list_targets_cli():
    targets = load_targets()
    print("=" * 50)
    print("SCRAPER TARGETS")
    print("=" * 50)
    if not targets:
        print("No targets configured. Use 'add' to add a new site.")
        return
    for i, t in enumerate(targets, 1):
        print(f"{i:02d}. {t.get('name','Unnamed')} -> {t.get('url')}")


class ContinuousScraper:
    def __init__(self, fast: bool = False, concurrency: int = None, targets_concurrency: int = None, fresh: bool = False):
        self.scraper_process = None
        self.organizer_process = None
        self.scraper_script = 'scraper/scrape_only_v3.py'
        self.organizer_script = 'organize_training_data.py'
        self.running = False
        self.organization_interval = 300  # Organize data every 5 minutes
        # Pass-through flags
        self.fast = bool(fast)
        self.concurrency = concurrency
        self.targets_concurrency = targets_concurrency
        self.fresh = bool(fresh)
        
    def start_scraper(self):
        """Start the scraper process"""
        if self.scraper_process and self.scraper_process.poll() is None:
            logger.info("Scraper is already running")
            return True
            
        logger.info("Starting continuous scraper...")
        
        try:
            cmd = [
                sys.executable, self.scraper_script
            ]
            if self.fast:
                cmd.append('--fast')
            if isinstance(self.concurrency, int) and self.concurrency > 0:
                cmd.extend(['--concurrency', str(self.concurrency)])
            if isinstance(self.targets_concurrency, int) and self.targets_concurrency > 0:
                cmd.extend(['--targets-concurrency', str(self.targets_concurrency)])
            if self.fresh:
                cmd.append('--fresh')
            
            self.scraper_process = subprocess.Popen(cmd)
            
            logger.info(f"Scraper started with PID: {self.scraper_process.pid}")
            logger.info(f"Command: {' '.join(cmd)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start scraper: {e}")
            return False
    
    def stop_scraper(self):
        """Stop the scraper process"""
        if self.scraper_process:
            logger.info("Stopping scraper...")
            self.scraper_process.terminate()
            try:
                self.scraper_process.wait(timeout=30)
                logger.info("Scraper stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("Scraper didn't stop gracefully, forcing...")
                self.scraper_process.kill()
                self.scraper_process.wait()
                logger.info("Scraper force stopped")
    
    def organize_data(self):
        """Run the data organization script"""
        logger.info("Starting data organization...")
        
        try:
            result = subprocess.run([
                sys.executable, self.organizer_script
            ], capture_output=True, text=True, timeout=600)  # 10 minute timeout
            
            if result.returncode == 0:
                logger.info("Data organization completed successfully")
            else:
                logger.error(f"Data organization failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.error("Data organization timed out")
        except Exception as e:
            logger.error(f"Error during data organization: {e}")
    
    def monitor_and_organize(self):
        """Monitor scraper and restart if it stops"""
        while self.running:
            try:
                # Check if scraper is still running
                if self.scraper_process and self.scraper_process.poll() is not None:
                    logger.warning("Scraper process died, restarting...")
                    self.start_scraper()
                
                time.sleep(60)  # Check every minute
                
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
                break
            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
                time.sleep(60)
    
    def run_continuous(self):
        """Run the scraper continuously"""
        logger.info("Starting continuous scraper mode...")
        self.running = True
        
        # Create necessary directories
        os.makedirs('logs', exist_ok=True)
        os.makedirs('output/scraped_data', exist_ok=True)
        os.makedirs('training_data', exist_ok=True)
        
        # Start scraper
        if not self.start_scraper():
            logger.error("Failed to start scraper")
            return
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=self.monitor_and_organize)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        try:
            # Keep main thread alive
            while self.running:
                time.sleep(10)
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, shutting down...")
            self.running = False
            self.stop_scraper()
            
            # Skipping final data organization in manual mode
            logger.info("Skipping final data organization (manual organize command available)")
            
            logger.info("Continuous scraper shutdown complete")
    
    def get_status(self):
        """Get current status"""
        print("=" * 50)
        print("CONTINUOUS SCRAPER STATUS")
        print("=" * 50)
        
        # Scraper status
        if self.scraper_process and self.scraper_process.poll() is None:
            print(f"Scraper: RUNNING (PID: {self.scraper_process.pid})")
        else:
            print("Scraper: STOPPED")
        
        # Data size info
        if os.path.exists('data_size_tracker.json'):
            try:
                with open('data_size_tracker.json', 'r') as f:
                    data = json.load(f)
                
                total_gb = data.get('total_data_size', 0) / (1024**3)
                current_gb = data.get('current_run_data_size', 0) / (1024**3)
                timestamp = data.get('timestamp', 'Unknown')
                
                print(f"Total Data Collected: {total_gb:.2f} GB")
                print(f"Current Run Data: {current_gb:.2f} GB")
                print(f"Last Update: {timestamp}")
                
            except Exception as e:
                print(f"Error reading data size: {e}")
        
        # Training data info
        training_dir = Path('training_data')
        if training_dir.exists():
            json_files = list(training_dir.glob('*.json'))
            print(f"Training Data Files: {len(json_files)}")
            
            for file in json_files:
                try:
                    file_size_mb = os.path.getsize(file) / (1024**2)
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    if isinstance(data, dict) and 'training_samples' in data:
                        samples = len(data.get('training_samples', []))
                        print(f"  {file.name}: {samples} samples ({file_size_mb:.1f} MB)")
                    else:
                        print(f"  {file.name}: Not in training format ({file_size_mb:.1f} MB)")
                except Exception as e:
                    try:
                        file_size_mb = os.path.getsize(file) / (1024**2)
                    except Exception:
                        file_size_mb = 0
                    print(f"  {file.name}: Error reading ({file_size_mb:.1f} MB) - {e}")
        
        print("=" * 50)


def reset_state_files():
    """Delete local state files to start fresh"""
    removed = []
    for path in STATE_FILES:
        if os.path.exists(path):
            try:
                os.remove(path)
                removed.append(path)
            except Exception as e:
                logger.warning(f"Failed to remove {path}: {e}")
    if removed:
        logger.info(f"Removed state files: {', '.join(removed)}")


def main():
    parser = argparse.ArgumentParser(description='Unified Scraper Controller')
    subparsers = parser.add_subparsers(dest='command', required=True)

    # start
    p_start = subparsers.add_parser('start', help='Start continuous scraping (resumes by default)')
    p_start.add_argument('--fresh', action='store_true', help='Start from scratch (clears local state)')
    p_start.add_argument('--fast', action='store_true', help='Enable high-speed mode for scraper')
    p_start.add_argument('--concurrency', type=int, default=None, help='Per-site worker threads (fast mode)')
    p_start.add_argument('--targets-concurrency', type=int, default=None, help='Sites scraped in parallel')

    # stop
    subparsers.add_parser('stop', help='Stop the scraper if started in this session')

    # status
    subparsers.add_parser('status', help='Show current scraping/training status')

    # organize
    subparsers.add_parser('organize', help='Run training data organization now')

    # targets management
    p_add = subparsers.add_parser('add', help='Add a new target')
    p_add.add_argument('--name', required=True, help='Target name')
    p_add.add_argument('--url', required=True, help='Target URL')
    p_add.add_argument('--type', default='html', help='Target type (default: html)')

    p_remove = subparsers.add_parser('remove', help='Remove a target by URL')
    p_remove.add_argument('--url', required=True, help='Target URL to remove')

    subparsers.add_parser('list', help='List all configured targets')

    args = parser.parse_args()

    if args.command == 'start':
        if args.fresh:
            reset_state_files()
        scraper = ContinuousScraper(fast=args.fast, concurrency=args.concurrency, targets_concurrency=args.targets_concurrency, fresh=args.fresh)
        scraper.run_continuous()

    elif args.command == 'stop':
        # Create a controller to stop only if we have a handle
        scraper = ContinuousScraper()
        scraper.stop_scraper()

    elif args.command == 'status':
        scraper = ContinuousScraper()
        scraper.get_status()

    elif args.command == 'organize':
        scraper = ContinuousScraper()
        scraper.organize_data()

    elif args.command == 'add':
        add_target(args.name, args.url, args.type)

    elif args.command == 'remove':
        remove_target(args.url)

    elif args.command == 'list':
        list_targets_cli()


if __name__ == "__main__":
    main() 