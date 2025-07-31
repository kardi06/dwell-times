#!/usr/bin/env python3
"""
Test script to upload sample data and test filtering functionality
"""

import requests
import json
import time

def test_filtering():
    base_url = "http://localhost:8000"
    
    # Test 1: Upload sample data
    print("1. Uploading sample data...")
    with open("test_data/sample_camera_events.csv", "rb") as f:
        files = {"file": ("sample_camera_events.csv", f, "text/csv")}
        response = requests.post(f"{base_url}/api/v1/analytics/upload-csv", files=files)
        
    if response.status_code == 200:
        print("✅ Sample data uploaded successfully")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Failed to upload sample data: {response.status_code}")
        print(f"Error: {response.text}")
        return
    
    # Wait a moment for processing
    time.sleep(2)
    
    # Test 2: Get all events without filters
    print("\n2. Testing without filters...")
    response = requests.get(f"{base_url}/api/v1/analytics/events")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events without filters")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to get events: {response.status_code}")
        print(f"Error: {response.text}")
        return
    
    # Test 3: Test age group filter
    print("\n3. Testing age group filter (20-29)...")
    response = requests.get(f"{base_url}/api/v1/analytics/events?age_group=20-29")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events with age_group=20-29")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to filter by age group: {response.status_code}")
        print(f"Error: {response.text}")
    
    # Test 4: Test gender filter
    print("\n4. Testing gender filter (male)...")
    response = requests.get(f"{base_url}/api/v1/analytics/events?gender=male")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events with gender=male")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to filter by gender: {response.status_code}")
        print(f"Error: {response.text}")
    
    # Test 5: Test date filter
    print("\n5. Testing date filter (2024-01-01)...")
    response = requests.get(f"{base_url}/api/v1/analytics/events?date=2024-01-01")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events with date=2024-01-01")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to filter by date: {response.status_code}")
        print(f"Error: {response.text}")
    
    # Test 6: Test time period filter
    print("\n6. Testing time period filter (10:00 AM - 11:00 AM)...")
    response = requests.get(f"{base_url}/api/v1/analytics/events?time_period=10:00 AM - 11:00 AM")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events with time_period=10:00 AM - 11:00 AM")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to filter by time period: {response.status_code}")
        print(f"Error: {response.text}")
    
    # Test 7: Test combined filters
    print("\n7. Testing combined filters (date + age_group)...")
    response = requests.get(f"{base_url}/api/v1/analytics/events?date=2024-01-01&age_group=20-29")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data['events'])} events with date=2024-01-01 and age_group=20-29")
        if data['events']:
            print(f"Sample event: {data['events'][0]}")
    else:
        print(f"❌ Failed to filter with combined filters: {response.status_code}")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_filtering() 