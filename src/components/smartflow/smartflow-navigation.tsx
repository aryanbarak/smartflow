"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Workflows", href: "#workflows" },
  { name: "Automation", href: "#automation" },
  { name: "Agents", href: "#agents" },
  { name: "Deploy", href: "#deploy" },
];

export function SmartflowNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const showPattern = isScrolled || isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`relative mx-auto overflow-hidden transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "max-w-[1180px] rounded-2xl border border-foreground/10 bg-background/85 shadow-lg backdrop-blur-xl"
            : "max-w-[1400px] bg-transparent"
        }`}
      >
        <motion.div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-5 z-0 transition-opacity duration-500 ${
            showPattern ? "opacity-70" : "opacity-0"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle at center, hsl(248 95% 82% / 0.48) 0 0.3px, hsl(var(--primary) / 0.22) 0.42px, transparent 0.72px)",
            backgroundSize: "14px 14px",
            backgroundPosition: "0px 0px",
            mixBlendMode: "screen",
            willChange: "transform",
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -12, 5, 0],
                  y: [0, 10, 4, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 14, ease: "easeInOut", repeat: Infinity }
          }
        />
        <div
          className={`relative z-10 flex items-center justify-between px-5 transition-all duration-500 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          <a href="#" className="flex items-baseline gap-2">
            <span className={`font-display tracking-tight ${isScrolled ? "text-xl" : "text-2xl"}`}>
              Smartflow
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">AI</span>
          </a>

          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="group relative text-sm text-foreground/65 transition-colors hover:text-foreground"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a href="#deploy" className="text-sm text-foreground/65 transition-colors hover:text-foreground">
              Sign in
            </a>
            <Button
              size="sm"
              className={`rounded-full bg-foreground text-background hover:bg-foreground/90 ${
                isScrolled ? "h-8 px-4 text-xs" : "px-6"
              }`}
            >
              Start automating
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            className="p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-background transition-all duration-500 md:hidden ${
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col px-8 pb-8 pt-28">
          <div className="flex flex-1 flex-col justify-center gap-8">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-display text-5xl transition-all duration-500 ${
                  isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${index * 70}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-foreground/10 pt-8">
            <Button variant="outline" className="h-14 rounded-full" onClick={() => setIsMobileMenuOpen(false)}>
              Sign in
            </Button>
            <Button className="h-14 rounded-full bg-foreground text-background" onClick={() => setIsMobileMenuOpen(false)}>
              Start
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
