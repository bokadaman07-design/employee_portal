import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import Card from "../components/Card";
import { api } from "../context/AuthContext";

const emptyLeaveForm = {
  employee_id: "",
  leave_type: "Annual",
  start_date: "",
  end_date: "",
  reason: "",
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || fallback;
}

export default function LeaveTracker() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [form, setForm] = useState(emptyLeaveForm);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLeaves(filter = statusFilter) {
    setError("");
    setLoading(true);
    try {
      const [employeeRes, leaveRes, summaryRes] = await Promise.all([
        api.get("/employees/"),
        api.get("/leaves/", { params: filter ? { status: filter } : {} }),
        api.get("/leaves/summary"),
      ]);
      setEmployees(employeeRes.data);
      setLeaves(leaveRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load leave requests"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves("");
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/leaves/", {
        ...form,
        employee_id: Number(form.employee_id),
        reason: form.reason || null,
      });
      setForm(emptyLeaveForm);
      await loadLeaves();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit leave request"));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(leaveId, action) {
    setError("");
    try {
      await api.post(`/leaves/${leaveId}/${action}`);
      await loadLeaves();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update leave status"));
    }
  }

  function employeeName(employeeId) {
    const employee = employees.find((item) => item.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : `Employee #${employeeId}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Leave Tracker</h1>
          <p className="mt-1 text-sm text-ink/60">Submit, review, approve, and reject leave requests.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            loadLeaves(event.target.value);
          }}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total" value={summary.total} description="All requests" accent="ink" />
        <Card title="Pending" value={summary.pending} description="Needs review" accent="gold" />
        <Card title="Approved" value={summary.approved} description="Accepted requests" accent="pine" />
        <Card title="Rejected" value={summary.rejected} description="Declined requests" accent="coral" />
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Submit leave request</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70">Employee</span>
              <select value={form.employee_id} onChange={(event) => updateForm("employee_id", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Type</span>
              <select value={form.leave_type} onChange={(event) => updateForm("leave_type", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2">
                <option>Annual</option>
                <option>Sick</option>
                <option>Personal</option>
                <option>Unpaid</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Start date</span>
              <input value={form.start_date} onChange={(event) => updateForm("start_date", event.target.value)} type="date" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" required />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">End date</span>
              <input value={form.end_date} onChange={(event) => updateForm("end_date", event.target.value)} type="date" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" required />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70">Reason</span>
              <textarea value={form.reason} onChange={(event) => updateForm("reason", event.target.value)} className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2" />
            </label>
          </div>
          <button disabled={saving} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={16} />
            {saving ? "Submitting..." : "Submit request"}
          </button>
        </form>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Requests</h2>
          {loading ? (
            <p className="mt-4 text-sm text-ink/55">Loading leave requests...</p>
          ) : leaves.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-ink/55">No leave requests found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {leaves.map((leave) => (
                <article key={leave.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{employeeName(leave.employee_id)}</p>
                      <p className="mt-1 text-sm text-ink/60">{leave.leave_type} leave from {leave.start_date} to {leave.end_date}</p>
                      {leave.reason && <p className="mt-2 text-sm text-ink/70">{leave.reason}</p>}
                    </div>
                    <span className="w-fit rounded-md bg-mist px-2 py-1 text-xs font-semibold text-ink/70">{leave.status}</span>
                  </div>
                  {leave.status === "Pending" && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => updateStatus(leave.id, "approve")} className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
                        <Check size={16} />
                        Approve
                      </button>
                      <button onClick={() => updateStatus(leave.id, "reject")} className="focus-ring inline-flex items-center gap-2 rounded-md border border-coral/30 px-3 py-2 text-sm font-semibold text-coral">
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
