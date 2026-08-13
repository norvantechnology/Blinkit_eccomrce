/** Minimal markdown → React for privacy policy (paragraphs + **bold**) */
export function renderSimpleMarkdown(text: string) {
  return text.split(/\n\n+/).map((block, i) => {
    const parts = block.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-3 text-[14px] leading-relaxed text-[#666] last:mb-0">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold text-[#444]">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
      </p>
    );
  });
}
