import type { CatalogGame } from "@/lib/catalog-model";

export function GameInformation({ game }: { game: CatalogGame }) {
  const objectives = game.objectives.filter((text) => text.trim());
  const notes = game.teacherNotes.filter((text) => text.trim());
  if (!objectives.length && !game.author.trim() && !notes.length) return null;
  return (
    <div className="game-information">
      {objectives.length > 0 && (
        <section className="game-objectives">
          <h2>Öğrenme hedefi</h2>
          {objectives.map((objective, index) => (
            <p key={index}>{objective}</p>
          ))}
        </section>
      )}
      {game.author.trim() && (
        <section className="game-author">
          <h2>Hazırlayan</h2>
          <p>{game.author}</p>
        </section>
      )}
      {notes.length > 0 && (
        <section
          className="game-teacher-notes"
          id="ogretmen-notu"
          tabIndex={-1}
        >
          <h2>Öğretmen notları</h2>
          <p>{notes[0]}</p>
          {notes.length > 1 && (
            <details className="game-note-disclosure">
              <summary>Diğer öğretmen notları</summary>
              <div>
                {notes.slice(1).map((note, index) => (
                  <p key={index}>{note}</p>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
