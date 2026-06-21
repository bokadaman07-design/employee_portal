from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


EmploymentStatus = Literal["Active", "Inactive", "On Leave", "Terminated"]
LeaveStatus = Literal["Pending", "Approved", "Rejected"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    country_code: str | None = Field(default=None, max_length=10)
    role: str = Field(..., min_length=1, max_length=120)
    employment_status: EmploymentStatus = "Active"


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    country_code: str | None = Field(default=None, max_length=10)
    role: str | None = Field(default=None, min_length=1, max_length=120)
    employment_status: EmploymentStatus | None = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class LeaveBase(BaseModel):
    employee_id: int
    leave_type: str = Field(..., min_length=1, max_length=80)
    start_date: date
    end_date: date
    reason: str | None = None

    @model_validator(mode="after")
    def validate_date_order(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveCreate(LeaveBase):
    status: LeaveStatus = "Pending"


class LeaveUpdate(BaseModel):
    leave_type: str | None = Field(default=None, min_length=1, max_length=80)
    start_date: date | None = None
    end_date: date | None = None
    reason: str | None = None
    status: LeaveStatus | None = None

    @model_validator(mode="after")
    def validate_date_order(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatus


class LeaveOut(LeaveBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeaveStatus
    created_at: datetime
    updated_at: datetime


class LeaveSummary(BaseModel):
    pending: int
    approved: int
    rejected: int
    total: int


class SalaryBase(BaseModel):
    employee_id: int
    base_salary: float = Field(..., ge=0)
    allowances: float = Field(default=0, ge=0)
    deductions: float = Field(default=0, ge=0)
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")


class SalaryCreate(SalaryBase):
    pass


class SalaryUpdate(BaseModel):
    base_salary: float | None = Field(default=None, ge=0)
    allowances: float | None = Field(default=None, ge=0)
    deductions: float | None = Field(default=None, ge=0)
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")


class SalaryOut(SalaryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    net_salary: float
    created_at: datetime
    updated_at: datetime


class PayrollSummary(BaseModel):
    month: str
    record_count: int
    gross_salary: float
    total_allowances: float
    total_deductions: float
    net_payroll: float
