import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

interface Grade { id: number; code: string; name: string }
interface Subject { id: number; code: string; name: string }

export default function AdminCatalogPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Grade[]>("/catalog/grades").then(({ data }) => setGrades(data)),
      api.get<Subject[]>("/catalog/subjects").then(({ data }) => setSubjects(data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Müfredat / Kazanım</h1>
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">← Panele dön</Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Yükleniyor…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Sınıflar ({grades.length})</h2>
            {grades.length === 0 ? (
              <p className="text-slate-500 text-sm">Sınıf verisi bulunamadı.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {grades.map((g) => (
                  <li key={g.id} className="flex justify-between py-1.5 border-b last:border-0">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-slate-500">{g.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Dersler ({subjects.length})</h2>
            {subjects.length === 0 ? (
              <p className="text-slate-500 text-sm">Ders verisi bulunamadı.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {subjects.map((s) => (
                  <li key={s.id} className="flex justify-between py-1.5 border-b last:border-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-500">{s.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
