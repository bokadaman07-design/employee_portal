import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import Card from "../components/Card";
import { api } from "../context/AuthContext";

const currentMonth = new Date().toISOString().slice(0, 7);

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || fallback;
}

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [payrollSummary, setPayrollSummary] = useState({
    month: currentMonth,
    record_count: 0,
    gross_salary: 0,
    total_allowances: 0,
    total_deductions: 0,
    net_payroll: 0,
  });
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salaryForm, setSalaryForm] = useState({
    employee_id: "",
    base_salary: "",
    allowances: "0",
    deductions: "0",
    month: currentMonth,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.employment_status === "Active").length,
    [employees],
  );

  async function loadDashboard() {
    setError("");
    setLoading(true);

    // The selected month drives both salary widgets; keep them in sync so the
    // summary and the records list always describe the same period.
    const month = salaryForm.month || currentMonth;

    // Each widget is loaded independently with Promise.allSettled so that one
    // failing endpoint (auth loss, bad VITE_API_URL, a single 5xx, etc.) only
    // affects its own card instead of blanking the whole dashboard.
    const requests = [
      { key: "employees", label: "employees", request: api.get("/employees/") },
      { key: "leaveSummary", label: "leave summary", request: api.get("/leaves/summary") },
      {
        key: "payrollSummary",
        label: "salary summary",
        request: api.get("/salary/summary", { params: { month } }),
      },
      {
        key: "salaryRecords",
        label: "salary records",
        request: api.get("/salary/", { params: { month } }),
      },
    ];

    try {
      const results = await Promise.allSettled(requests.map((entry) => entry.request));
      const failedEndpoints = [];

      results.forEach((result, index) => {
        const entry = requests[index];
        if (result.status === "fulfilled") {
          switch (entry.key) {
            case "employees":
              setEmployees(result.value.data);
              break;
            case "leaveSummary":
              setLeaveSummary(result.value.data);
              break;
            case "payrollSummary":
              setPayrollSummary(result.value.data);
              break;
            case "salaryRecords":
              setSalaryRecords(result.value.data);
              break;
            default:
              break;
          }
        } else {
          // Surface the exact endpoint that failed instead of a generic message
          // so the failure is actionable in the UI and the console.
          const reason = getErrorMessage(result.reason, "request failed");
          failedEndpoints.push(`${entry.label} (${reason})`);
          console.error(`Dashboard widget "${entry.label}" failed to load:`, result.reason);
        }
      });

      if (failedEndpoints.length > 0) {
        setError(`Unable to load: ${failedEndpoints.join(", ")}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSalarySubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/salary/", {
        employee_id: Number(salaryForm.employee_id),
        base_salary: Number(salaryForm.base_salary),
        allowances: Number(salaryForm.allowances || 0),
        deductions: Number(salaryForm.deductions || 0),
        month: salaryForm.month,
      });
      setSalaryForm((current) => ({
        ...current,
        employee_id: "",
        base_salary: "",
        allowances: "0",
        deductions: "0",
      }));
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create salary record"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Workforce, leave, and payroll signals for the current month.</p>
        </div>
        <button onClick={loadDashboard} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Employees" value={loading ? "..." : employees.length} description={`${activeEmployees} active`} accent="pine" />
        <Card title="Pending leave" value={loading ? "..." : leaveSummary.pending} description={`${leaveSummary.total} total requests`} accent="gold" />
        <Card title="Payroll records" value={loading ? "..." : payrollSummary.record_count} description={payrollSummary.month} accent="coral" />
        <Card title="Net payroll" value={loading ? "..." : `$${payrollSummary.net_payroll.toLocaleString()}`} description="Calculated from salary records" accent="ink" />
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSalarySubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Create salary record</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70">Employee</span>
              <select
                value={salaryForm.employee_id}
                onChange={(event) => setSalaryForm({ ...salaryForm, employee_id: event.target.value })}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Base salary</span>
              <input value={salaryForm.base_salary} onChange={(event) => setSalaryForm({ ...salaryForm, base_salary: event.target.value })} type="number" min="0" step="0.01" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" required />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Month</span>
              <input value={salaryForm.month} onChange={(event) => setSalaryForm({ ...salaryForm, month: event.target.value })} type="month" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" required />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Allowances</span>
              <input value={salaryForm.allowances} onChange={(event) => setSalaryForm({ ...salaryForm, allowances: event.target.value })} type="number" min="0" step="0.01" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70">Deductions</span>
              <input value={salaryForm.deductions} onChange={(event) => setSalaryForm({ ...salaryForm, deductions: event.target.value })} type="number" min="0" step="0.01" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2" />
            </label>
          </div>
          <button disabled={saving} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={16} />
            {saving ? "Saving..." : "Add salary"}
          </button>
        </form>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Monthly payroll</h2>
          {salaryRecords.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-ink/55">No salary records for this month.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line text-ink/55">
                  <tr>
                    <th className="py-2 font-medium">Employee ID</th>
                    <th className="py-2 font-medium">Base</th>
                    <th className="py-2 font-medium">Allowances</th>
                    <th className="py-2 font-medium">Deductions</th>
                    <th className="py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {salaryRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3">{record.employee_id}</td>
                      <td className="py-3">${record.base_salary.toLocaleString()}</td>
                      <td className="py-3">${record.allowances.toLocaleString()}</td>
                      <td className="py-3">${record.deductions.toLocaleString()}</td>
                      <td className="py-3 font-semibold">${record.net_salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
