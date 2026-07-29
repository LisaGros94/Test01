import { useState } from "react";

/**
 * Shared team password. This is a speed bump for a demo URL, not security —
 * the check runs client-side. Real auth (Google-domain SSO) arrives with Supabase.
 *
 * Current password: "blanche". To change it, run this in a browser console
 * and paste the result below:
 *   crypto.subtle.digest("SHA-256", new TextEncoder().encode("new-password"))
 *     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
 */
const PASSWORD_HASH = "446acc36bce9a33c2e19f0205c0a94b8a35955814b560532b0ecefbf90a6d055";
const UNLOCK_KEY = "blanche-hq-gate";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export default function Gate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(UNLOCK_KEY) === PASSWORD_HASH
  );
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  if (unlocked) return <>{children}</>;

  const attempt = async () => {
    const hash = await sha256(value);
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(UNLOCK_KEY, hash);
      setUnlocked(true);
    } else {
      setWrong(true);
      setValue("");
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="fade-in w-full max-w-xs px-6 pb-24">
        <div className="label-lg mb-16 text-center tracking-[0.3em]">Blanche</div>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Password"
          className="hairline-b w-full py-3 text-center"
        />
        <div className="label mt-6 text-center text-mid">
          {wrong ? <span className="text-oxblood">Not it. Try again.</span> : "Enter to continue"}
        </div>
      </div>
    </div>
  );
}
