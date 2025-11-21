#!/usr/bin/env python3
"""
Recommended GPU types for testing Mistral 7B model on Vast.ai
"""
print("=" * 70)
print("🎮 RECOMMENDED GPU TYPES FOR MISTRAL 7B TESTING")
print("=" * 70)

# VRAM requirements
min_vram = 15.5  # GB
recommended_vram = 17.0  # GB
optimal_vram = 20.0  # GB

print(f"\n💾 VRAM Requirements:")
print(f"   Minimum: {min_vram} GB")
print(f"   Recommended: {recommended_vram} GB")
print(f"   Optimal: {optimal_vram}+ GB")

print(f"\n" + "=" * 70)
print("✅ RECOMMENDED GPU OPTIONS (Best to Good)")
print("=" * 70)

gpu_options = [
    {
        "name": "NVIDIA RTX 4090",
        "vram": 24,
        "tflops": 83,
        "cost": "$$$",
        "rating": "⭐⭐⭐⭐⭐",
        "notes": "Best option - plenty of headroom, fastest"
    },
    {
        "name": "NVIDIA RTX 3090",
        "vram": 24,
        "tflops": 36,
        "cost": "$$",
        "rating": "⭐⭐⭐⭐⭐",
        "notes": "Excellent - 24GB perfect for 7B models"
    },
    {
        "name": "NVIDIA A6000",
        "vram": 48,
        "tflops": 38,
        "cost": "$$$$",
        "rating": "⭐⭐⭐⭐⭐",
        "notes": "Professional - massive VRAM, very reliable"
    },
    {
        "name": "NVIDIA RTX 4080",
        "vram": 16,
        "tflops": 49,
        "cost": "$$$",
        "rating": "⭐⭐⭐⭐",
        "notes": "Good - 16GB works but tight, fast"
    },
    {
        "name": "NVIDIA RTX 3080 Ti",
        "vram": 12,
        "tflops": 34,
        "cost": "$$",
        "rating": "⭐⭐",
        "notes": "Too small - 12GB insufficient for 7B"
    },
    {
        "name": "NVIDIA A5000",
        "vram": 24,
        "tflops": 27,
        "cost": "$$$",
        "rating": "⭐⭐⭐⭐⭐",
        "notes": "Professional - 24GB perfect, reliable"
    },
    {
        "name": "NVIDIA A4000",
        "vram": 16,
        "tflops": 19,
        "cost": "$$",
        "rating": "⭐⭐⭐⭐",
        "notes": "Good - 16GB works, professional grade"
    },
    {
        "name": "NVIDIA RTX 4070 Ti",
        "vram": 12,
        "tflops": 40,
        "cost": "$$",
        "rating": "⭐⭐",
        "notes": "Too small - 12GB insufficient"
    },
]

# Filter and sort by VRAM
recommended = [gpu for gpu in gpu_options if gpu["vram"] >= min_vram]
recommended.sort(key=lambda x: x["vram"], reverse=True)

print(f"\n🎯 BEST OPTIONS (20GB+ VRAM - Optimal):")
print("-" * 70)
for gpu in recommended:
    if gpu["vram"] >= 20:
        print(f"\n{gpu['rating']} {gpu['name']}")
        print(f"   VRAM: {gpu['vram']} GB")
        print(f"   Performance: {gpu['tflops']} TFLOPS")
        print(f"   Cost: {gpu['cost']}")
        print(f"   {gpu['notes']}")

print(f"\n✅ GOOD OPTIONS (16-19GB VRAM - Works Well):")
print("-" * 70)
for gpu in recommended:
    if 16 <= gpu["vram"] < 20:
        print(f"\n{gpu['rating']} {gpu['name']}")
        print(f"   VRAM: {gpu['vram']} GB")
        print(f"   Performance: {gpu['tflops']} TFLOPS")
        print(f"   Cost: {gpu['cost']}")
        print(f"   {gpu['notes']}")

print(f"\n⚠️  MINIMUM OPTIONS (15-16GB VRAM - Tight but Works):")
print("-" * 70)
for gpu in recommended:
    if 15 <= gpu["vram"] < 16:
        print(f"\n{gpu['rating']} {gpu['name']}")
        print(f"   VRAM: {gpu['vram']} GB")
        print(f"   Performance: {gpu['tflops']} TFLOPS")
        print(f"   Cost: {gpu['cost']}")
        print(f"   {gpu['notes']}")

print(f"\n" + "=" * 70)
print("💡 RECOMMENDATIONS FOR TESTING")
print("=" * 70)

print(f"\n🥇 BEST CHOICE: RTX 3090 or RTX 4090")
print(f"   - 24GB VRAM (plenty of headroom)")
print(f"   - Fast inference")
print(f"   - Good availability on Vast.ai")
print(f"   - Reasonable cost")

print(f"\n🥈 GOOD CHOICE: RTX 4080 or A4000")
print(f"   - 16GB VRAM (works well)")
print(f"   - Fast enough for testing")
print(f"   - More affordable")

print(f"\n🥉 BUDGET CHOICE: Your current 15.9GB")
print(f"   - Will work with optimizations")
print(f"   - May need cache clearing")
print(f"   - Good for initial testing")

print(f"\n" + "=" * 70)
print("📋 WHAT TO LOOK FOR ON VAST.AI")
print("=" * 70)

print(f"\n✅ Minimum Requirements:")
print(f"   - VRAM: 16GB+ (20GB+ recommended)")
print(f"   - GPU: NVIDIA (CUDA support)")
print(f"   - CUDA Compute: 7.0+ (for modern PyTorch)")

print(f"\n✅ Recommended Specs:")
print(f"   - VRAM: 20-24GB (optimal)")
print(f"   - GPU: RTX 3090, RTX 4090, A5000, A6000")
print(f"   - TFLOPS: 30+ (faster inference)")
print(f"   - Price: $0.50-2.00/hour (varies)")

print(f"\n💡 TIPS:")
print(f"   - Filter Vast.ai by VRAM: 20GB+")
print(f"   - Look for RTX 3090/4090 or A-series GPUs")
print(f"   - Check CUDA version compatibility")
print(f"   - Start with cheaper options for testing")

print("\n" + "=" * 70)

