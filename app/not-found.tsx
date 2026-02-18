// Force Next.js to skip static prerendering of the not-found page
// (avoids build errors from Server Components that depend on runtime context)
export const dynamic = "force-dynamic"

export default function NotFound() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>404 — Page Not Found</h1>
            <p style={{ color: "#666" }}>The page you're looking for doesn't exist.</p>
            <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>Go back home</a>
        </div>
    )
}
