"""Add started and ended readable columns

Revision ID: add_started_ended_columns
Revises: ffbdf1b798b4
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_started_ended_columns'
down_revision = 'ffbdf1b798b4'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new columns
    op.add_column('camera_events', sa.Column('utc_time_started_readable', sa.String(100), nullable=True))
    op.add_column('camera_events', sa.Column('utc_time_ended_readable', sa.String(100), nullable=True))
    
    # Create indexes for better performance
    op.create_index('idx_utc_time_started_readable', 'camera_events', ['utc_time_started_readable'])
    op.create_index('idx_utc_time_ended_readable', 'camera_events', ['utc_time_ended_readable'])


def downgrade():
    # Drop indexes first
    op.drop_index('idx_utc_time_ended_readable', 'camera_events')
    op.drop_index('idx_utc_time_started_readable', 'camera_events')
    
    # Drop columns
    op.drop_column('camera_events', 'utc_time_ended_readable')
    op.drop_column('camera_events', 'utc_time_started_readable') 