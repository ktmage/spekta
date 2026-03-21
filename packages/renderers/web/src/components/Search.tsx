import { useState, useRef, useEffect } from "preact/hooks";

interface SearchEntry {
  pageId: string;
  pageTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

interface Props {
  entries: SearchEntry[];
}

export default function Search({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results =
    query.length > 0
      ? entries.filter((entry) => {
          const q = query.toLowerCase();
          const pageMatch = entry.pageTitle.toLowerCase().includes(q);
          const sectionMatch = entry.sectionTitle
            ? entry.sectionTitle.toLowerCase().includes(q)
            : false;
          return pageMatch || sectionMatch;
        })
      : [];

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selected = resultsRef.current.children[selectedIndex] as
        | HTMLElement
        | undefined;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateTo(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function navigateTo(entry: SearchEntry) {
    const hash = entry.sectionId ? `#${entry.sectionId}` : "";
    window.location.href = `/${entry.pageId}/${hash}`;
    setQuery("");
    setIsOpen(false);
  }

  function handleInput(e: Event) {
    setQuery((e.target as HTMLInputElement).value);
    setIsOpen(true);
  }

  function handleFocus() {
    if (query.length > 0) {
      setIsOpen(true);
    }
  }

  function handleBlur() {
    // Delay closing to allow click events on results
    setTimeout(() => setIsOpen(false), 150);
  }

  return (
    <div class="search">
      <input
        ref={inputRef}
        type="text"
        class="search__input"
        placeholder="検索..."
        value={query}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {isOpen && results.length > 0 && (
        <div class="search__results" ref={resultsRef}>
          {results.map((entry, i) => (
            <button
              key={`${entry.pageId}-${entry.sectionId ?? "page"}`}
              class={`search__result ${i === selectedIndex ? "search__result--selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                navigateTo(entry);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span class="search__result-label">
                {entry.sectionTitle ?? entry.pageTitle}
              </span>
              {entry.sectionTitle && (
                <span class="search__result-context">{entry.pageTitle}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
