'use client'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you requested does not exist.</p>
      </section>
    </main>
  )
}
