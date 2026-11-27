"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FolderGit2, Plus, Trash2 } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  projectUrl: string | null;
  repoUrl: string | null;
  tags: string;
}

export default function PostulantePortafolioPage() {
  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Proyecto Web");
  const [projectUrl, setProjectUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [tags, setTags] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const { profile } = await res.json();
      setSlug(profile.portfolioSlug || "");
      setIsPublic(Boolean(profile.portfolioPublic));
      setItems(profile.portfolioItems || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublic(next: boolean) {
    setIsPublic(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioPublic: next }),
    });
    setMsg(next ? "Portafolio público activado." : "Portafolio configurado como privado.");
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addPortfolio",
        title,
        description,
        category,
        projectUrl,
        repoUrl,
        tags,
      }),
    });
    setTitle("");
    setDescription("");
    setProjectUrl("");
    setRepoUrl("");
    setTags("");
    setMsg("Proyecto agregado a tu portafolio.");
    load();
  }

  async function delItem(id: string) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deletePortfolio", id }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
            <FolderGit2 className="h-6 w-6 text-[#2563EB]" /> Mi Portafolio Profesional
          </h1>
          <p className="text-xs text-slate-500">
            Muestra proyectos, repositorios y evidencias con control total de visibilidad pública.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={isPublic} onChange={(e) => togglePublic(e.target.checked)} />
            Visible públicamente
          </label>
          {isPublic && slug && (
            <Link
              href={`/portafolio/${slug}`}
              className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white"
            >
              Ver URL pública <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {msg && <p className="text-xs font-semibold text-[#16A34A]">{msg}</p>}

      <form onSubmit={addItem} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-[#12336B] dark:text-white">Agregar proyecto</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del proyecto" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría (ej. Web, Datos, PLC)" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <input value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="URL demo (opcional)" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="URL repositorio GitHub (opcional)" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el reto, solución y resultado..." className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Etiquetas (ej. Next.js, SQL, Power BI)" className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white">
          <Plus className="h-4 w-4" /> Guardar proyecto
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#2563EB]">{item.category}</span>
                <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
              </div>
              <button type="button" onClick={() => delItem(item.id)} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
