"""
ReklamAI v2.0 — API Tests
Tests all endpoints using FastAPI TestClient + SQLite in-memory DB.
"""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Force SQLite for tests BEFORE importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["INNGEST_DEV"] = "1"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["KIE_API_KEY"] = "test-key"

from app.main import app  # noqa: E402
from app.database import engine, Base  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ════════════════════════════════════════════════
# HEALTH
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "running 🚀"


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


# ════════════════════════════════════════════════
# AUTH: Register
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    res = await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    # First registration
    await client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "password123",
    })
    # Duplicate
    res = await client.post("/auth/register", json={
        "email": "dup@example.com",
        "password": "password123",
    })
    assert res.status_code == 409


# ════════════════════════════════════════════════
# AUTH: Login
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    # Register first
    await client.post("/auth/register", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    # Login
    res = await client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "wrong@example.com",
        "password": "correct123",
    })
    res = await client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


# ════════════════════════════════════════════════
# AUTH: Me
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_me(client: AsyncClient):
    # Register and get token
    reg = await client.post("/auth/register", json={
        "email": "me@example.com",
        "password": "password123",
    })
    token = reg.json()["access_token"]

    # Get me
    res = await client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_me_no_auth(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 401


# ════════════════════════════════════════════════
# CREDITS
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_credits(client: AsyncClient):
    reg = await client.post("/auth/register", json={
        "email": "credits@example.com",
        "password": "password123",
    })
    token = reg.json()["access_token"]

    res = await client.get("/api/credits", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["balance"] == 50.0  # Welcome bonus
    assert data["total_earned"] == 50.0


# ════════════════════════════════════════════════
# GENERATIONS: List (empty)
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_generations_list_empty(client: AsyncClient):
    reg = await client.post("/auth/register", json={
        "email": "gen@example.com",
        "password": "password123",
    })
    token = reg.json()["access_token"]

    res = await client.get("/api/generations", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0


# ════════════════════════════════════════════════
# Helper: register + get auth headers
# ════════════════════════════════════════════════
async def auth_headers(client: AsyncClient, email: str = "user@example.com") -> dict:
    """Register a user and return Authorization headers."""
    reg = await client.post("/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Test User",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════
# GENERATIONS: Status filter
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_generations_status_filter(client: AsyncClient):
    headers = await auth_headers(client, "filter@example.com")

    # No generations, filter by processing
    res = await client.get("/api/generations?status=processing", headers=headers)
    assert res.status_code == 200
    assert res.json()["items"] == []
    assert res.json()["total"] == 0

    # Filter by queued (also empty)
    res = await client.get("/api/generations?status=queued", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 0


@pytest.mark.asyncio
async def test_generations_no_auth(client: AsyncClient):
    res = await client.get("/api/generations")
    assert res.status_code == 401


# ════════════════════════════════════════════════
# MODELS: List
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_models_list(client: AsyncClient):
    res = await client.get("/api/models")
    assert res.status_code == 200
    # Empty list by default (no models seeded)
    assert isinstance(res.json(), list)


# ════════════════════════════════════════════════
# BOARDS: CRUD
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_boards_create(client: AsyncClient):
    headers = await auth_headers(client, "board_create@example.com")

    res = await client.post("/api/boards", headers=headers, json={
        "title": "My Board",
        "description": "Test description",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "My Board"
    assert data["description"] == "Test description"
    assert data["is_pinned"] is False
    assert data["items_count"] == 0
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_boards_create_validation(client: AsyncClient):
    headers = await auth_headers(client, "board_val@example.com")

    # Empty title should fail
    res = await client.post("/api/boards", headers=headers, json={
        "title": "",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_boards_list(client: AsyncClient):
    headers = await auth_headers(client, "board_list@example.com")

    # Initially empty
    res = await client.get("/api/boards", headers=headers)
    assert res.status_code == 200
    assert res.json() == []

    # Create two boards
    await client.post("/api/boards", headers=headers, json={"title": "Board A"})
    await client.post("/api/boards", headers=headers, json={"title": "Board B"})

    # Now should have 2
    res = await client.get("/api/boards", headers=headers)
    assert res.status_code == 200
    boards = res.json()
    assert len(boards) == 2
    # Ordered by created_at DESC
    assert boards[0]["title"] == "Board B"
    assert boards[1]["title"] == "Board A"


@pytest.mark.asyncio
async def test_boards_delete(client: AsyncClient):
    headers = await auth_headers(client, "board_del@example.com")

    # Create a board
    create_res = await client.post("/api/boards", headers=headers, json={
        "title": "Delete Me",
    })
    board_id = create_res.json()["id"]

    # Delete it
    res = await client.delete(f"/api/boards/{board_id}", headers=headers)
    assert res.status_code == 204

    # Verify it's gone
    res = await client.get("/api/boards", headers=headers)
    assert len(res.json()) == 0


@pytest.mark.asyncio
async def test_boards_delete_not_found(client: AsyncClient):
    headers = await auth_headers(client, "board_404@example.com")
    res = await client.delete("/api/boards/nonexistent-id", headers=headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_boards_no_auth(client: AsyncClient):
    res = await client.get("/api/boards")
    assert res.status_code == 401

    res = await client.post("/api/boards", json={"title": "Nope"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_boards_isolation(client: AsyncClient):
    """User A's boards should not be visible to User B."""
    headers_a = await auth_headers(client, "user_a@example.com")
    headers_b = await auth_headers(client, "user_b@example.com")

    # User A creates a board
    await client.post("/api/boards", headers=headers_a, json={"title": "A's Board"})

    # User B should see 0 boards
    res = await client.get("/api/boards", headers=headers_b)
    assert len(res.json()) == 0

    # User A should see 1 board
    res = await client.get("/api/boards", headers=headers_a)
    assert len(res.json()) == 1


# ════════════════════════════════════════════════
# FILE UPLOAD
# ════════════════════════════════════════════════
@pytest.mark.asyncio
async def test_upload_file(client: AsyncClient):
    headers = await auth_headers(client, "upload@example.com")

    # Create a tiny PNG
    import io
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        b'\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05'
        b'\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )

    res = await client.post(
        "/api/upload",
        headers=headers,
        files={"file": ("test.png", io.BytesIO(png_data), "image/png")},
        data={"purpose": "referenceImage"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["bucket"] == "uploads"
    assert "/api/files/" in data["path"]
    assert data["path"].endswith(".png")


@pytest.mark.asyncio
async def test_upload_invalid_purpose(client: AsyncClient):
    headers = await auth_headers(client, "upload_bad@example.com")

    import io
    res = await client.post(
        "/api/upload",
        headers=headers,
        files={"file": ("test.png", io.BytesIO(b'\x89PNG'), "image/png")},
        data={"purpose": "invalidPurpose"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_upload_no_auth(client: AsyncClient):
    import io
    res = await client.post(
        "/api/upload",
        files={"file": ("test.png", io.BytesIO(b'\x89PNG'), "image/png")},
        data={"purpose": "referenceImage"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_and_serve(client: AsyncClient):
    """Upload a file and verify it can be served back."""
    headers = await auth_headers(client, "serve@example.com")

    import io
    png_data = b'\x89PNG\r\n\x1a\nTESTDATA'

    upload_res = await client.post(
        "/api/upload",
        headers=headers,
        files={"file": ("img.png", io.BytesIO(png_data), "image/png")},
        data={"purpose": "startFrame"},
    )
    assert upload_res.status_code == 200
    path = upload_res.json()["path"]

    # Fetch the file
    serve_res = await client.get(path)
    assert serve_res.status_code == 200
    assert serve_res.content == png_data

