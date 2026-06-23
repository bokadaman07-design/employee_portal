from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import CurrentUser
from database import get_db
from models import Employee, SalaryRecord
from schemas import PayrollSummary, SalaryCreate, SalaryOut, SalaryUpdate


router = APIRouter(prefix="/salary", tags=["Salary"])


def calculate_net_salary(
    base_salary: float, allowances: float, bonus: float, deductions: float
) -> float:
    return round(base_salary + allowances + bonus - deductions, 2)


def get_salary_or_404(db: Session, salary_id: int) -> SalaryRecord:
    salary = db.get(SalaryRecord, salary_id)
    if salary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary record not found")
    return salary


def ensure_employee_exists(db: Session, employee_id: int) -> None:
    if db.get(Employee, employee_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")


@router.post("/", response_model=SalaryOut, status_code=status.HTTP_201_CREATED)
def create_salary_record(
    payload: SalaryCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> SalaryRecord:
    ensure_employee_exists(db, payload.employee_id)
    data = payload.model_dump()
    data["net_salary"] = calculate_net_salary(
        data["base_salary"],
        data["allowances"],
        data["bonus"],
        data["deductions"],
    )
    salary = SalaryRecord(**data)
    db.add(salary)
    db.commit()
    db.refresh(salary)
    return salary


@router.get("/", response_model=list[SalaryOut])
def list_salary_records(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    employee_id: int | None = None,
) -> list[SalaryRecord]:
    statement = select(SalaryRecord).order_by(SalaryRecord.month.desc(), SalaryRecord.created_at.desc())
    if month:
        statement = statement.where(SalaryRecord.month == month)
    if employee_id:
        statement = statement.where(SalaryRecord.employee_id == employee_id)
    return list(db.scalars(statement).all())


@router.get("/summary", response_model=PayrollSummary)
def payroll_summary(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
) -> PayrollSummary:
    row = db.execute(
        select(
            func.count(SalaryRecord.id),
            func.coalesce(func.sum(SalaryRecord.base_salary), 0),
            func.coalesce(func.sum(SalaryRecord.allowances), 0),
            func.coalesce(func.sum(SalaryRecord.bonus), 0),
            func.coalesce(func.sum(SalaryRecord.deductions), 0),
            func.coalesce(func.sum(SalaryRecord.net_salary), 0),
        ).where(SalaryRecord.month == month)
    ).one()
    return PayrollSummary(
        month=month,
        record_count=row[0],
        gross_salary=round(row[1], 2),
        total_allowances=round(row[2], 2),
        total_bonus=round(row[3], 2),
        total_deductions=round(row[4], 2),
        net_payroll=round(row[5], 2),
    )


@router.get("/{salary_id}", response_model=SalaryOut)
def read_salary_record(
    salary_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> SalaryRecord:
    return get_salary_or_404(db, salary_id)


@router.put("/{salary_id}", response_model=SalaryOut)
def update_salary_record(
    salary_id: int,
    payload: SalaryUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> SalaryRecord:
    salary = get_salary_or_404(db, salary_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(salary, field, value)
    salary.net_salary = calculate_net_salary(
        salary.base_salary,
        salary.allowances,
        salary.bonus,
        salary.deductions,
    )
    db.commit()
    db.refresh(salary)
    return salary
