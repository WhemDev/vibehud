export const metadata = { title: 'Blogfolio' }

function VibehudButton() {
  return (
    <a
      href="/vibehud"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 100,
        background: '#ffe14d',
        color: '#14120e',
        border: '2px solid #14120e',
        boxShadow: '3px 3px 0 #14120e',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        fontWeight: 700,
        padding: '10px 14px',
        textDecoration: 'none',
      }}
    >
      ▦ /vibehud
    </a>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#fff', color: '#14120e' }}>
        {children}
        <VibehudButton />
      </body>
    </html>
  )
}
