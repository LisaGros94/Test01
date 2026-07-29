import { useEffect, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { StoreProvider, useStore } from "./store";
import { tzLabel } from "./lib";
import { Kbd } from "./ui";
import Home from "./pages/Home";
import Work from "./pages/Work";
import Mine from "./pages/Mine";
import Unowned from "./pages/Unowned";
import Knowledge from "./pages/Knowledge";
import CommandK from "./CommandK";
import NewCommitment from "./NewCommitment";

function Shell() {
  const { state, resetDemo } = useStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (typing) return;
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "c") {
        e.preventDefault();
        setCreateOpen(true);
      }
      if (e.key === "g") {
        // g then m / w / u — simple two-key chords
        const once = (e2: KeyboardEvent) => {
          if (e2.key === "m") navigate("/mine");
          if (e2.key === "w") navigate("/work");
          if (e2.key === "u") navigate("/unowned");
          if (e2.key === "k") navigate("/knowledge");
          if (e2.key === "h") navigate("/");
        };
        window.addEventListener("keydown", once, { once: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const nav = [
    { to: "/", label: "Today" },
    { to: "/work", label: "Work" },
    { to: "/mine", label: "Mine" },
    { to: "/unowned", label: "Unowned" },
    { to: "/knowledge", label: "Knowledge" },
  ];

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-hairline px-7 py-9 md:flex">
        <div>
          <div className="label-lg mb-14 tracking-[0.24em]">Blanche</div>
          <nav className="flex flex-col gap-5">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `label transition-opacity duration-150 ${
                    isActive ? "text-ink" : "text-mid hover:text-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-14 flex flex-col gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="label flex items-center gap-3 text-left text-mid transition-opacity hover:text-ink"
            >
              Search <Kbd>⌘K</Kbd>
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="label flex items-center gap-3 text-left text-mid transition-opacity hover:text-ink"
            >
              New <Kbd>C</Kbd>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="label text-mid">
            {state.people.find((p) => p.id === state.meId)?.name} · {tzLabel()}
          </div>
          <button
            onClick={resetDemo}
            className="label text-left text-mid opacity-60 transition-opacity hover:opacity-100"
          >
            Reset demo data
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-9 md:px-14">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/mine" element={<Mine />} />
          <Route path="/unowned" element={<Unowned />} />
          <Route path="/knowledge" element={<Knowledge />} />
        </Routes>
      </main>

      {paletteOpen && <CommandK onClose={() => setPaletteOpen(false)} />}
      {createOpen && <NewCommitment onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
