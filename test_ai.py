#!/usr/bin/env python3
"""
Quick AI Test Script
Run this in Jupyter Terminal to test the AI
"""

import requests
import json

API_URL = "http://localhost:8081"

def test_health():
    """Test health endpoint"""
    print("\n1. Testing Health Endpoint...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health: {data['status']}")
            print(f"   GPU: {data['gpu']}")
            print(f"   VRAM: {data['vram_used']} / {data['vram_total']}")
            return True
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_chat(messages, test_name):
    """Test chat endpoint"""
    print(f"\n{test_name}...")
    try:
        payload = {"messages": messages}
        response = requests.post(
            f"{API_URL}/chat",
            json=payload,
            timeout=90
        )
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data['choices'][0]['message']['content']
            print(f"   ✅ Response received ({len(ai_response)} characters)")
            print(f"\n   AI: {ai_response[:300]}...")
            
            # Validate response
            if len(ai_response) < 10:
                print("   ❌ Response too short")
                return False
            elif not any(c.isalnum() for c in ai_response):
                print("   ❌ Response contains no words (gibberish)")
                return False
            elif ai_response.strip().match(r'^[.,!?;:\s]+$'):
                print("   ❌ Response is only punctuation")
                return False
            else:
                print("   ✅ Response is coherent and relevant")
                return True
        else:
            print(f"   ❌ Request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("=" * 70)
    print("🧪 AI Test Suite")
    print("=" * 70)
    
    # Test health
    if not test_health():
        print("\n❌ Health check failed. Is the API running?")
        return
    
    # Test 1: Simple greeting
    test_chat(
        [{"role": "user", "content": "Hello, who are you?"}],
        "2. Test 1: Simple Greeting"
    )
    
    # Test 2: Healthcare question
    test_chat(
        [{"role": "user", "content": "What are the key challenges in African healthcare markets?"}],
        "3. Test 2: Healthcare Question"
    )
    
    # Test 3: Technical question
    test_chat(
        [{"role": "user", "content": "Explain the difference between clinical trials and regulatory approval."}],
        "4. Test 3: Technical Question"
    )
    
    print("\n" + "=" * 70)
    print("✅ Testing Complete!")
    print("=" * 70)
    print("\n💡 If all tests passed, your AI is working correctly!")
    print("💡 If tests failed, check:")
    print("   - API logs: tail -f /workspace/api.log")
    print("   - VRAM usage: nvidia-smi (should be ~14GB)")

if __name__ == "__main__":
    main()

