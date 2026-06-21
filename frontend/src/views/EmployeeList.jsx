import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { api } from "../context/AuthContext";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_code: "",
  gender: "",
  role: "",
  employment_status: "Active",
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || fallback;
}

// Semantic colors for an employment-status chip. Each entry pairs a light-mode
// tint with an explicit dark-mode variant so the status stays color-coded and
// legible in dark mode instead of collapsing to a single neutral grey.
const employmentStatusChip = {
  Active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200",
  Inactive: "bg-mist text-ink/70 dark:bg-edge dark:text-fog/70",
  "On Leave": "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200",
  Terminated: "bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200",
};

const defaultEmploymentChip = "bg-mist text-ink/70 dark:bg-edge dark:text-fog/70";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadEmployees(search = searchTerm) {
    setError("");
    setLoading(true);
    try {
      const response = await api.get("/employees/", { params: search ? { search } : {} });
      setEmployees(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load employees"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees("");
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(employee) {
    setEditingId(employee.id);
    setForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || "",
      country_code: employee.country_code || "",
      gender: employee.gender || "",
      role: employee.role,
      employment_status: employee.employment_status,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, phone: form.phone || null, country_code: form.country_code || null, gender: form.gender || null };
    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        await api.post("/employees/", payload);
      }
      resetForm();
      await loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save employee"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(employeeId) {
    setError("");
    try {
      await api.delete(`/employees/${employeeId}`);
      await loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete employee"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink dark:text-fog">Employees</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-fog/60">Create, search, update, and remove employee records.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            loadEmployees(searchTerm);
          }}
          className="flex w-full gap-2 lg:w-auto"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 lg:w-80 dark:border-edge dark:bg-panel">
            <Search size={17} className="text-ink/45 dark:text-fog/45" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border-0 bg-transparent text-sm outline-none dark:text-fog"
              placeholder="Search employees"
            />
          </div>
          <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-pine">Search</button>
        </form>
      </div>

      {error && <div className="rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft dark:border-edge dark:bg-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink dark:text-fog">{editingId ? "Edit employee" : "Add employee"}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-sm text-ink/70 dark:border-edge dark:text-fog/70">
                <X size={15} />
                Cancel
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">First name</span>
              <input value={form.first_name} onChange={(event) => updateForm("first_name", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" required />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Last name</span>
              <input value={form.last_name} onChange={(event) => updateForm("last_name", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" required />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Email</span>
              <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} type="email" className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" required />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Country code</span>
              <input value={form.country_code} onChange={(event) => updateForm("country_code", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" placeholder="e.g. +1" />
            </label>
            <label>
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Phone</span>
              <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Gender</span>
              <select value={form.gender} onChange={(event) => updateForm("gender", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge">
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Other</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Role</span>
              <input value={form.role} onChange={(event) => updateForm("role", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge" required />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-ink/70 dark:text-fog/70">Status</span>
              <select value={form.employment_status} onChange={(event) => updateForm("employment_status", event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 dark:border-edge">
                <option>Active</option>
                <option>Inactive</option>
                <option>On Leave</option>
                <option>Terminated</option>
              </select>
            </label>
          </div>
          <button disabled={saving} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={16} />
            {saving ? "Saving..." : editingId ? "Update employee" : "Create employee"}
          </button>
        </form>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft dark:border-edge dark:bg-panel">
          <h2 className="text-lg font-semibold text-ink dark:text-fog">Employee directory</h2>
          {loading ? (
            <p className="mt-4 text-sm text-ink/55 dark:text-fog/55">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-ink/55 dark:border-edge dark:text-fog/55">No employees found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-line text-ink/55 dark:border-edge dark:text-fog/55">
                  <tr>
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">Gender</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-edge">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="py-3 font-medium text-ink dark:text-fog">{employee.first_name} {employee.last_name}</td>
                      <td className="py-3 text-ink/70 dark:text-fog/70">{employee.email}</td>
                      <td className="py-3 text-ink/70 dark:text-fog/70">{employee.role}</td>
                      <td className="py-3 text-ink/70 dark:text-fog/70">{employee.gender || "—"}</td>
                      <td className="py-3">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${employmentStatusChip[employee.employment_status] || defaultEmploymentChip}`}>{employee.employment_status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(employee)} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink/70 dark:border-edge dark:text-fog/70" aria-label="Edit employee">
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => deleteEmployee(employee.id)} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-coral/30 text-coral" aria-label="Delete employee">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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
