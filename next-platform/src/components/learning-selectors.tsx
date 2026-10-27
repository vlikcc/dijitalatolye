"use client";
import { useId, useRef, useState } from "react";
import { normalizeSearch } from "@/lib/catalog-model";
import type { GameOption, MemberOption } from "@/lib/learning-workspace";

export function GamePicker({
  games,
  value,
  onChange,
}: {
  games: GameOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const selected = games.find((g) => g.id === value);
  const [query, setQuery] = useState(selected?.title ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const needle = normalizeSearch(query === selected?.title ? "" : query.trim());
  const options = games.filter((g) =>
    normalizeSearch(g.title).includes(needle),
  );
  function choose(g: GameOption) {
    onChange(g.id);
    setQuery(g.title);
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  }
  return (
    <div
      className="game-picker"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label htmlFor={id}>Oyun</label>
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={
          open && active >= 0 && options[active]
            ? `${id}-${options[active].id}`
            : undefined
        }
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        placeholder="Oyun adıyla ara ve seç"
        value={query}
        required
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (
            (e.key === "ArrowDown" || e.key === "ArrowUp") &&
            options.length
          ) {
            e.preventDefault();
            setOpen(true);
            const next =
              e.key === "ArrowDown"
                ? (active + 1) % options.length
                : active <= 0
                  ? options.length - 1
                  : active - 1;
            setActive(next);
            document
              .getElementById(`${id}-${options[next].id}`)
              ?.scrollIntoView({ block: "nearest" });
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (options[active]) choose(options[active]);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setActive(-1);
          }
        }}
      />
      <p id={`${id}-hint`} className="form-help">
        {selected ? `${selected.title} seçildi.` : "Listeden bir oyun seçin."}
      </p>
      {open && (
        <div className="game-picker-results">
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label="Atanabilecek oyunlar"
          >
            {options.map((g, index) => (
              <li
                id={`${id}-${g.id}`}
                role="option"
                key={g.id}
                aria-selected={value === g.id}
                data-active={active === index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(g)}
              >
                <strong>{g.title}</strong>
                <span>
                  {[
                    g.grade ? `${g.grade}. sınıf` : null,
                    g.subject,
                    g.tracking
                      ? "İlerleme ve puan kaydı"
                      : "Yalnız açılma bilgisi",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          {!options.length && <p role="status">Bu aramada oyun bulunamadı.</p>}
        </div>
      )}
    </div>
  );
}

export function StudentPicker({
  members,
  selected,
  onChange,
  label = "Öğrencileri seçin",
}: {
  members: MemberOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const shown = members.filter(
    (m) =>
      normalizeSearch(m.name).includes(normalizeSearch(query.trim())) &&
      (!onlySelected || selected.includes(m.student_id)),
  );
  return (
    <fieldset className="learning-selections student-picker">
      <legend>{label}</legend>
      <div className="workspace-toolbar">
        <label>
          Öğrenci ara
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci adı"
            maxLength={120}
          />
        </label>
        <label className="learning-check">
          <input
            type="checkbox"
            checked={onlySelected}
            onChange={(e) => setOnlySelected(e.target.checked)}
          />
          Yalnız seçilenler
        </label>
      </div>
      <p className="form-help" role="status">
        {selected.length} öğrenci seçildi · {shown.length} / {members.length}{" "}
        öğrenci gösteriliyor
      </p>
      <div className="student-options">
        {shown.map((m) => (
          <label key={m.student_id} className="learning-check">
            <input
              type="checkbox"
              name="students"
              value={m.student_id}
              checked={selected.includes(m.student_id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, m.student_id]
                    : selected.filter((id) => id !== m.student_id),
                )
              }
            />
            {m.name}
          </label>
        ))}
      </div>
      {!shown.length && (
        <p>
          Bu aramada öğrenci yok. Aramayı veya “Yalnız seçilenler” seçeneğini
          değiştirin.
        </p>
      )}
    </fieldset>
  );
}
