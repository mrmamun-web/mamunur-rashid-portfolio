"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";

const MOBILE_MENU_ANIMATION_MS = 220;
const SCROLL_OFFSET = 12;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clean up any pending delayed scroll when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Scroll to a section while accounting for the fixed navbar.
   *
   * We intentionally calculate the absolute document position instead of
   * relying on scrollIntoView(). This is more reliable on real mobile
   * browsers, especially while the mobile navigation is animating closed.
   */
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const header = document.querySelector("header");

    const headerHeight = header
      ? header.getBoundingClientRect().height
      : 0;

    const elementTop =
      element.getBoundingClientRect().top + window.scrollY;

    const targetTop = Math.max(
      0,
      elementTop - headerHeight - SCROLL_OFFSET
    );

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }, []);

  /**
   * Handle navigation to homepage sections.
   *
   * On mobile we first close the menu, allow its layout animation to finish,
   * then perform the scroll. This prevents the collapsing menu from changing
   * the page position while the browser is trying to scroll.
   */
  const handleNavClick = useCallback(
    (id: string) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      if (pathname !== "/") {
        setMobileOpen(false);
        window.location.href = `/#${id}`;
        return;
      }

      if (mobileOpen) {
        setMobileOpen(false);

        scrollTimeoutRef.current = setTimeout(() => {
          scrollToSection(id);
          scrollTimeoutRef.current = null;
        }, MOBILE_MENU_ANIMATION_MS);

        return;
      }

      scrollToSection(id);
    },
    [mobileOpen, pathname, scrollToSection]
  );

  const handleMobileMenuToggle = () => {
    setMobileOpen((previous) => !previous);
  };

  const handleInternalLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <header
      data-theme="dark"
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] select-none transition-colors duration-200"
    >
      <nav
        className="max-w-[1536px] w-full mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-12 py-4 relative"
        aria-label="Main navigation"
      >
        {/* Left Logo */}
        <button
          type="button"
          onClick={() => handleNavClick("home")}
          className="text-lg font-bold tracking-tight cursor-pointer z-10"
          aria-label={`${SITE_CONFIG.name} home`}
        >
          {SITE_CONFIG.name.split(" ")[0]}
          <span className="text-[var(--color-accent)]">.</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <button
              type="button"
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 cursor-pointer font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4 z-10">
          {/* Blog */}
          <Link
            href="/blog"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 font-medium"
          >
            Blog
          </Link>

          {/* Resume */}
          <Link
            href="/resume"
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] border border-[var(--color-border)] hover:border-[var(--color-accent)] px-3.5 py-2 rounded-full transition-colors duration-200"
          >
            <FileText
              size={14}
              className="text-[var(--color-accent)]"
            />
            <span>Resume</span>
          </Link>

          {/* Let's Talk */}
          <button
            type="button"
            onClick={() => handleNavClick("contact")}
            className="relative inline-flex items-center justify-center overflow-hidden rounded-full border border-[var(--color-accent)] px-6 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-200 group cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-[var(--color-accent)] translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" />

            <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
              Let&apos;s Talk
            </span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-3 z-10">
          <button
            type="button"
            onClick={handleMobileMenuToggle}
            className="text-[var(--color-text-primary)] p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: MOBILE_MENU_ANIMATION_MS / 1000,
              ease: "easeInOut",
            }}
            className="md:hidden overflow-hidden bg-[var(--color-background)]/95 backdrop-blur-md border-b border-[var(--color-border)]"
          >
            <div className="flex flex-col px-6 py-6 gap-5">
              {NAV_LINKS.map((link) => (
                <button
                  type="button"
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-base text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}

              {/* Blog */}
              <Link
                href="/blog"
                onClick={handleInternalLinkClick}
                className="text-left text-base text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200"
              >
                Blog
              </Link>

              {/* Resume + Let's Talk */}
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/resume"
                  onClick={handleInternalLinkClick}
                  className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] px-4 py-2 rounded-full hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors duration-200"
                >
                  <FileText
                    size={16}
                    className="text-[var(--color-accent)]"
                  />

                  Resume
                </Link>

                <button
                  type="button"
                  onClick={() => handleNavClick("contact")}
                  className="relative overflow-hidden rounded-full border border-[var(--color-accent)] px-6 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-200 group cursor-pointer"
                >
                  <span className="absolute inset-0 w-full h-full bg-[var(--color-accent)] translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" />

                  <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                    Let&apos;s Talk
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}