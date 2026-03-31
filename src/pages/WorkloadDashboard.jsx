import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";
import { RefreshCcw } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import TopBar from "../components/layout/TopBar";
import { StatCard, ProgressBar, LoadingScreen, Select } from "../components/shared/UIComponents";
import api from "../utils/api";

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_COLOR = {
  Overloaded:      "#ff4d6d",
  "Fully Utilized":"#fb923c",
  "Moderate Load": "#ffd166",
  Available:       "#34d399",
};

// ─── Bar colour based on occupancy ───────────────────────────────────────────
const barColor = (occupancy) => {
  if (occupancy > 100) return "#ff4d6d";
  if (occupancy >= 80)  return "#fb923c";
  if (occupancy >= 50)  return "#ffd166";
  return "#34d399";
};

// ─────────────────────────────────────────────────────────────────────────────
//  parsePercent
//  Safely converts any occupancy / bandwidth value to a numeric percentage.
//
//  Rules (in order):
//  1. null / undefined / ""  → 0
//  2. "50%"  or " 50 % "     → 50   (strip %, parse float)
//  3. 0.5  (Google raw frac) → 50   (multiply by 100 when 0 < val ≤ 1)
//  4. 50   (already %)       → 50
//  5. NaN after parsing      → 0
// ─────────────────────────────────────────────────────────────────────────────
const parsePercent = (val) => {
  // Null-like guard
  if (val === null || val === undefined) return 0;

  const str = String(val).trim();
  if (str === "" || str === "-" || str.toLowerCase() === "null") return 0;

  const hasSign  = str.includes("%");
  const cleaned  = str.replace(/%/g, "").trim();
  const num      = parseFloat(cleaned);

  if (isNaN(num)) return 0;

  // String had a "%" → value is already in percentage scale
  if (hasSign) return num;

  // Google Sheets stores "50%" as raw value 0.5 (and "100%" as 1.0).
  // We treat 0 < num ≤ 1 as a decimal fraction → convert to %.
  // Edge: num === 0 stays 0 (genuinely 0 %).
  if (num > 0 && num <= 1) return parseFloat((num * 100).toFixed(4));

  // Already a percentage value (e.g. 50, 30, 100)
  return num;
};

// ─────────────────────────────────────────────────────────────────────────────
//  isValidRow  – skip header artefacts / fully-empty rows
// ─────────────────────────────────────────────────────────────────────────────
const isValidRow = (r) => {
  if (!r.peName || String(r.peName).trim() === "") return false;
  // A row is useful only if it contributes occupancy OR bandwidth
  const hasOccupancy = r.occupancy !== null && r.occupancy !== undefined && r.occupancy !== "";
  const hasBandwidth = r.bandwidth !== null && r.bandwidth !== undefined && r.bandwidth !== "";
  return hasOccupancy || hasBandwidth;
};

// ─────────────────────────────────────────────────────────────────────────────
//  WorkloadDashboard
// ─────────────────────────────────────────────────────────────────────────────
const WorkloadDashboard = () => {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [projectFilter,  setProjectFilter]  = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/workload-dashboard");
      setData(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch workload data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Filter raw rows ────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!data?.rawRows) return [];

    return data.rawRows
      .filter(isValidRow)
      .filter((r) => {
        if (reviewerFilter && r.reviewer !== reviewerFilter) return false;
        if (projectFilter  && r.project  !== projectFilter)  return false;
        return true;
      });
  }, [data, reviewerFilter, projectFilter]);

  // ── Group by PE and compute metrics ───────────────────────────────────────
  const grouped = useMemo(() => {
    const byPE = {};

    // ── Pass 1: collect per-PE data ─────────────────────────────────────────
    filteredRecords.forEach((r) => {
      const key = String(r.peName).trim();
      if (!key) return;

      if (!byPE[key]) {
        byPE[key] = {
          peName:         key,
          totalOccupancy: 0,
          bandwidth:      null,   // null = "not yet seen"
          entries:        [],
        };
      }

      // ── Occupancy: accumulate per project row ──────────────────────────
      const occ = parsePercent(r.occupancy);
      byPE[key].totalOccupancy += occ;

      // ── Bandwidth: keep the MAX value seen for this PE ─────────────────
      // Skip 0 and null — a 0-bandwidth cell almost always means "not filled"
      if (r.bandwidth !== null && r.bandwidth !== undefined && r.bandwidth !== "") {
        const bw = parsePercent(r.bandwidth);
        if (bw > 0) {
          if (byPE[key].bandwidth === null || bw > byPE[key].bandwidth) {
            byPE[key].bandwidth = bw;
          }
        }
      }

      byPE[key].entries.push(r);
    });

    // ── Pass 2: compute derived fields and status ────────────────────────────
    return Object.values(byPE)
      .map((item) => {
        const totalOccupancy    = parseFloat(item.totalOccupancy.toFixed(1));
        const bandwidth         = item.bandwidth !== null ? item.bandwidth : 100; // default 100
        const remainingBandwidth = parseFloat((bandwidth - totalOccupancy).toFixed(1));

        let status = "Available";
        if      (remainingBandwidth < 0)              status = "Overloaded";
        else if (totalOccupancy >= bandwidth)          status = "Fully Utilized";
        else if (totalOccupancy >= bandwidth * 0.5)   status = "Moderate Load";

        return {
          ...item,
          totalOccupancy,
          bandwidth,
          remainingBandwidth,
          status,
        };
      })
      .sort((a, b) => b.totalOccupancy - a.totalOccupancy);
  }, [filteredRecords]);

  // ── Derived filter options ─────────────────────────────────────────────────
  const reviewers = useMemo(
    () => [...new Set((data?.rawRows || []).map((r) => r.reviewer).filter(Boolean))],
    [data]
  );
  const projects = useMemo(
    () => [...new Set((data?.rawRows || []).map((r) => r.project).filter(Boolean))],
    [data]
  );

  // ── Chart data ─────────────────────────────────────────────────────────────
  const workloadData = useMemo(
    () => grouped.map((item) => ({ peName: item.peName, occupancy: item.totalOccupancy })),
    [grouped]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <AppLayout><TopBar title="Workload Dashboard" /><LoadingScreen /></AppLayout>;

  return (
    <AppLayout>
      <TopBar title="Workload Dashboard" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Workload &amp; Capacity Dashboard
            </h2>
            <p className="text-sm text-white/40">Live data from database (admin entries)</p>
          </div>
          <button onClick={loadData} className="btn-secondary inline-flex items-center gap-2">
            <RefreshCcw size={16} /> Refresh Data
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
            {error}
          </div>
        )}

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total PEs"          value={data?.summary?.totalPEs ?? 0}                    icon={null} color="#3d5aff" />
          <StatCard title="Average Occupancy"  value={`${data?.summary?.averageOccupancy ?? 0}%`}      icon={null} color="#06d6a0" />
          <StatCard title="Available Capacity" value={`${data?.summary?.availableCapacity ?? 0}%`}     icon={null} color="#34d399" />
        </div>

        {/* ── Filters ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Filter by Reviewer"
            value={reviewerFilter}
            onChange={setReviewerFilter}
            options={[{ value: "", label: "All" }, ...reviewers.map((r) => ({ value: r, label: r }))]}
          />
          <Select
            label="Filter by Project"
            value={projectFilter}
            onChange={setProjectFilter}
            options={[{ value: "", label: "All" }, ...projects.map((p) => ({ value: p, label: p }))]}
          />
        </div>

        {/* ── Bar Chart ── */}
        <div className="card p-4">
          <h3 className="section-title mb-4">Workload Distribution by Employee</h3>
          <div className="w-full h-64">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="peName"
                    tick={{ fill: "#8b90a7", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8b90a7", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Occupancy"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="occupancy" radius={[6, 6, 0, 0]}>
                    {workloadData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={barColor(entry.occupancy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* ── PE Workload Table ── */}
        <div className="card p-4 overflow-x-auto">
          <h3 className="section-title mb-4">PE Workload Table</h3>
          {grouped.length === 0 ? (
            <p className="text-white/40">No records found.</p>
          ) : (
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-white/40 border-b border-white/[0.08]">
                  <th className="px-3 py-2">PE Name</th>
                  <th className="px-3 py-2">Total Occupancy</th>
                  <th className="px-3 py-2">Bandwidth</th>
                  <th className="px-3 py-2">Remaining Bandwidth</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row) => (
                  <tr
                    key={row.peName}
                    className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-3 py-2 text-white/90 font-medium">{row.peName}</td>
                    <td className="px-3 py-2 text-white/80">{row.totalOccupancy.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-white/80">{row.bandwidth.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-white/80">{row.remainingBandwidth.toFixed(1)}%</td>
                    <td className="px-3 py-2">
                      <span
                        className="badge"
                        style={{
                          background: `${STATUS_COLOR[row.status] ?? "#334155"}30`,
                          color: STATUS_COLOR[row.status] ?? "#ffffff",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 w-56">
                      <ProgressBar
                        value={Math.min(row.totalOccupancy, row.bandwidth)}
                        color={STATUS_COLOR[row.status] || "#3d5aff"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AppLayout>
  );
};

export default WorkloadDashboard;
