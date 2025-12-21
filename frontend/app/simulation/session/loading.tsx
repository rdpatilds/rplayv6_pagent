import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen bg-[rgb(239,239,239)]">
      {/* Left Sidebar - Client Profile */}
      <div className="w-64 bg-white p-4 overflow-auto border-r">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        </div>

        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </div>

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="flex justify-start">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <Skeleton className="h-16 w-3/4 rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-2/3 rounded-lg mr-2" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <Skeleton className="h-20 w-3/4 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex space-x-2">
            <Skeleton className="h-20 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Notes */}
      <div className="w-64 bg-white p-4 overflow-auto border-l">
        <div className="mb-4">
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        <Skeleton className="h-24 w-full rounded-md mt-6" />
      </div>
    </div>
  )
}
