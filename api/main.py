import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from api.config import validate_required_env
from api.routers import health
from api.routers import webhooks
from api.routers import stripe_webhooks
from api.routers import callrail_webhooks
from api.services.supabase_client import init_supabase

import sentry_sdk

_sentry_dsn = os.environ.get("SENTRY_DSN")
if _sentry_dsn:
    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        environment=os.environ.get("RAILWAY_ENVIRONMENT", "production"),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_env()
    init_supabase()
    yield


app = FastAPI(title="Tradeflow API", version="0.1.0", lifespan=lifespan)
app.include_router(health.router)
app.include_router(webhooks.router)
app.include_router(stripe_webhooks.router)
app.include_router(callrail_webhooks.router)
