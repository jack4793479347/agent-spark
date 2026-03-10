import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

function StackedCircularFooter() {
  return (
    <footer className="py-12" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <nav className="mb-8 flex flex-wrap justify-center gap-6" style={{ fontFamily: 'var(--font-body)' }}>
            <Link href="/" className="text-sm hover:text-[#1A1A1A] transition-colors" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
            <Link href="/marketplace" className="text-sm hover:text-[#1A1A1A] transition-colors" style={{ color: '#888', textDecoration: 'none' }}>Marketplace</Link>
            <Link href="/products/studio" className="text-sm hover:text-[#1A1A1A] transition-colors" style={{ color: '#888', textDecoration: 'none' }}>Studio</Link>
            <Link href="/pricing" className="text-sm hover:text-[#1A1A1A] transition-colors" style={{ color: '#888', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/about" className="text-sm hover:text-[#1A1A1A] transition-colors" style={{ color: '#888', textDecoration: 'none' }}>About</Link>
          </nav>
          <div className="mb-8 w-full max-w-md">
            <form className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="footer-email" className="sr-only">Email</Label>
                <Input
                  id="footer-email"
                  placeholder="Enter your email"
                  type="email"
                  className="rounded-full border-[rgba(0,0,0,0.08)] bg-white/50 backdrop-blur-sm placeholder:text-[#CCC]"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
              <Button
                type="submit"
                className="rounded-full"
                style={{
                  background: '#1A1A1A',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                Subscribe
              </Button>
            </form>
          </div>
          <div className="text-center">
            <p className="text-sm" style={{ color: '#CCC', fontFamily: 'var(--font-body)' }}>
              &copy; 2025 Agent Spark. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { StackedCircularFooter }
