import pandas as pd
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from ..models.camera_events import CameraEvent, PersonSession, AnalyticsCache
from ..core.exceptions import AnalyticsError
import json

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Computes analytics and KPI metrics from camera events"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_kpi_metrics(self, start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> Dict:
        """Calculate real-time KPI metrics"""
        logger.info("Calculating KPI metrics...")
        
        try:
            # Base query for date filtering
            base_query = self.db.query(CameraEvent)
            if start_date:
                base_query = base_query.filter(CameraEvent.timestamp >= start_date)
            if end_date:
                base_query = base_query.filter(CameraEvent.timestamp <= end_date)
            
            # Total unique visitors
            unique_visitors = base_query.with_entities(
                func.count(func.distinct(CameraEvent.person_id))
            ).scalar() or 0
            
            # Total events processed
            total_events = base_query.count()
            
            # Number of cameras with activity
            active_cameras = base_query.with_entities(
                func.count(func.distinct(CameraEvent.camera_id))
            ).scalar() or 0
            
            # Dwell time metrics from sessions
            session_query = self.db.query(PersonSession)
            if start_date:
                session_query = session_query.filter(PersonSession.entry_time >= start_date)
            if end_date:
                session_query = session_query.filter(PersonSession.exit_time <= end_date)
            
            sessions = session_query.all()
            
            if sessions:
                dwell_times = [s.dwell_duration for s in sessions if s.dwell_duration]
                avg_dwell_time = sum(dwell_times) / len(dwell_times) if dwell_times else 0
                max_dwell_time = max(dwell_times) if dwell_times else 0
                median_dwell_time = sorted(dwell_times)[len(dwell_times) // 2] if dwell_times else 0
            else:
                avg_dwell_time = max_dwell_time = median_dwell_time = 0
            
            metrics = {
                'total_unique_visitors': unique_visitors,
                'total_events_processed': total_events,
                'active_cameras_count': active_cameras,
                'average_dwell_time_seconds': round(avg_dwell_time, 2),
                'median_dwell_time_seconds': median_dwell_time,
                'maximum_dwell_time_seconds': max_dwell_time,
                'total_sessions': len(sessions),
                'calculated_at': datetime.now().isoformat()
            }
            
            logger.info(f"KPI metrics calculated: {unique_visitors} visitors, {total_events} events")
            return metrics
            
        except Exception as e:
            logger.error(f"KPI calculation failed: {e}")
            raise AnalyticsError(f"KPI calculation failed: {str(e)}")
    
    def calculate_occupancy_analytics(self, start_date: Optional[datetime] = None,
                                   end_date: Optional[datetime] = None,
                                   time_period: str = 'hour') -> Dict:
        """Calculate occupancy analytics by time periods"""
        logger.info(f"Calculating occupancy analytics for period: {time_period}")
        
        try:
            # Get sessions for the date range
            session_query = self.db.query(PersonSession)
            if start_date:
                session_query = session_query.filter(PersonSession.entry_time >= start_date)
            if end_date:
                session_query = session_query.filter(PersonSession.exit_time <= end_date)
            
            sessions = session_query.all()
            
            if not sessions:
                return {'occupancy_data': [], 'summary': {}}
            
            # Convert to DataFrame for time-based analysis
            sessions_df = pd.DataFrame([
                {
                    'entry_time': s.entry_time,
                    'exit_time': s.exit_time,
                    'person_id': s.person_id,
                    'camera_id': s.camera_id
                }
                for s in sessions
            ])
            
            # Generate time periods
            if time_period == 'hour':
                sessions_df['period'] = sessions_df['entry_time'].dt.floor('H')
            elif time_period == 'day':
                sessions_df['period'] = sessions_df['entry_time'].dt.floor('D')
            elif time_period == 'week':
                sessions_df['period'] = sessions_df['entry_time'].dt.to_period('W').dt.start_time
            else:
                raise ValueError(f"Unsupported time_period: {time_period}")
            
            # Calculate occupancy by period
            occupancy = sessions_df.groupby('period').agg({
                'person_id': 'count',
                'camera_id': 'nunique'
            }).reset_index()
            
            occupancy.columns = ['period', 'visitor_count', 'camera_count']
            
            return {
                'occupancy_data': occupancy.to_dict('records'),
                'summary': {
                    'total_periods': len(occupancy),
                    'max_visitors_period': occupancy['visitor_count'].max() if not occupancy.empty else 0,
                    'avg_visitors_period': occupancy['visitor_count'].mean() if not occupancy.empty else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Occupancy analytics calculation failed: {e}")
            raise AnalyticsError(f"Occupancy analytics failed: {str(e)}")
    
    def calculate_repeat_visitor_stats(self, start_date: Optional[datetime] = None,
                                     end_date: Optional[datetime] = None) -> Dict:
        """Calculate repeat visitor statistics"""
        logger.info("Calculating repeat visitor statistics...")
        
        try:
            # Get all sessions in date range
            session_query = self.db.query(PersonSession)
            if start_date:
                session_query = session_query.filter(PersonSession.entry_time >= start_date)
            if end_date:
                session_query = session_query.filter(PersonSession.exit_time <= end_date)
            
            sessions = session_query.all()
            
            if not sessions:
                return {
                    'repeat_visitors': 0,
                    'unique_visitors': 0,
                    'repeat_rate': 0,
                    'visitor_frequency': {}
                }
            
            # Count visits per person
            visitor_counts = {}
            for session in sessions:
                person_id = session.person_id
                visitor_counts[person_id] = visitor_counts.get(person_id, 0) + 1
            
            # Calculate statistics
            unique_visitors = len(visitor_counts)
            repeat_visitors = sum(1 for count in visitor_counts.values() if count > 1)
            repeat_rate = (repeat_visitors / unique_visitors * 100) if unique_visitors > 0 else 0
            
            # Calculate visit frequency distribution
            frequency_dist = {}
            for count in visitor_counts.values():
                frequency_dist[count] = frequency_dist.get(count, 0) + 1
            
            return {
                'repeat_visitors': repeat_visitors,
                'unique_visitors': unique_visitors,
                'repeat_rate': round(repeat_rate, 2),
                'visitor_frequency': frequency_dist
            }
            
        except Exception as e:
            logger.error(f"Repeat visitor stats calculation failed: {e}")
            raise AnalyticsError(f"Repeat visitor stats failed: {str(e)}")
    
    def get_cached_analytics(self, cache_key: str) -> Optional[Dict]:
        """Get cached analytics data"""
        try:
            cache_entry = self.db.query(AnalyticsCache).filter(
                and_(
                    AnalyticsCache.cache_key == cache_key,
                    or_(
                        AnalyticsCache.expires_at.is_(None),
                        AnalyticsCache.expires_at > datetime.now()
                    )
                )
            ).first()
            
            if cache_entry:
                return json.loads(cache_entry.metric_data)
            return None
            
        except Exception as e:
            logger.error(f"Cache retrieval failed: {e}")
            return None
    
    def cache_analytics(self, cache_key: str, data: Dict, 
                       expires_in_hours: int = 1) -> bool:
        """Cache analytics data"""
        try:
            expires_at = datetime.now() + timedelta(hours=expires_in_hours)
            
            # Check if cache entry exists
            existing = self.db.query(AnalyticsCache).filter(
                AnalyticsCache.cache_key == cache_key
            ).first()
            
            if existing:
                # Update existing entry
                existing.metric_data = json.dumps(data)
                existing.expires_at = expires_at
            else:
                # Create new entry
                cache_entry = AnalyticsCache(
                    cache_key=cache_key,
                    metric_data=json.dumps(data),
                    expires_at=expires_at
                )
                self.db.add(cache_entry)
            
            self.db.commit()
            logger.info(f"Analytics cached with key: {cache_key}")
            return True
            
        except Exception as e:
            logger.error(f"Cache storage failed: {e}")
            return False
    
    def get_comprehensive_analytics(self, start_date: Optional[datetime] = None,
                                  end_date: Optional[datetime] = None) -> Dict:
        """Get comprehensive analytics combining all metrics"""
        logger.info("Calculating comprehensive analytics...")
        
        try:
            # Check cache first
            cache_key = f"analytics_{start_date}_{end_date}" if start_date and end_date else "analytics_all"
            cached_data = self.get_cached_analytics(cache_key)
            
            if cached_data:
                logger.info("Returning cached analytics data")
                return cached_data
            
            # Calculate all metrics
            kpi_metrics = self.calculate_kpi_metrics(start_date, end_date)
            occupancy_data = self.calculate_occupancy_analytics(start_date, end_date)
            repeat_visitor_stats = self.calculate_repeat_visitor_stats(start_date, end_date)
            
            # Combine all analytics
            comprehensive_analytics = {
                'kpi_metrics': kpi_metrics,
                'occupancy_analytics': occupancy_data,
                'repeat_visitor_stats': repeat_visitor_stats,
                'calculated_at': datetime.now().isoformat(),
                'date_range': {
                    'start_date': start_date.isoformat() if start_date else None,
                    'end_date': end_date.isoformat() if end_date else None
                }
            }
            
            # Cache the results
            self.cache_analytics(cache_key, comprehensive_analytics)
            
            return comprehensive_analytics
            
        except Exception as e:
            logger.error(f"Comprehensive analytics calculation failed: {e}")
            raise AnalyticsError(f"Comprehensive analytics failed: {str(e)}") 