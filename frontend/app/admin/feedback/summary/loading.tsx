export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-full h-[200px] bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
