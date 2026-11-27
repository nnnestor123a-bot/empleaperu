"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { CvAnalysisResult } from "@/lib/cv-analyzer";

interface ResumeRow {
  id: string;
  originalName: string;
  sizeBytes: number;
  isPrimary: boolean;
  createdAt: string;
  analysis: CvAnalysisResult;
  estimatedCompatibility?: number;
}

interface CvBuilderState {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experienceText: string;
  educationText: string;
  skillsText: string;
  certsText: string;
}

interface SavedVersion {
  id: string;
  title: string;
  template: "CLASSIC_ATS" | "MODERN_CLEAN" | "EXECUTIVE";
  accentColor: string;
  updatedAt: string;
  data: Partial<CvBuilderState>;
}

export default function PostulanteCvPage() {
  const router = useRouter();
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const [tab, setTab] = useState<"analyzer" | "builder">("analyzer");
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Builder state
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [template, setTemplate] = useState<"CLASSIC_ATS" | "MODERN_CLEAN" | "EXECUTIVE">("CLASSIC_ATS");
  const [accentColor, setAccentColor] = useState("#12336B");
  const [cv, setCv] = useState<CvBuilderState>({
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "Lima, Perú",
    summary: "",
    experienceText: "",
    educationText: "",
    skillsText: "",
    certsText: "",
  });

  const loadResumes = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/resumes", { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setFeedback({ type: "err", text: errData.error || "No se pudo cargar tus CVs guardados." });
        return;
      }
      const data = await res.json();
      setResumes(data.resumes || []);
      setVersions(data.versions || []);
    } catch {
      setFeedback({ type: "err", text: "Error de red al consultar tus CVs guardados." });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const importFromProfile = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const { profile } = await res.json();
      setCv({
        fullName: profile.user.name || "",
        headline: profile.headline || "",
        email: profile.user.email || "",
        phone: profile.user.phone || "",
        location: `${profile.district || ""}, ${profile.department || "Perú"}`.replace(/^,\s*/, ""),
        summary: profile.bio || "",
        experienceText: (profile.experiences || [])
          .map(
            (e: {
              title: string;
              company: string;
              startDate: string;
              endDate?: string;
              isCurrent: boolean;
              description: string;
            }) =>
              `${e.title} — ${e.company} (${e.startDate} - ${e.isCurrent ? "Actualidad" : e.endDate || ""})\n${e.description}`
          )
          .join("\n\n"),
        educationText: (profile.educations || [])
          .map(
            (ed: {
              degree: string;
              fieldOfStudy: string;
              institution: string;
              startYear: number;
              endYear?: number;
            }) => `${ed.degree} en ${ed.fieldOfStudy} — ${ed.institution} (${ed.startYear}-${ed.endYear || "Actual"})`
          )
          .join("\n"),
        skillsText: (profile.skills || []).map((s: { skill: { name: string } }) => s.skill.name).join(", "),
        certsText: (profile.certifications || [])
          .map((c: { name: string; issuer: string; issueYear: number }) => `${c.name} — ${c.issuer} (${c.issueYear})`)
          .join("\n"),
      });
      if (!silent) {
        setFeedback({ type: "ok", text: "Datos importados desde tu perfil profesional." });
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    loadResumes();
    importFromProfile(true);
  }, [loadResumes, importFromProfile]);

  async function uploadFile(file: File, replaceId?: string | null) {
    setUploading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (replaceId) fd.append("replaceId", replaceId);

      const res = await fetch("/api/resumes", {
        method: "POST",
        body: fd,
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({
          type: "err",
          text: data?.error || `Error al subir el CV (HTTP ${res.status}). Verifica que sea un PDF o DOCX válido menor a 5 MB.`,
        });
        return;
      }
      setFeedback({
        type: "ok",
        text: replaceId
          ? `CV reemplazado y guardado correctamente (Puntaje ATS: ${data?.analysis?.score ?? 0}/100).`
          : `CV "${file.name}" guardado en almacenamiento privado (Puntaje ATS: ${data?.analysis?.score ?? 0}/100).`,
      });
      await loadResumes();
      router.refresh();
    } catch {
      setFeedback({ type: "err", text: "Error de conexión al subir el CV. Intenta nuevamente." });
    } finally {
      setUploading(false);
      setReplacingId(null);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("cvFile") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setFeedback({ type: "err", text: "Selecciona primero un archivo PDF o DOCX." });
      return;
    }
    await uploadFile(file, null);
    input.value = "";
  }

  async function handleSignedDownload(resumeId: string) {
    setFeedback(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}?signed=true`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setFeedback({ type: "err", text: data?.error || "No se pudo generar el enlace seguro de descarga." });
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setFeedback({ type: "err", text: "Error al solicitar descarga segura del CV." });
    }
  }

  async function deleteResume(id: string) {
    setFeedback(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFeedback({ type: "err", text: d.error || "No se pudo eliminar el CV." });
        return;
      }
      setFeedback({ type: "ok", text: "CV eliminado correctamente de tu cuenta y del almacenamiento privado." });
      await loadResumes();
      router.refresh();
    } catch {
      setFeedback({ type: "err", text: "Error de red al eliminar el CV." });
    }
  }

  async function saveVersion() {
    setSavingVersion(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVersionId,
          title: `CV ${cv.headline || cv.fullName || "ATS"}`,
          template,
          accentColor,
          data: cv,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({ type: "err", text: data?.error || "No se pudo guardar la versión del CV." });
        return;
      }
      setEditingVersionId(data?.version?.id || null);
      setFeedback({ type: "ok", text: data?.message || "Versión de CV ATS guardada en PostgreSQL." });
      await loadResumes();
      router.refresh();
    } catch {
      setFeedback({ type: "err", text: "Error de conexión al guardar la versión." });
    } finally {
      setSavingVersion(false);
    }
  }

  async function deleteVersion(versionId: string) {
    const res = await fetch(`/api/resumes?versionId=${encodeURIComponent(versionId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (editingVersionId === versionId) setEditingVersionId(null);
      setFeedback({ type: "ok", text: "Versión eliminada." });
      loadResumes();
    }
  }

  async function exportPdf() {
    // Dynamic import keeps jsPDF (~115 KB) out of initial page JS bundle
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(accentColor);
    doc.text(cv.fullName || "Currículum Vitae", 48, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#334155");
    doc.text(cv.headline || "", 48, y);
    y += 16;
    doc.setFontSize(9.5);
    doc.text(`${cv.email}  |  ${cv.phone}  |  ${cv.location}`, 48, y);
    y += 22;

    const addSection = (title: string, body: string) => {
      if (!body.trim()) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(accentColor);
      doc.text(title.toUpperCase(), 48, y);
      y += 6;
      doc.setDrawColor(accentColor);
      doc.line(48, y, 545, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#111827");
      const lines = doc.splitTextToSize(body, 495);
      doc.text(lines, 48, y);
      y += lines.length * 13 + 14;
    };

    addSection("Resumen profesional", cv.summary);
    addSection("Experiencia laboral", cv.experienceText);
    addSection("Formación académica", cv.educationText);
    addSection("Habilidades clave", cv.skillsText);
    addSection("Certificaciones", cv.certsText);

    doc.save(`CV-${(cv.fullName || "EmpleaPeru").replace(/\s+/g, "_")}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
            Analizador &amp; Generador de CV ATS
          </h1>
          <p className="text-xs text-slate-500">
            Sube tu CV (PDF/DOCX en almacenamiento privado seguro) para análisis explicable o crea y guarda versiones ATS con exportación PDF.
          </p>
        </div>
        <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab("analyzer")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold ${
              tab === "analyzer" ? "bg-white text-[#2563EB] shadow-sm dark:bg-slate-900" : "text-slate-600"
            }`}
          >
            <FileSearch className="h-4 w-4" /> Analizador CV ({resumes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("builder")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold ${
              tab === "builder" ? "bg-white text-[#2563EB] shadow-sm dark:bg-slate-900" : "text-slate-600"
            }`}
          >
            <FileText className="h-4 w-4" /> Generador CV ATS ({versions.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Hidden input for replacing an existing CV */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f && replacingId) {
            await uploadFile(f, replacingId);
          }
          e.target.value = "";
        }}
      />

      {tab === "analyzer" ? (
        <div className="space-y-6">
          <form onSubmit={handleUploadSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Subir y analizar CV privado (PDF o DOCX, máx. 5 MB)</h2>
            <p className="mt-1 text-xs text-slate-500">
              Validamos el tipo real de archivo (magic bytes), lo guardamos cifrado en el bucket privado con nombre aleatorio y descarga mediante URL firmada temporal (60s).
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                name="cvFile"
                type="file"
                accept=".pdf,.docx"
                required
                className="w-full sm:w-auto max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-[#2563EB]"
              />
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-[#12336B] disabled:opacity-60"
              >
                <Upload className="h-4 w-4" /> {uploading ? "Subiendo y analizando..." : "Subir y analizar"}
              </button>
            </div>
          </form>

          {loadingList ? (
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ) : resumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              Aún no subes un archivo CV. Sube un PDF/DOCX arriba o genera uno nuevo en la pestaña Generador CV ATS.
            </div>
          ) : (
            resumes.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{r.originalName}</p>
                      {r.isPrimary && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {(r.sizeBytes / 1024).toFixed(1)} KB · Guardado el {new Date(r.createdAt).toLocaleString("es-PE")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563EB] tabular-nums">
                      Puntaje ATS: {r.analysis?.score ?? 0}/100
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#16A34A] tabular-nums">
                      <Sparkles className="h-3.5 w-3.5" /> Compatibilidad: {r.estimatedCompatibility ?? r.analysis?.score ?? 0}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSignedDownload(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-[#2563EB]"
                    >
                      <Download className="h-3.5 w-3.5" /> Descargar
                    </button>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => {
                        setReplacingId(r.id);
                        replaceInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-[#2563EB]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteResume(r.id)}
                      aria-label="Eliminar CV"
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {r.analysis?.warning && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{r.analysis.warning}</p>
                  </div>
                )}

                {r.analysis?.readable && (
                  <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                    <div>
                      <p className="font-bold text-[#16A34A]">Secciones detectadas ({r.analysis.detectedSections?.length || 0})</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {r.analysis.detectedSections?.join(", ") || "Ninguna"}
                      </p>
                      <p className="mt-3 font-bold text-[#12336B] dark:text-blue-300">Palabras clave / Habilidades</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(r.analysis.detectedSkills || []).map((sk) => (
                          <span key={sk} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{sk}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-amber-700">Recomendaciones de mejora</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                        {(r.analysis.recommendations || []).map((rec) => (
                          <li key={rec}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">{r.analysis?.methodologyNote}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Saved Versions Bar */}
          {versions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold text-[#12336B] dark:text-white">
                Tus versiones guardadas en la base de datos ({versions.length})
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                      editingVersionId === v.id
                        ? "border-[#2563EB] bg-blue-50 text-[#12336B]"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVersionId(v.id);
                        setTemplate(v.template || "CLASSIC_ATS");
                        setAccentColor(v.accentColor || "#12336B");
                        setCv((prev) => ({ ...prev, ...(v.data || {}) }));
                        setFeedback({ type: "ok", text: `Versión "${v.title}" cargada en el editor.` });
                      }}
                      className="font-semibold hover:underline"
                    >
                      {v.title} · {new Date(v.updatedAt).toLocaleDateString("es-PE")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVersion(v.id)}
                      aria-label="Eliminar versión"
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Editor */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-[#12336B] dark:text-white">Editor CV ATS</h2>
                <button type="button" onClick={() => importFromProfile(false)} className="text-xs font-semibold text-[#2563EB] hover:underline">
                  Reimportar perfil
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select value={template} onChange={(e) => setTemplate(e.target.value as typeof template)} className="rounded-lg border p-2 dark:border-slate-700 dark:bg-slate-800">
                  <option value="CLASSIC_ATS">Plantilla Clásica ATS</option>
                  <option value="MODERN_CLEAN">Plantilla Moderna Limpia</option>
                  <option value="EXECUTIVE">Plantilla Ejecutiva</option>
                </select>
                <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="rounded-lg border p-2 dark:border-slate-700 dark:bg-slate-800">
                  <option value="#12336B">Azul Marino (#12336B)</option>
                  <option value="#2563EB">Azul EmpleaPerú (#2563EB)</option>
                  <option value="#16A34A">Verde Esmeralda (#16A34A)</option>
                  <option value="#111827">Grafito Sobrio (#111827)</option>
                </select>
              </div>
              <input value={cv.fullName} onChange={(e) => setCv({ ...cv, fullName: e.target.value })} placeholder="Nombre completo" className="w-full rounded-lg border p-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input value={cv.headline} onChange={(e) => setCv({ ...cv, headline: e.target.value })} placeholder="Titular profesional" className="w-full rounded-lg border p-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <div className="grid grid-cols-2 gap-2">
                <input value={cv.email} onChange={(e) => setCv({ ...cv, email: e.target.value })} placeholder="Correo" className="rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
                <input value={cv.phone} onChange={(e) => setCv({ ...cv, phone: e.target.value })} placeholder="Teléfono" className="rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <textarea rows={2} value={cv.summary} onChange={(e) => setCv({ ...cv, summary: e.target.value })} placeholder="Resumen profesional" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              <textarea rows={4} value={cv.experienceText} onChange={(e) => setCv({ ...cv, experienceText: e.target.value })} placeholder="Experiencia laboral" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              <textarea rows={2} value={cv.educationText} onChange={(e) => setCv({ ...cv, educationText: e.target.value })} placeholder="Formación académica" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              <input value={cv.skillsText} onChange={(e) => setCv({ ...cv, skillsText: e.target.value })} placeholder="Habilidades separadas por coma" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={exportPdf} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white">
                  <Download className="h-4 w-4" /> Exportar PDF
                </button>
                <button
                  type="button"
                  disabled={savingVersion}
                  onClick={saveVersion}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> {savingVersion ? "Guardando..." : editingVersionId ? "Actualizar versión" : "Guardar versión"}
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 text-slate-900 shadow-sm lg:col-span-6">
              <div className={template === "MODERN_CLEAN" ? "border-l-4 pl-4" : "border-b-2 pb-3"} style={{ borderColor: accentColor }}>
                <h2 className="text-2xl font-extrabold" style={{ color: accentColor }}>
                  {cv.fullName || "Tu Nombre Completo"}
                </h2>
                <p className="text-sm font-semibold text-slate-700">{cv.headline}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {cv.email} · {cv.phone} · {cv.location}
                </p>
              </div>
              <div className="mt-5 space-y-4 text-xs leading-relaxed">
                {cv.summary && (
                  <section>
                    <h3 className="font-bold uppercase tracking-wider" style={{ color: accentColor }}>Resumen</h3>
                    <p className="mt-1 whitespace-pre-line">{cv.summary}</p>
                  </section>
                )}
                {cv.experienceText && (
                  <section>
                    <h3 className="font-bold uppercase tracking-wider" style={{ color: accentColor }}>Experiencia</h3>
                    <p className="mt-1 whitespace-pre-line">{cv.experienceText}</p>
                  </section>
                )}
                {cv.educationText && (
                  <section>
                    <h3 className="font-bold uppercase tracking-wider" style={{ color: accentColor }}>Formación</h3>
                    <p className="mt-1 whitespace-pre-line">{cv.educationText}</p>
                  </section>
                )}
                {cv.skillsText && (
                  <section>
                    <h3 className="font-bold uppercase tracking-wider" style={{ color: accentColor }}>Habilidades</h3>
                    <p className="mt-1">{cv.skillsText}</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
