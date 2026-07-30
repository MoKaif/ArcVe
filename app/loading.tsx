import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="relative h-48 w-48 animate-pulse duration-1000">
        <Image
          src="/logo.png"
          alt="ArcVe Logo"
          fill
          className="object-contain filter grayscale brightness-150"
          priority
        />
      </div>
      <div className="mt-8">
        <div className="flex justify-center space-x-1">
          <div className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-1 w-1 animate-bounce rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  )
}
