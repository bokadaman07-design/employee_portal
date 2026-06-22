from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import CurrentUser
from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate


router = APIRouter(prefix="/employees", tags=["Employees"])


def get_employee_or_404(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.post("/", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Employee:
    employee = Employee(**payload.model_dump())
    db.add(employee)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employee with this email already exists",
        ) from exc
    db.refresh(employee)
    return employee


@router.get("/", response_model=list[EmployeeOut])
def list_employees(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(default=None, description="Search by name, email, role, or phone"),
) -> list[Employee]:
    statement = select(Employee).order_by(Employee.created_at.desc())
    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Employee.first_name.ilike(pattern),
                Employee.last_name.ilike(pattern),
                Employee.email.ilike(pattern),
                Employee.phone.ilike(pattern),
                Employee.role.ilike(pattern),
            )
        )
    return list(db.scalars(statement).all())


@router.get("/{employee_id}", response_model=EmployeeOut)
def read_employee(
    employee_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Employee:
    return get_employee_or_404(db, employee_id)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Employee:
    employee = get_employee_or_404(db, employee_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employee with this email already exists",
        ) from exc
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    employee = get_employee_or_404(db, employee_id)
    db.delete(employee)
    db.commit()
