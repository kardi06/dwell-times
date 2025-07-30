#!/usr/bin/env python3
"""
Script to create a test user for the Dwell-Insight Analytics Platform
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User

def create_test_user():
    """Create a test user for development"""
    db = SessionLocal()
    
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("Test user 'admin' already exists")
            return
        
        # Create test user
        test_user = User(
            username="admin",
            email="admin@dwell-insight.com",
            hashed_password=User.get_password_hash("admin123"),
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("Test user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Email: admin@dwell-insight.com")
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 