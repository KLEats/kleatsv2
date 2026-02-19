export default function Custom500() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: "1rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>500 - Server Error</h1>
            <p style={{ color: "#666" }}>Something went wrong on our end.</p>
            <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>Go back home</a>
        </div>
    )
}
