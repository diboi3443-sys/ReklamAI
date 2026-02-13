"""
ReklamAI v2.0 — Board Routes
CRUD operations for user boards (collections of generations).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.database import get_db
from app.models import User, Board, Generation
from app.schemas import BoardCreateRequest, BoardResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["boards"])


@router.get("/boards", response_model=list[BoardResponse])
async def list_boards(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список досок пользователя."""
    result = await db.execute(
        select(Board)
        .where(Board.owner_id == user.id)
        .order_by(desc(Board.created_at))
    )
    boards = result.scalars().all()

    # Count generations per board
    response = []
    for board in boards:
        count_res = await db.execute(
            select(func.count())
            .select_from(Generation)
            .where(Generation.user_id == user.id)
            # TODO: add board_id FK to Generation when needed
        )
        items_count = 0  # placeholder until board_id is on Generation

        resp = BoardResponse.model_validate(board)
        resp.items_count = items_count
        response.append(resp)

    return response


@router.post("/boards", response_model=BoardResponse, status_code=201)
async def create_board(
    req: BoardCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Создать новую доску."""
    board = Board(
        owner_id=user.id,
        title=req.title,
        description=req.description,
    )
    db.add(board)
    await db.commit()
    await db.refresh(board)

    resp = BoardResponse.model_validate(board)
    resp.items_count = 0
    return resp


@router.delete("/boards/{board_id}", status_code=204)
async def delete_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить доску."""
    result = await db.execute(
        select(Board).where(Board.id == board_id, Board.owner_id == user.id)
    )
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    await db.delete(board)
    await db.commit()
