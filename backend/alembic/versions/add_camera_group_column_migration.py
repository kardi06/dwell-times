"""Add camera_group column to camera_events table

Revision ID: add_camera_group_column
Revises: add_started_ended_columns
Create Date: 2024-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_camera_group_column'
down_revision = 'add_started_ended_columns'
branch_labels = None
depends_on = None


def upgrade():
    # Add camera_group column
    op.add_column('camera_events', sa.Column('camera_group', sa.String(100), nullable=True))
    
    # Create index for waiting time analytics performance
    op.create_index('idx_camera_events_waiting_time', 'camera_events', 
                   ['dwell_time', 'camera_group', 'camera_description'])


def downgrade():
    # Drop index first
    op.drop_index('idx_camera_events_waiting_time', 'camera_events')
    
    # Drop column
    op.drop_column('camera_events', 'camera_group') 