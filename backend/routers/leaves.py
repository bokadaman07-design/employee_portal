from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import CurrentUser
from database import get_db
from models import Employee, LeaveRequest
from schemas import LeaveCreate, LeaveOut, LeaveStatus, LeaveStatusUpdate, LeaveSummary, LeaveUpdate


router = APIRouter(prefix="/leaves", tags=["Leaves"])


def get_leave_or_404(db: Session, leave_id: int) -> LeaveRequest:
    leave = db.get(LeaveRequest, leave_id)
    if leave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    return leave


def ensure_employee_exists(db: Session, employee_id: int) -> None:
    if db.get(Employee, employee_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")


@router.post("/", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    payload: LeaveCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    ensure_employee_exists(db, payload.employee_id)
    leave = LeaveRequest(**payload.model_dump())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/", response_model=list[LeaveOut])
def list_leave_requests(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    status_filter: LeaveStatus | None = Query(default=None, alias="status"),
    employee_id: int | None = None,
) -> list[LeaveRequest]:
    statement = select(LeaveRequest).order_by(LeaveRequest.created_at.desc())
    if status_filter:
        statement = statement.where(LeaveRequest.status == status_filter)
    if employee_id:
        statement = statement.where(LeaveRequest.employee_id == employee_id)
    return list(db.scalars(statement).all())


@router.get("/summary", response_model=LeaveSummary)
def leave_summary(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveSummary:
    rows = db.execute(
        select(LeaveRequest.status, func.count(LeaveRequest.id)).group_by(LeaveRequest.status)
    ).all()
    counts = {status_name: count for status_name, count in rows}
    pending = counts.get("Pending", 0)
    approved = counts.get("Approved", 0)
    rejected = counts.get("Rejected", 0)
    return LeaveSummary(
        pending=pending,
        approved=approved,
        rejected=rejected,
        total=pending + approved + rejected,
    )


@router.get("/{leave_id}", response_model=LeaveOut)
def read_leave_request(
    leave_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    return get_leave_or_404(db, leave_id)


@router.put("/{leave_id}", response_model=LeaveOut)
def update_leave_request(
    leave_id: int,
    payload: LeaveUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    leave = get_leave_or_404(db, leave_id)
    if payload.start_date and payload.end_date is None and payload.start_date > leave.end_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date range")
    if payload.end_date and payload.start_date is None and payload.end_date < leave.start_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date range")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(leave, field, value)
    db.commit()
    db.refresh(leave)
    return leave


@router.patch("/{leave_id}/status", response_model=LeaveOut)
def update_leave_status(
    leave_id: int,
    payload: LeaveStatusUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    leave = get_leave_or_404(db, leave_id)
    leave.status = payload.status
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/{leave_id}/approve", response_model=LeaveOut)
def approve_leave_request(
    leave_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    leave = get_leave_or_404(db, leave_id)
    leave.status = "Approved"
    db.commit()
    db.refresh(leave)
    return leave


@router.post("/{leave_id}/reject", response_model=LeaveOut)
def reject_leave_request(
    leave_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> LeaveRequest:
    leave = get_leave_or_404(db, leave_id)
    leave.status = "Rejected"
    db.commit()
    db.refresh(leave)
    return leave
