"""add demographic columns

Revision ID: add_demographic_columns_001
Revises: ffbdf1b798b4
Create Date: 2025-01-29 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_demographic_columns_001'
down_revision = 'ffbdf1b798b4'
branch_labels = None
depends_on = None


def upgrade():
    # Add demographic columns
    op.add_column('camera_events', sa.Column('age_group_outcome', sa.String(50), nullable=True))
    op.add_column('camera_events', sa.Column('gender_outcome', sa.String(20), nullable=True))
    
    # Add indexes for performance
    op.create_index('idx_age_group_outcome', 'camera_events', ['age_group_outcome'])
    op.create_index('idx_gender_outcome', 'camera_events', ['gender_outcome'])
    op.create_index('idx_demographic_grouping', 'camera_events', ['person_id', 'age_group_outcome', 'gender_outcome', 'created_at'])
    
    # Update existing null values to "other"
    op.execute("UPDATE camera_events SET age_group_outcome = 'other' WHERE age_group_outcome IS NULL")
    op.execute("UPDATE camera_events SET gender_outcome = 'other' WHERE gender_outcome IS NULL")


def downgrade():
    # Drop indexes
    op.drop_index('idx_demographic_grouping', 'camera_events')
    op.drop_index('idx_gender_outcome', 'camera_events')
    op.drop_index('idx_age_group_outcome', 'camera_events')
    
    # Drop columns
    op.drop_column('camera_events', 'gender_outcome')
    op.drop_column('camera_events', 'age_group_outcome') 