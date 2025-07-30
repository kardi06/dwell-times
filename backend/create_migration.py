#!/usr/bin/env python3
"""
Script to create database migration for updated camera_events schema
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.camera_events import Base
from app.core.database import engine

def create_tables():
    """Create all tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Verify tables exist
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"📋 Available tables: {tables}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

def drop_and_recreate():
    """Drop and recreate tables (for development)"""
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("🗑️ Dropped existing tables")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Recreated tables successfully!")
        
    except Exception as e:
        print(f"❌ Error recreating tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 Database Migration Script")
    print("=" * 40)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--recreate":
        print("🔄 Recreating tables...")
        success = drop_and_recreate()
    else:
        print("📦 Creating tables...")
        success = create_tables()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("🚀 You can now test the CSV upload functionality.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1) 