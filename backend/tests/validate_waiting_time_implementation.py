#!/usr/bin/env python3
"""
Validation script for waiting time analytics implementation
"""

import sys
import os
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# Tentukan root folder (backend) sebagai path pencarian modul
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)

from app.api.analytics.waiting_time_analytics import router
from fastapi import FastAPI
from fastapi.testclient import TestClient

def validate_implementation():
    """Validate the waiting time analytics implementation"""
    
    print("🔍 Validating Waiting Time Analytics Implementation...")
    
    # Check if the module can be imported
    try:
        from app.api.analytics.waiting_time_analytics import router
        print("✅ Waiting time analytics module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import waiting time analytics module: {e}")
        return False
    
    # Check if the router has the expected endpoint
    routes = [route for route in router.routes]
    waiting_time_routes = [route for route in routes if "waiting-time" in str(route.path)]
    
    if waiting_time_routes:
        print("✅ Waiting time endpoint found in router")
    else:
        print("❌ Waiting time endpoint not found in router")
        return False
    
    # Check if the endpoint is properly configured
    for route in waiting_time_routes:
        if hasattr(route, 'methods') and 'GET' in route.methods:
            print("✅ GET method configured for waiting time endpoint")
        else:
            print("❌ GET method not configured for waiting time endpoint")
            return False
    
    # Test the endpoint structure
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    
    try:
        # Test with invalid parameters to check error handling
        response = client.get("/waiting-time", params={"view_type": "invalid"})
        if response.status_code == 400:
            print("✅ Error handling works correctly")
        else:
            print("❌ Error handling not working correctly")
            return False
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
        return False
    
    print("✅ All validations passed!")
    return True

def check_database_model():
    """Check if camera_group column is in the model"""
    
    print("\n🔍 Checking Database Model...")
    
    try:
        from app.models.camera_events import CameraEvent
        
        # Check if camera_group column exists
        if hasattr(CameraEvent, 'camera_group'):
            print("✅ camera_group column found in CameraEvent model")
        else:
            print("❌ camera_group column not found in CameraEvent model")
            return False
        
        # Check if the column is properly configured
        camera_group_col = CameraEvent.camera_group
        if camera_group_col.nullable:
            print("✅ camera_group column is nullable (as expected)")
        else:
            print("⚠️ camera_group column is not nullable")
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import CameraEvent model: {e}")
        return False

def check_migration():
    """Check if migration file exists"""
    
    print("\n🔍 Checking Migration...")
    
    migration_file = "alembic/versions/add_camera_group_column_migration.py"
    
    if os.path.exists(migration_file):
        print("✅ Migration file exists")
        
        # Check migration content
        with open(migration_file, 'r') as f:
            content = f.read()
            
        if 'camera_group' in content:
            print("✅ Migration includes camera_group column")
        else:
            print("❌ Migration doesn't include camera_group column")
            return False
            
        if 'idx_camera_events_waiting_time' in content:
            print("✅ Migration includes waiting time index")
        else:
            print("❌ Migration doesn't include waiting time index")
            return False
            
        return True
    else:
        print("❌ Migration file not found")
        return False

def main():
    """Main validation function"""
    
    print("🚀 Starting Waiting Time Analytics Implementation Validation\n")
    
    checks = [
        ("Implementation", validate_implementation),
        ("Database Model", check_database_model),
        ("Migration", check_migration)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"\n{'='*50}")
        print(f"Checking: {check_name}")
        print('='*50)
        
        if not check_func():
            all_passed = False
    
    print(f"\n{'='*50}")
    if all_passed:
        print("🎉 ALL VALIDATIONS PASSED!")
        print("✅ Task 2 implementation is complete and ready for testing")
    else:
        print("❌ Some validations failed")
        print("Please fix the issues before proceeding")
    print('='*50)

if __name__ == "__main__":
    main() 