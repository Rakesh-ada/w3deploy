"use client"

import React, { forwardRef, useRef } from "react"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { Folder, Box, Database, Globe, Link as LinkIcon, User } from "lucide-react"
import Link from "next/link"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = "Circle"

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative flex h-[300px] w-full items-center justify-center overflow-hidden p-10"
        ref={containerRef}
      >
        <div className="flex size-full max-h-[200px] max-w-lg flex-col items-stretch justify-between gap-10">
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div1Ref}>
              <Folder className="text-zinc-400" />
            </Circle>
            <Circle ref={div5Ref}>
              <Globe className="text-zinc-400" />
            </Circle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div2Ref}>
              <Box className="text-zinc-400" />
            </Circle>
            <Circle ref={div4Ref} className="w-auto h-auto rounded-xl bg-zinc-950 border border-purple-500/50 flex flex-col justify-center items-center px-6 py-4">
              <Link href="/" className="flex items-center space-x-2">
                <span style={{ fontFamily: 'var(--font-bitcount)' }} className="text-4xl tracking-tight text-white">
                  AlgoFlow
                </span>
              </Link>
            </Circle>
            <Circle ref={div6Ref}>
              <LinkIcon className="text-zinc-400" />
            </Circle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div3Ref}>
              <Database className="text-zinc-400" />
            </Circle>
            <Circle ref={div7Ref}>
              <User className="text-zinc-400" />
            </Circle>
          </div>
        </div>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div1Ref}
          toRef={div4Ref}
          curvature={-75}
          endYOffset={-10}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div2Ref}
          toRef={div4Ref}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div3Ref}
          toRef={div4Ref}
          curvature={75}
          endYOffset={10}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div5Ref}
          toRef={div4Ref}
          curvature={-75}
          endYOffset={-10}
          reverse
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div6Ref}
          toRef={div4Ref}
          reverse
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div7Ref}
          toRef={div4Ref}
          curvature={75}
          endYOffset={10}
          reverse
        />
      </div>
      <div className="text-center pb-6 text-zinc-500 text-sm font-medium">
        Deploy propagating across decentralized infrastructure...
      </div>
    </div>
  )
}
