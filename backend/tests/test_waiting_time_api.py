#!/usr/bin/env python3
"""
Test script for waiting time analytics API endpoint
"""

import requests
import json
from datetime import datetime, timedelta

def test_waiting_time_endpoint():
    """Test the waiting time analytics endpoint"""
    
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/analytics/waiting-time"
    
    # Test parameters
    params = {
        "view_type": "hourly",
        "start_date": "2024-01-01",
        "end_date": "2024-01-02"
    }
    
    try:
        print("Testing waiting time analytics endpoint...")
        print(f"URL: {base_url}{endpoint}")
        print(f"Parameters: {params}")
        
        response = requests.get(f"{base_url}{endpoint}", params=params)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
            
            # Validate response structure
            if "data" in data and "metadata" in data:
                print("✅ Response structure is valid")
                print(f"📊 Total records: {data['metadata']['total_records']}")
                print(f"📈 Data points: {len(data['data'])}")
            else:
                print("❌ Invalid response structure")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_waiting_time_endpoint() 