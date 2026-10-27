import { Fragment } from "react";
import { searchMatchRanges } from "@/lib/search-highlight";

export function HighlightText({
  text,
  query = "",
}: {
  text: string;
  query?: string;
}) {
  const ranges = searchMatchRanges(text, query);
  let cursor = 0;
  return (
    <>
      {ranges.map(([start, end]) => {
        const before = text.slice(cursor, start);
        cursor = end;
        return (
          <Fragment key={start}>
            {before}
            <mark className="search-match">{text.slice(start, end)}</mark>
          </Fragment>
        );
      })}
      {text.slice(cursor)}
    </>
  );
}
