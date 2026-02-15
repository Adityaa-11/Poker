import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Page not found
      </p>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button className="mt-8" size="lg">
          Back to Home
        </Button>
      </Link>
    </div>
  )
}
