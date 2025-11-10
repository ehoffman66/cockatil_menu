import { useState, useRef, useEffect } from "react";
import { Search, ChevronLeft } from "lucide-react";
import cocktailsData from "./data/cocktails.json";

const cocktails = cocktailsData.sort((a, b) => a.name.localeCompare(b.name));

const emojiForSpirit = (baseSpirit) => {
  const key = baseSpirit.toLowerCase();
  if (key.includes("whiskey") || key.includes("bourbon") || key.includes("rye")) return "🥃";
  if (key.includes("gin")) return "🍸";
  if (key.includes("rum")) return "🍹";
  if (key.includes("vodka")) return "🍶";
  if (key.includes("tequila")) return "🌵";
  if (key.includes("pisco")) return "🍋";
  if (key.includes("aperol")) return "🍊";
  if (key.includes("brandy") || key.includes("cognac")) return "🍷";
  return "🍸";
};

// remove amounts/units/quantity words from an ingredient string (for list preview)
const cleanIngredient = (i) =>
  i
    // numeric amounts + common units
    .replace(/\b\d*\.?\d+\s?(oz|ml|tsp|tbsp|teaspoon|tablespoon|dash(?:es)?|barspoon|cube|cubes?|slice|slices?)\b/gi, "")
    // unicode fractions with units
    .replace(/[¼½¾⅓⅔⅛⅜⅝⅞]\s?(oz|ml|tsp|tbsp|teaspoon|tablespoon|dash(?:es)?|barspoon|cube|cubes?)\b/gi, "")
    // leading quantity words
    .replace(/^\s*(one|two|three|a|an|\d+)\s+(of\s+)?/i, "")
    // tidy commas/spaces
    .replace(/\s{2,}/g, " ")
    .replace(/^,|,$/g, "")
    .trim();

export default function CocktailMenu() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [scrolled, setScrolled] = useState(false);
  const [baseFilter, setBaseFilter] = useState("");

  const loader = useRef(null);
  const scrollContainer = useRef(null);

  const baseOptions = [...new Set(cocktails.map((c) => c.baseSpirit))].sort();

  const filtered = cocktails
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ingredients.join(", ").toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => baseFilter === "" || c.baseSpirit === baseFilter)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Infinite Scroll
  useEffect(() => {
    const container = scrollContainer.current;
    const sentinel = loader.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 6, filtered.length));
        }
      },
      { root: container, rootMargin: "200px 0px", threshold: 0.0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, selected]);

  // header shadow on scroll
  useEffect(() => {
    const el = scrollContainer.current;
    const handleScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // === Detail View ===
  if (selected) {
    return (
      <div className="menu-container">
        <div className="menu-card" ref={scrollContainer}>
          <button className="back-btn" onClick={() => setSelected(null)}>
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="recipe-name">
            {emojiForSpirit(selected.baseSpirit)} {selected.name}
          </h1>

          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {selected.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>

          <h2>Instructions</h2>
          <p className="instructions">{selected.instructions}</p>

          {selected.garnish && (
            <>
              <h2>Garnish</h2>
              <p className="instructions">{selected.garnish}</p>
            </>
          )}

          <div className="info-card">
            <h2>Details</h2>
            <div className="info-content">
              <p><strong>Base Spirit:</strong> {selected.baseSpirit}</p>
              <p><strong>Glass:</strong> {selected.glass}</p>
            </div>
          </div>

          {selected.notes && (
            <div className="notes-card">
              <h2>Notes</h2>
              <div className="notes">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === Menu View ===
  return (
    <div className="menu-container">
      <div className="menu-card" ref={scrollContainer}>
        <div className={`sticky-header ${scrolled ? "scrolled" : ""}`}>
          <div className="menu-header">
            <h1>Erik's Cocktail Menu</h1>
          </div>

          <div className="search-bar">
            <Search size={18} color="#999" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setVisibleCount(6);
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="filters">
            <select
              value={baseFilter}
              onChange={(e) => setBaseFilter(e.target.value)}
            >
              <option value="">All Spirits</option>
              {baseOptions.map((spirit) => (
                <option key={spirit} value={spirit}>
                  {spirit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ul className="cocktail-list">
          {filtered.slice(0, visibleCount).map((c) => (
            <li key={c.name} onClick={() => setSelected(c)}>
              <span className="icon">{emojiForSpirit(c.baseSpirit)}</span>
              <div>
                <p className="name">{c.name}</p>
                <p className="ingredients">
                  {c.ingredients
                    .map(cleanIngredient)
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="no-results">No cocktails found</div>
        )}

        {visibleCount < filtered.length && (
          <div ref={loader} className="loader">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
