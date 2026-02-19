"use client"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Something went wrong</h1>
            <p style={{ color: "#666" }}>An unexpected error occurred.</p>
            <button
                onClick={reset}
                style={{ padding: "0.5rem 1.5rem", background: "#0070f3", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
            >
                Try again
            </button>
            <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>Go back home</a>
        </div>
    )
}
