"""Initial tables — users, credits, models, presets, generations

Revision ID: 001_initial
Revises: None
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), server_default=""),
        sa.Column("avatar_url", sa.Text, server_default=""),
        sa.Column("role", sa.String(20), server_default="user"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ── credit_accounts ──
    op.create_table(
        "credit_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("balance", sa.Float, server_default="0"),
        sa.Column("total_earned", sa.Float, server_default="0"),
        sa.Column("total_spent", sa.Float, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ── models ──
    op.create_table(
        "models",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("provider", sa.String(50), server_default="kie"),
        sa.Column("provider_model_id", sa.String(200), server_default=""),
        sa.Column("category", sa.String(50), server_default="image"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("price_multiplier", sa.Float, server_default="1.0"),
        sa.Column("config", sa.JSON, server_default="{}"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ── presets ──
    op.create_table(
        "presets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("category", sa.String(50), server_default="image"),
        sa.Column("description", sa.Text, server_default=""),
        sa.Column("defaults", sa.JSON, server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    # ── generations ──
    op.create_table(
        "generations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("model_id", sa.String(36), sa.ForeignKey("models.id"), nullable=True),
        sa.Column("prompt", sa.Text, server_default=""),
        sa.Column("negative_prompt", sa.Text, server_default=""),
        sa.Column("preset_slug", sa.String(100), server_default=""),
        sa.Column("aspect_ratio", sa.String(20), server_default="16:9"),
        sa.Column("duration", sa.Integer, server_default="10"),
        sa.Column("input_image_url", sa.Text, server_default=""),
        sa.Column("reference_image_url", sa.Text, server_default=""),
        sa.Column("params", sa.JSON, server_default="{}"),
        sa.Column("status", sa.String(30), server_default="queued", index=True),
        sa.Column("progress", sa.Integer, server_default="0"),
        sa.Column("result_url", sa.Text, server_default=""),
        sa.Column("result_urls", sa.JSON, server_default="[]"),
        sa.Column("thumbnail_url", sa.Text, server_default=""),
        sa.Column("error_message", sa.Text, server_default=""),
        sa.Column("provider_task_id", sa.String(200), server_default="", index=True),
        sa.Column("provider_response", sa.JSON, server_default="{}"),
        sa.Column("credits_reserved", sa.Float, server_default="0"),
        sa.Column("credits_final", sa.Float, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
    )

    # ── credit_transactions ──
    op.create_table(
        "credit_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("credit_accounts.id"), nullable=False),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("generation_id", sa.String(36), sa.ForeignKey("generations.id"), nullable=True),
        sa.Column("meta", sa.JSON, server_default="{}"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("credit_transactions")
    op.drop_table("generations")
    op.drop_table("presets")
    op.drop_table("models")
    op.drop_table("credit_accounts")
    op.drop_table("users")
