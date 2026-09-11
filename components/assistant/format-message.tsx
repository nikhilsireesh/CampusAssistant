/** Very small, safe markdown-lite renderer: supports **bold**, line breaks and
 * bullet lines starting with "- ". Avoids pulling in a full markdown lib for
 * what is only ever short, model-generated campus answers. */
export function FormatMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("- ");
        const text = isBullet ? trimmed.slice(2) : line;
        const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

        const rendered = parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        );

        if (trimmed === "") return <div key={i} className="h-1" />;

        return isBullet ? (
          <div key={i} className="flex gap-2 pl-1">
            <span className="text-muted-foreground">•</span>
            <span>{rendered}</span>
          </div>
        ) : (
          <p key={i}>{rendered}</p>
        );
      })}
    </div>
  );
}
