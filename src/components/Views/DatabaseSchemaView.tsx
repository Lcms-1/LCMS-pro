import React, { useState } from 'react';
import {
  Database,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Key,
  Link,
  Code2,
  Download,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TableSchema } from '../../types';

interface DatabaseSchemaViewProps {
  schemas: TableSchema[];
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({ schemas }) => {
  const [selectedTable, setSelectedTable] = useState<string>(schemas[0]?.tableName || 'users');
  const [filter, setFilter] = useState<'all' | 'active_foundation' | 'ready_for_phase2'>('all');
  const [search, setSearch] = useState('');

  const activeTableObj = schemas.find((s) => s.tableName === selectedTable) || schemas[0];

  const filteredSchemas = schemas.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch =
      s.tableName.toLowerCase().includes(search.toLowerCase()) ||
      s.moduleName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportSql = () => {
    if (!activeTableObj) return;
    const columnsDdl = activeTableObj.columns
      .map(
        (c) =>
          `  ${c.name} ${c.type}${c.isPrimary ? ' PRIMARY KEY' : ''}${c.isNullable ? '' : ' NOT NULL'}${
            c.isForeignKey ? ` REFERENCES ${c.references}` : ''
          }`
      )
      .join(',\n');

    const sqlDdl = `-- LCMS PRO Database Architecture DDL
-- Table: ${activeTableObj.tableName} (${activeTableObj.moduleName})

CREATE TABLE ${activeTableObj.tableName} (
${columnsDdl}
);`;

    const blob = new Blob([sqlDdl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lcms_${activeTableObj.tableName}_schema.sql`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              Relational Database Architecture Inspector
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              10 Core Database Schemas & Modules
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
              Engineered with strict foreign key constraints and indexing for Nigerian Cooperative Societies. Prepared for Phase 2 Savings, Loans, Guarantors, Businesses, and Dividends.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSql}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export SQL DDL
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All 10 Tables ({schemas.length})
          </button>
          <button
            onClick={() => setFilter('active_foundation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'active_foundation'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Active Foundation (4)
          </button>
          <button
            onClick={() => setFilter('ready_for_phase2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'ready_for_phase2'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Phase 2 Modules Ready (6)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search table or module..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Main Grid: Left Table List, Right Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Tables */}
        <div className="lg:col-span-4 space-y-2">
          {filteredSchemas.map((t) => {
            const isSelected = t.tableName === selectedTable;
            return (
              <button
                key={t.tableName}
                onClick={() => setSelectedTable(t.tableName)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-700 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 hover:bg-emerald-50/50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono font-bold text-xs ${isSelected ? 'text-amber-300' : 'text-slate-900 dark:text-white'}`}>
                    {t.tableName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : t.status === 'active_foundation'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {t.status === 'active_foundation' ? 'Foundation' : 'Phase 2'}
                  </span>
                </div>

                <div className={`text-xs font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-700 dark:text-slate-300'}`}>
                  {t.moduleName}
                </div>

                <div className={`text-[10px] mt-1 ${isSelected ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                  {t.columns.length} columns • Est. {t.estimatedRows.toLocaleString()} rows
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Table Column Inspector */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          {activeTableObj ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {activeTableObj.tableName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {activeTableObj.moduleName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activeTableObj.description}
                  </p>
                </div>

                <button
                  onClick={handleExportSql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                  View DDL
                </button>
              </div>

              {/* Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Data Type</th>
                      <th className="p-3">Keys / Constraints</th>
                      <th className="p-3">Nullable</th>
                      <th className="p-3">Description & Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeTableObj.columns.map((c) => (
                      <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                          {c.type}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {c.isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                <Key className="w-2.5 h-2.5 text-amber-600" /> PK
                              </span>
                            )}
                            {c.isForeignKey && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-0.5" title={`FK -> ${c.references}`}>
                                <Link className="w-2.5 h-2.5 text-blue-600" /> FK
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          {c.isNullable ? (
                            <span className="text-slate-400">YES</span>
                          ) : (
                            <span className="font-bold text-slate-700 dark:text-slate-300">NO</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {c.description}
                          {c.references && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                              → References: {c.references}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a database table from the left menu to inspect schema architecture.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
