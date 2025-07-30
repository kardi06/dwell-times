import pandas as pd
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from ..models.camera_events import CameraEvent, PersonSession
from ..core.exceptions import ProcessingError

logger = logging.getLogger(__name__)

class DwellTimeEngine:
    """Calculates dwell times from camera events"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_dwell_times(self, start_date: Optional[datetime] = None, 
                            end_date: Optional[datetime] = None) -> Dict:
        """Calculate dwell times for all events in the specified date range"""
        logger.info("Starting dwell time calculations...")
        
        try:
            # Get events for the date range
            query = self.db.query(CameraEvent)
            if start_date:
                query = query.filter(CameraEvent.processed_timestamp >= start_date)
            if end_date:
                query = query.filter(CameraEvent.processed_timestamp <= end_date)
            
            events = query.order_by(CameraEvent.person_id, CameraEvent.camera_id, CameraEvent.processed_timestamp).all()
            
            if not events:
                logger.warning("No events found for dwell time calculation")
                return {'sessions_processed': 0, 'total_dwell_time': 0, 'errors': []}
            
            # Convert to DataFrame for easier processing
            events_df = pd.DataFrame([
                {
                    'id': event.id,
                    'timestamp': event.processed_timestamp,
                    'person_id': event.person_id,
                    'camera_id': event.camera_id,
                    'event_type': event.event_type,
                    'session_id': event.session_id
                }
                for event in events
            ])
            
            # Calculate dwell times
            sessions = self._calculate_sessions(events_df)
            
            # Store sessions in database
            stored_sessions = self._store_sessions(sessions)
            
            # Update camera events with dwell durations
            self._update_events_with_dwell_times(sessions)
            
            # Calculate summary statistics
            summary = self._calculate_summary_stats(sessions)
            
            logger.info(f"Dwell time calculation completed: {len(sessions)} sessions processed")
            return summary
            
        except Exception as e:
            logger.error(f"Dwell time calculation failed: {e}")
            raise ProcessingError(f"Dwell time calculation failed: {str(e)}")
    
    def _calculate_sessions(self, events_df: pd.DataFrame) -> List[Dict]:
        """Calculate sessions from entry/exit events"""
        sessions = []
        
        # Group by person and camera
        for (person_id, camera_id), group in events_df.groupby(['person_id', 'camera_id']):
            # Sort by timestamp
            group = group.sort_values('timestamp')
            
            # Find entry/exit pairs
            entries = group[group['event_type'] == 'entry']
            exits = group[group['event_type'] == 'exit']
            
            # Match entries with exits
            session_pairs = self._match_entries_exits(entries, exits)
            
            for entry, exit_event in session_pairs:
                dwell_duration = int((exit_event['timestamp'] - entry['timestamp']).total_seconds())
                
                session = {
                    'session_id': f"{person_id}_{camera_id}_{entry['timestamp'].strftime('%Y%m%d_%H%M%S')}",
                    'person_id': person_id,
                    'camera_id': camera_id,
                    'entry_time': entry['timestamp'],
                    'exit_time': exit_event['timestamp'],
                    'dwell_duration': dwell_duration
                }
                sessions.append(session)
        
        return sessions
    
    def _match_entries_exits(self, entries: pd.DataFrame, exits: pd.DataFrame) -> List[Tuple]:
        """Match entry events with corresponding exit events"""
        pairs = []
        entry_idx = 0
        exit_idx = 0
        
        while entry_idx < len(entries) and exit_idx < len(exits):
            entry = entries.iloc[entry_idx]
            exit_event = exits.iloc[exit_idx]
            
            # If exit comes before entry, skip the exit
            if exit_event['timestamp'] < entry['timestamp']:
                exit_idx += 1
                continue
            
            # If entry comes before exit, we have a valid pair
            if entry['timestamp'] < exit_event['timestamp']:
                pairs.append((entry.to_dict(), exit_event.to_dict()))
                entry_idx += 1
                exit_idx += 1
            else:
                # Skip this entry if no matching exit found
                entry_idx += 1
        
        return pairs
    
    def _store_sessions(self, sessions: List[Dict]) -> List[PersonSession]:
        """Store calculated sessions in the database"""
        stored_sessions = []
        
        for session_data in sessions:
            # Check if session already exists
            existing = self.db.query(PersonSession).filter(
                PersonSession.session_id == session_data['session_id']
            ).first()
            
            if existing:
                # Update existing session
                existing.exit_time = session_data['exit_time']
                existing.dwell_duration = session_data['dwell_duration']
            else:
                # Create new session
                session = PersonSession(
                    session_id=session_data['session_id'],
                    person_id=session_data['person_id'],
                    camera_id=session_data['camera_id'],
                    entry_time=session_data['entry_time'],
                    exit_time=session_data['exit_time'],
                    dwell_duration=session_data['dwell_duration']
                )
                self.db.add(session)
                stored_sessions.append(session)
        
        self.db.commit()
        return stored_sessions
    
    def _update_events_with_dwell_times(self, sessions: List[Dict]):
        """Update camera events with calculated dwell durations"""
        for session in sessions:
            # Find events in this session
            events = self.db.query(CameraEvent).filter(
                and_(
                    CameraEvent.person_id == session['person_id'],
                    CameraEvent.camera_id == session['camera_id'],
                    CameraEvent.processed_timestamp >= session['entry_time'],
                    CameraEvent.processed_timestamp <= session['exit_time']
                )
            ).all()
            
            # Update events with dwell duration
            for event in events:
                event.dwell_duration = session['dwell_duration']
                event.session_id = session['session_id']
        
        self.db.commit()
    
    def _calculate_summary_stats(self, sessions: List[Dict]) -> Dict:
        """Calculate summary statistics for dwell times"""
        if not sessions:
            return {
                'sessions_processed': 0,
                'total_dwell_time': 0,
                'average_dwell_time': 0,
                'median_dwell_time': 0,
                'max_dwell_time': 0,
                'min_dwell_time': 0
            }
        
        dwell_times = [s['dwell_duration'] for s in sessions]
        
        return {
            'sessions_processed': len(sessions),
            'total_dwell_time': sum(dwell_times),
            'average_dwell_time': sum(dwell_times) / len(dwell_times),
            'median_dwell_time': sorted(dwell_times)[len(dwell_times) // 2],
            'max_dwell_time': max(dwell_times),
            'min_dwell_time': min(dwell_times)
        }
    
    def get_dwell_time_analytics(self, start_date: Optional[datetime] = None,
                                end_date: Optional[datetime] = None,
                                group_by: str = 'person') -> Dict:
        """Get dwell time analytics grouped by specified dimension"""
        
        query = self.db.query(PersonSession)
        
        if start_date:
            query = query.filter(PersonSession.entry_time >= start_date)
        if end_date:
            query = query.filter(PersonSession.exit_time <= end_date)
        
        sessions = query.all()
        
        if not sessions:
            return {'groups': [], 'summary': {}}
        
        # Convert to DataFrame for analysis
        sessions_df = pd.DataFrame([
            {
                'person_id': s.person_id,
                'camera_id': s.camera_id,
                'dwell_duration': s.dwell_duration,
                'entry_time': s.entry_time,
                'exit_time': s.exit_time
            }
            for s in sessions
        ])
        
        if group_by == 'person':
            grouped = sessions_df.groupby('person_id')['dwell_duration'].agg([
                'count', 'mean', 'median', 'max', 'min', 'sum'
            ]).reset_index()
        elif group_by == 'camera':
            grouped = sessions_df.groupby('camera_id')['dwell_duration'].agg([
                'count', 'mean', 'median', 'max', 'min', 'sum'
            ]).reset_index()
        else:
            raise ValueError(f"Unsupported group_by value: {group_by}")
        
        return {
            'groups': grouped.to_dict('records'),
            'summary': {
                'total_sessions': len(sessions),
                'total_dwell_time': sessions_df['dwell_duration'].sum(),
                'average_dwell_time': sessions_df['dwell_duration'].mean(),
                'median_dwell_time': sessions_df['dwell_duration'].median()
            }
        } 