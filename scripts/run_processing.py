#!/usr/bin/env python3
"""
Enhanced Data Processing - Main Runner
======================================

This is the main script to run your enhanced data processing pipeline.
It provides multiple options and configurations for different use cases.
"""

import os
import sys
import json
from pathlib import Path

# Add the scripts directory to Python path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from enhanced_data_processor import EnhancedDataProcessor

def load_config(config_name='default'):
    """Load configuration from the config file"""
    config_path = script_dir / 'processing_config.json'
    
    if not config_path.exists():
        print(f"❌ Configuration file not found: {config_path}")
        return None
    
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    if config_name not in config_data['configurations']:
        print(f"❌ Configuration '{config_name}' not found!")
        print(f"Available configurations: {list(config_data['configurations'].keys())}")
        return None
    
    return config_data['configurations'][config_name]

def show_menu():
    """Display the main menu"""
    print("\n" + "="*60)
    print("🚀 ENHANCED DATA PROCESSING PIPELINE")
    print("="*60)
    print("Choose your processing configuration:")
    print()
    print("1. 🎯 Default Processing (Balanced)")
    print("   - Quality threshold: 0.3")
    print("   - Max length: 8000 chars")
    print("   - Shard size: 2GB")
    print()
    print("2. ⭐ High Quality Processing")
    print("   - Quality threshold: 0.7")
    print("   - Max length: 5000 chars")
    print("   - Shard size: 1GB")
    print()
    print("3. 📦 Bulk Processing (Keep More Data)")
    print("   - Quality threshold: 0.2")
    print("   - Max length: 12000 chars")
    print("   - Shard size: 4GB")
    print()
    print("4. 🤖 Training Ready (ML Optimized)")
    print("   - Quality threshold: 0.5")
    print("   - Max length: 6000 chars")
    print("   - Shard size: 1.5GB")
    print()
    print("5. ⚙️ Custom Configuration")
    print("6. 📊 Show Available Configurations")
    print("7. ❌ Exit")
    print("="*60)

def get_custom_config():
    """Get custom configuration from user"""
    print("\n⚙️ Custom Configuration")
    print("-" * 30)
    
    try:
        base_dir = input(f"Base directory [{r'D:\medarion_scraper_output'}]: ").strip()
        if not base_dir:
            base_dir = r'D:\medarion_scraper_output'
        
        max_length = input("Max content length [8000]: ").strip()
        max_length = int(max_length) if max_length else 8000
        
        min_length = input("Min content length [100]: ").strip()
        min_length = int(min_length) if min_length else 100
        
        shard_size = input("Shard size in GB [2.0]: ").strip()
        shard_size = float(shard_size) if shard_size else 2.0
        
        quality_threshold = input("Quality threshold [0.3]: ").strip()
        quality_threshold = float(quality_threshold) if quality_threshold else 0.3
        
        return {
            'base_dir': base_dir,
            'max_content_length': max_length,
            'min_content_length': min_length,
            'shard_size_gb': shard_size,
            'quality_threshold': quality_threshold
        }
    except ValueError as e:
        print(f"❌ Invalid input: {e}")
        return None

def show_configurations():
    """Show all available configurations"""
    config_path = script_dir / 'processing_config.json'
    
    if not config_path.exists():
        print(f"❌ Configuration file not found: {config_path}")
        return
    
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    print("\n📊 Available Configurations:")
    print("-" * 40)
    
    for name, config in config_data['configurations'].items():
        print(f"\n🔧 {name.upper()}")
        print(f"   Description: {config['description']}")
        print(f"   Max length: {config['max_content_length']:,} chars")
        print(f"   Min length: {config['min_content_length']:,} chars")
        print(f"   Quality threshold: {config['quality_threshold']}")
        print(f"   Shard size: {config['shard_size_gb']} GB")

def run_processing(config_name, custom_config=None):
    """Run the processing with the specified configuration"""
    
    if custom_config:
        # Use custom configuration
        base_dir = custom_config['base_dir']
        settings = {k: v for k, v in custom_config.items() if k != 'base_dir'}
    else:
        # Load configuration from file
        config = load_config(config_name)
        if not config:
            return False
        
        base_dir = r'D:\medarion_scraper_output'  # Default path
        settings = {k: v for k, v in config.items() if k != 'description'}
    
    # Check if base directory exists
    if not os.path.exists(base_dir):
        print(f"❌ Base directory not found: {base_dir}")
        print("Please update the path or create the directory.")
        return False
    
    print(f"\n🚀 Starting {config_name} processing...")
    print(f"📁 Source: {base_dir}")
    print(f"⚙️ Settings: {settings}")
    print("-" * 50)
    
    # Create processor
    processor = EnhancedDataProcessor(
        base_dir=base_dir,
        **settings
    )
    
    # Run processing
    try:
        outputs = processor.run_full_pipeline()
        
        print("\n" + "="*60)
        print("🎉 PROCESSING COMPLETE!")
        print("="*60)
        print(f"📄 Total records: {processor.stats.total_records:,}")
        print(f"📊 Files processed: {processor.stats.processed_files:,}/{processor.stats.total_files:,}")
        print(f"⏱️ Processing time: {processor.stats.processing_time:.1f} seconds")
        print(f"💾 Total size: {processor.stats.total_size_bytes / 1024**2:.1f} MB")
        print(f"🧹 Files cleaned: {processor.stats.deleted_files:,}")
        print(f"📁 Output directory: {processor.output_dir}")
        print("="*60)
        
        if outputs:
            print("\n📁 Generated files:")
            for key, value in outputs.items():
                if isinstance(value, list):
                    print(f"  {key}: {len(value)} files")
                else:
                    print(f"  {key}: {os.path.basename(value)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function with interactive menu"""
    
    while True:
        show_menu()
        
        try:
            choice = input("\nEnter your choice (1-7): ").strip()
            
            if choice == '1':
                run_processing('default')
            elif choice == '2':
                run_processing('high_quality')
            elif choice == '3':
                run_processing('bulk_processing')
            elif choice == '4':
                run_processing('training_ready')
            elif choice == '5':
                custom_config = get_custom_config()
                if custom_config:
                    run_processing('custom', custom_config)
            elif choice == '6':
                show_configurations()
            elif choice == '7':
                print("\n👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-7.")
                continue
            
            if choice in ['1', '2', '3', '4', '5']:
                input("\nPress Enter to continue...")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
