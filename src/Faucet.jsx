import { useEffect, useMemo, useState } from "react";
import "./faucet.css";

const DRIP_LABEL = "87,150 WISDOG";

export default function Faucet() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txCountdown, setTxCountdown] = useState(0);

  useEffect(() => {
    if (txCountdown <= 0) return;
    const t = setTimeout(() => setTxCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [txCountdown]);

  const isValidEvm = useMemo(
    () => /^0x[a-fA-F0-9]{40}$/.test(address.trim()),
    [address]
  );

  async function requestTokens() {
    if (!isValidEvm) {
      setStatus("error");
      setMessage("Please enter a valid EVM address.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      setTxHash("");
      setTxCountdown(0);

      const res = await fetch("/.netlify/functions/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const err =
          data?.error ||
          `Request failed (${res.status})`;
        throw new Error(err);
      }

      setTxHash(data.txHash);
      setStatus("success");
      setMessage(`${DRIP_LABEL} has been sent to your address!`);
      setTxCountdown(10);
    } catch (e) {
      setStatus("error");
      setMessage(e.message || "Something went wrong. Please try again later.");
    }
  }

  return (
    <div className="page">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <main className="container">
        <header className="header">
          <div className="badge">Faucet</div>
          <h1>Wisdog Faucet</h1>
          <p className="sub">
            Enter your EVM address and receive <b>{DRIP_LABEL}</b> on LadyChain.
            No wallet connect needed.
          </p>
        </header>

        <section className="card">
          <label className="label" htmlFor="addr">Your EVM Address</label>
          <div className="input-row">
            <input
              id="addr"
              className={`input ${address && !isValidEvm ? "input-error" : ""}`}
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            <div className={`pill ${isValidEvm ? "pill-ok" : "pill-warn"}`}>
              {address ? (isValidEvm ? "Valid" : "Invalid") : "EVM"}
            </div>
          </div>

          <p className="helper">
            One claim per address. Faucet sends WISDOG token on LadyChain (chainId 589).
          </p>

          <button
            className="btn"
            onClick={requestTokens}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <span className="spinner" />
                Sending…
              </>
            ) : (
              `Request ${DRIP_LABEL}`
            )}
          </button>

          <div className="info">
            <div className="info-item">
              <span className="dot" /> You will receive exactly <b>{DRIP_LABEL}</b>.
            </div>
            <div className="info-item">
              <span className="dot" /> One request per address.
            </div>
          </div>

          {status === "success" && (
            <div className="alert success">
              <b>Success!</b> {message}
              {txHash && (
                <div className="tx">
                  Tx: <code>{txHash}</code>
                  {txCountdown > 0 ? (
                    <span className="tx-pending">
                      <span className="spinner" />
                      Sending WISDOG… ({txCountdown}s)
                    </span>
                  ) : (
                    <a
                      href={`https://ladyscan.us/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="alert error">
              <b>Error:</b> {message}
            </div>
          )}
        </section>

        <footer className="footer">
          Powered by Wisdog • Faucet sends {DRIP_LABEL} per request
        </footer>
      </main>
    </div>
  );
}
