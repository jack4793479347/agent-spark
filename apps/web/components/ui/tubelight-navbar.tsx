"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const isHome = pathname === "/"

  // Track which section is in view on the home page
  useEffect(() => {
    if (!isHome) { setActiveSection(null); return }

    const sectionIds = items
      .filter((item) => item.url.startsWith("/#"))
      .map((item) => item.url.replace("/#", ""))

    if (sectionIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Don't activate sections when near the top of the page
        if (window.scrollY < 200) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    )

    // Delay observer setup to avoid false triggers on page load
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    }, 100)

    // Reset to Home when at top
    const handleScroll = () => {
      if (window.scrollY < 200) setActiveSection(null)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => { clearTimeout(timer); observer.disconnect(); window.removeEventListener("scroll", handleScroll) }
  }, [isHome, items])

  // Derive active tab
  const activeTab = (() => {
    if (isHome && activeSection) {
      const match = items.find((item) => item.url === `/#${activeSection}`)
      if (match) return match.name
    }
    if (isHome) return items[0].name
    return (
      items.find((item) =>
        item.url === "/" ? false : !item.url.startsWith("/#") && pathname.startsWith(item.url)
      )?.name ?? items[0].name
    )
  })()

  const handleClick = useCallback(
    (e: React.MouseEvent, item: NavItem) => {
      if (item.url.startsWith("/#")) {
        const sectionId = item.url.replace("/#", "")
        if (isHome) {
          e.preventDefault()
          const el = document.getElementById(sectionId)
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        // If not on home, Link will navigate to /#section and browser will scroll
      } else if (item.url === "/" && isHome) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [isHome],
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-3 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-white/80 border border-neutral-200/60 backdrop-blur-lg py-1 px-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={(e) => handleClick(e, item)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-neutral-500 hover:text-neutral-900",
                isActive && "bg-neutral-100 text-neutral-900",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-neutral-900/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-neutral-900 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-neutral-900/15 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-neutral-900/15 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-neutral-900/10 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
