
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants, TargetAndTransition } from "framer-motion";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import LightRays from "../components/LightRays";
import { AnimatedBeamDemo } from "../components/animated-beam-demo";

// Utils
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

// Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

// AnimatedGroup Component
type PresetType = "fade" | "slide" | "scale" | "blur" | "blur-slide" | "zoom" | "flip" | "bounce" | "rotate" | "swing";

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?: PresetType;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(4px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
  },
  "blur-slide": {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(4px)", y: 20 },
      visible: { opacity: 1, filter: "blur(0px)", y: 0 },
    },
  },
  zoom: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      },
    },
  },
  flip: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotateX: -90 },
      visible: {
        opacity: 1,
        rotateX: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      },
    },
  },
  bounce: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: -50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 400, damping: 10 },
      },
    },
  },
  rotate: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -180 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: "spring" as const, stiffness: 200, damping: 15 },
      },
    },
  },
  swing: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -10 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 8 },
      },
    },
  },
};

function AnimatedGroup({ children, className, variants, preset }: AnimatedGroupProps) {
  const selectedVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className={cn(className)}>
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Logo Component
const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span style={{ fontFamily: 'var(--font-bitcount)' }} className="text-4xl tracking-tight text-white">
        AlgoFlow
      </span>
    </div>
  );
};

// Menu Items
const menuItems = [
  { name: "Product", href: "#link" },
  { name: "Docs", href: "#link" },
  { name: "Pricing", href: "#link" },
  { name: "GitHub", href: "#link" },
];

// Header Component
const HeroHeader = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-20 w-full px-2 group">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <a href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </a>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="text-muted-foreground hover:text-accent-foreground block duration-150">
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a href={item.href} className="text-muted-foreground hover:text-accent-foreground block duration-150">
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm" className={cn(isScrolled && "lg:hidden")}>
                  <a href="#">
                    <span>Sign In</span>
                  </a>
                </Button>
                <Button asChild size="sm" className={cn(isScrolled && "lg:hidden")}>
                  <a href="#">
                    <span>Dashboard</span>
                  </a>
                </Button>
                <Button asChild size="sm" className={cn(isScrolled ? "lg:inline-flex" : "hidden")}>
                  <a href="#">
                    <span>Deploy Now </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

// Transition Variants
const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

// Main Hero Section Component
export function ModernDarkHeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-clip bg-background">
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
        >
          <div className="absolute inset-0 z-0 opacity-80">
            <LightRays raysColor="#2BC8B7" raysSpeed={1.5} fadeDistance={1.2} />
          </div>
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring" as const,
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20"
            >
              <img
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                alt="background"
                className="absolute inset-x-0 top-56 -z-20 lg:top-32"
                width="3276"
                height="4095"
              />
            </AnimatedGroup>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <a
                    href="#link"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                  >
                    <span className="text-foreground text-sm">⚡ AI-Powered Web3 Deployment • Built for Developers</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] text-foreground">
                    Deploy Web2 Apps to Web3 — Instantly
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    AlgoFlow uses AI to convert, optimize, and deploy your apps to IPFS with verifiable on-chain ownership.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div key={1} className="bg-foreground/10 rounded-[14px] border p-0.5">
                    <Button asChild size="lg" className="rounded-xl px-5 text-base">
                      <a href="#link">
                        <span className="text-nowrap">Deploy Now</span>
                      </a>
                    </Button>
                  </div>
                  <Button key={2} asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                    <a href="#link">
                      <span className="text-nowrap">View Docs</span>
                    </a>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                  <img
                    className="bg-background aspect-15/8 relative rounded-2xl"
                    src="https://tailark.com//_next/image?url=%2Fmail2.png&w=3840&q=75"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        {/* Sticky Scroll Container */}
        <div className="relative w-full">
          {/* Deployment Terminal Section */}
          <section className="sticky top-0 h-[100dvh] w-full flex flex-col justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 z-10 overflow-hidden transform-gpu">
            <div className="mx-auto max-w-7xl px-6 w-full">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                    Farewell to downtime.
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Your site lives on IPFS — content-addressed, unstoppable, and pinned with provider failover for reliability. No single entity can take it down.
                  </p>
                </div>

                {/* Right Terminal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800">
                    {/* Terminal Header */}
                    <div className="bg-zinc-800/50 px-4 py-3 flex items-center gap-2 border-b border-zinc-700/50">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-6 font-mono text-sm space-y-2">
                      <div className="text-zinc-500">
                        # GitHub Actions · deploy.yml · push to main
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">▶</span>
                        <span className="text-zinc-200">Run deploy job</span>
                      </div>
                      <div className="pl-4 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-green-400"></span>
                          <span className="text-zinc-400">
                            Building... <span className="text-green-400">dist/</span> (2.3MB, 847 files)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400"></span>
                          <span className="text-zinc-400">
                            Uploading to Pinata (v3)... <span className="text-green-400">bafybeig3...</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400"></span>
                          <span className="text-zinc-400">
                            Fallback check (Pinata v2 / Lighthouse)... <span className="text-green-400">ready if needed</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400"></span>
                          <span className="text-zinc-400">
                            Updating ENS/IPNS... <span className="text-green-400">auto subdomain or custom ENS flow</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400"></span>
                          <span className="text-zinc-400">
                            Writing log... <span className="text-green-400">latest-deploy.json</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-pink-400"></span>
                          <span className="text-zinc-300">
                            Live at <a href="https://myapp.eth.limo" className="text-cyan-400 hover:underline">https://myapp.eth.limo</a>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Config On-Chain Section */}
          <section className="sticky top-0 h-[100dvh] w-full flex flex-col justify-center bg-gradient-to-b from-pink-100 to-pink-50 dark:from-pink-950 dark:to-pink-900 z-20 overflow-hidden border-t-2 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transform-gpu">
            <div className="mx-auto max-w-7xl px-6 w-full">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="space-y-6">
                  <div className="flex gap-2 mb-6">
                    <div className="w-4 h-4 rounded bg-purple-900"></div>
                    <div className="w-4 h-4 rounded bg-purple-400/40"></div>
                    <div className="w-4 h-4 rounded bg-purple-400/40"></div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                    Config lives on-chain.
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Use auto subdomains under pushx.eth, or bring your own ENS with one-time ENS → IPNS setup and automatic IPNS → IPFS updates on every deploy.
                  </p>
                </div>

                {/* Right ENS Config Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50/30 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-pink-200/50 dark:border-zinc-700">
                    {/* Dotted Background Pattern */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'radial-gradient(circle, #ec4899 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>

                    {/* Card Content */}
                    <div className="relative p-8 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-xl font-mono font-bold text-foreground">myapp.eth</h3>
                        <p className="text-sm text-muted-foreground">— ENS Text Records</p>
                      </div>

                      <div className="space-y-4 font-mono text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">deploy.cid</span>
                          <span className="text-teal-500 dark:text-teal-400 font-semibold">bafybeig3...</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">ens.mode</span>
                          <span className="text-pink-600 dark:text-pink-400 font-semibold">auto | custom</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">ens.contenthash</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">ipfs://... or ipns://...</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">deploy.env</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">production</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">deploy.framework</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">next</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">access.policy</span>
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">token-gated</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">gov.multisig</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">0xSAFE...</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">fee.recipient</span>
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">0xABCD...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* True Ownership Section */}
          <section className="sticky top-0 h-[100dvh] w-full flex flex-col justify-center bg-gradient-to-b from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 z-30 overflow-hidden border-t-2 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transform-gpu">
            <div className="mx-auto max-w-7xl px-6 w-full">
              {/* Header */}
              <div className="mb-16 space-y-6">
                <div className="flex gap-2 mb-6">
                  <div className="w-4 h-4 rounded bg-green-800"></div>
                  <div className="w-4 h-4 rounded bg-green-400/40"></div>
                  <div className="w-4 h-4 rounded bg-green-400/40"></div>
                </div>
                <div className="grid lg:grid-cols-2 gap-8 items-end">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                    True ownership.
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Your ENS domain is 100% yours. No registrar can seize it, no CDN can blacklist you. Your site is uncensored and irrevocable — forever.
                  </p>
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="relative">
                {/* Dotted Background */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="relative grid md:grid-cols-2 gap-8">
                  {/* Web2 Hosting Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 space-y-6 border border-red-200/50 dark:border-zinc-700"
                  >
                    <h3 className="text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider">
                      Web2 Hosting
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1"></span>
                        <p className="text-foreground/80">Domain registrars can seize your .com</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1"></span>
                        <p className="text-foreground/80">CDNs can blacklist your IP address</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1"></span>
                        <p className="text-foreground/80">GitHub can suspend your pipeline</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1"></span>
                        <p className="text-foreground/80">No on-chain audit trail of deploys</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* D3ploy Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-green-800 dark:bg-green-900/50 rounded-2xl shadow-xl p-8 space-y-6 border border-green-600/50"
                  >
                    <h3 className="text-green-100 font-bold text-sm uppercase tracking-wider">
                      AlgoFlow
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-green-300 mt-1"></span>
                        <p className="text-green-50">ENS domain — permanently on-chain</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-300 mt-1"></span>
                        <p className="text-green-50">IPFS content is content-addressed forever</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-300 mt-1"></span>
                        <p className="text-green-50">Pinata-first upload with fallback chain</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-300 mt-1"></span>
                        <p className="text-green-50">Immutable deploy registry on-chain</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* How It Works Process Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center space-y-4">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
                </svg>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Deployment Flow</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white whitespace-nowrap">
                Deploy unstoppable{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  sites in minutes
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-zinc-400 max-w-2xl text-balance">
                From build to global access — AlgoFlow handles packaging, pinning, domain linking, and updates across decentralized infrastructure.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <div className="inline-block bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Step 1
                </div>
                <h3 className="text-3xl font-bold text-white">
                  Build & Package Your App
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Prepare your project for decentralized deployment — bundle static assets, optimize output, and generate a content-addressed build ready for IPFS.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="w-32 h-32 mx-auto mb-4 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-900/20 blur-xl"></div>
                      <div className="relative w-full h-full rounded-full border border-purple-500/30 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-t-4 border-purple-500 animate-spin"></div>
                        {/* Package icon centered over the spinner */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16.5 9.4l-9-5.19" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <path d="M3.29 7L12 12l8.71-5" />
                            <path d="M12 22V12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-zinc-400">Preparing build for deployment...</p>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Build optimization</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Asset hashing</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Static export</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Bundle verification</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Ready for upload</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <div className="inline-block bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Step 2
                </div>
                <h3 className="text-3xl font-bold text-white">
                  Upload & Pin to IPFS
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Your build is uploaded to IPFS and pinned across multiple providers — ensuring redundancy, reliability, and permanent content addressing.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-4 text-zinc-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs">deploy.log</span>
                    </div>
                    <div className="space-y-1 text-zinc-400 font-mono text-[13px] leading-tight">
                      <div><span className="text-zinc-500"># Upload build to IPFS</span></div>
                      <div>Uploading dist/ → <span className="text-blue-400">bafybeig3...</span></div>
                      <div className="pt-2"><span className="text-zinc-500"># Pinning across providers</span></div>
                      <div>Pinata ✓</div>
                      <div>Web3.Storage ✓</div>
                      <div>Fallback ✓</div>
                      <div className="pt-2"><span className="text-zinc-500"># Deployment CID generated</span></div>
                      <div>CID: <span className="text-purple-400">bafybeig3...</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <div className="inline-block bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Step 3
                </div>
                <h3 className="text-3xl font-bold text-white">
                  Publish & Connect Your Domain
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Your deployment is pinned to IPFS and linked to an ENS domain — making your app accessible, permanent, and censorship-resistant across gateways.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
                  <AnimatedBeamDemo />
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <div className="inline-block bg-zinc-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Step 4
                </div>
                <h3 className="text-3xl font-bold text-white">
                  Update & Stay Live
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Every new deploy updates your IPFS content and automatically syncs with ENS/IPNS — ensuring your app stays live without downtime or manual intervention.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Latest deployment synced</p>
                        <p className="text-zinc-500 text-xs">IPFS CID updated successfully</p>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Domain pointing to latest version</p>
                        <p className="text-zinc-500 text-xs">Auto-updated via IPNS</p>
                      </div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Always live & accessible</p>
                        <p className="text-zinc-500 text-xs">Served via decentralized gateways</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Deployment Paths Section */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center space-y-4">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.5-1.5 3.5 0 5s3.5 1.5 5 0l3.5-3.5c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0l-.5.5" />
                  <path d="M19.5 7.5c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0L11 6c-1.5 1.5-1.5 3.5 0 5s3.5 1.5 5 0l.5-.5" />
                </svg>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">DEPLOYMENT OPTIONS</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white whitespace-nowrap">
                Choose{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  how you deploy
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-zinc-400 max-w-2xl text-balance">
                Start from GitHub, automate with CI, or manage ENS directly — different workflows, same decentralized ownership.
              </p>
            </div>

            {/* Deployment Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* GitHub Connect Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-blue-50/50 dark:bg-blue-950/20 rounded-3xl p-8 space-y-6 border border-blue-200/50 dark:border-blue-900/30"
              >
                <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                <div className="space-y-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">
                    Connect
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    GitHub Connect
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Link your repo and deploy on every push — each project gets a stable subdomain instantly.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  Best for quick starts
                </p>
              </motion.div>

              {/* GitHub Actions Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-green-50/50 dark:bg-green-950/20 rounded-3xl p-8 space-y-6 border border-green-200/50 dark:border-green-900/30"
              >
                <div className="h-1 w-12 bg-green-700 rounded-full"></div>
                <div className="space-y-2">
                  <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wider font-semibold">
                    Automate
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    GitHub Actions
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Automate deployments on every push with reliable pinning and built-in fallback.
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                  Best for CI/CD workflows
                </p>
              </motion.div>

              {/* ENS Dashboard Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-pink-50/50 dark:bg-pink-950/20 rounded-3xl p-8 space-y-6 border border-pink-200/50 dark:border-pink-900/30"
              >
                <div className="h-1 w-12 bg-pink-600 rounded-full"></div>
                <div className="space-y-2">
                  <p className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-wider font-semibold">
                    Control
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    ENS Dashboard
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Manage your ENS domain and route deployments with automatic IPNS and IPFS updates.
                </p>
                <p className="text-sm text-pink-600 dark:text-pink-400 font-semibold">
                  Best for custom domains
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center space-y-4">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2Z" />
                  <circle cx="7" cy="7" r="1" fill="currentColor" />
                </svg>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Pricing Plans</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white whitespace-nowrap">
                Simple &amp;{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  Transparent Plans
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-zinc-400 max-w-2xl text-balance">
                Pay only for what you deploy — decentralized hosting, ENS integration, and seamless updates included.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-8 space-y-6 transition-all duration-300 hover:border-dashed hover:border-purple-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Starter</h3>
                </div>

                <div>
                  <div className="text-5xl font-bold text-white mb-2">Free</div>
                  <p className="text-zinc-400 text-sm">Perfect for small businesses starting with AI automation.</p>
                </div>

                <Button variant="outline" className="w-full rounded-full border-zinc-700 text-white hover:bg-zinc-800">
                  Choose this plan
                </Button>

                <div className="space-y-4 pt-4">
                  <p className="text-white font-semibold text-sm">What's Included:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Basic workflow automation</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>AI-powered personal assistant</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Standard analytics & reporting</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Email & chat support</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Up to 3 AI tool integrations</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Professional Plan - Popular */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-b from-purple-900/50 to-purple-950/30 border-2 border-purple-700/50 rounded-3xl p-8 space-y-6 relative transition-all duration-300 hover:border-purple-500"
              >
                <div className="absolute top-4 right-4">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Professional</h3>
                </div>

                <div>
                  <div className="text-5xl font-bold text-white mb-2">$37<span className="text-2xl text-zinc-400">/month</span></div>
                  <p className="text-purple-200 text-sm">Perfect for small businesses starting with AI automation.</p>
                </div>

                <Button className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white">
                  Choose this plan
                </Button>

                <div className="space-y-4 pt-4">
                  <p className="text-white font-semibold text-sm">What's Included:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-purple-100 text-sm">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Advanced workflow automation</span>
                    </li>
                    <li className="flex items-start gap-3 text-purple-100 text-sm">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Advanced weather predictions</span>
                    </li>
                    <li className="flex items-start gap-3 text-purple-100 text-sm">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Enhanced data analytics & insights</span>
                    </li>
                    <li className="flex items-start gap-3 text-purple-100 text-sm">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-start gap-3 text-purple-100 text-sm">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Up to 10 AI tool integrations</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border-2 border-zinc-800 rounded-3xl p-8 space-y-6 transition-all duration-300 hover:border-dashed hover:border-purple-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Enterprise</h3>
                </div>

                <div>
                  <div className="text-5xl font-bold text-white mb-2">$75<span className="text-2xl text-zinc-400">/month</span></div>
                  <p className="text-zinc-400 text-sm">Perfect for small businesses starting with AI automation.</p>
                </div>

                <Button variant="outline" className="w-full rounded-full border-zinc-700 text-white hover:bg-zinc-800">
                  Schedule a call
                </Button>

                <div className="space-y-4 pt-4">
                  <p className="text-white font-semibold text-sm">What's Included:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Fully customizable AI automation</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Dedicated AI business consultant</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Enterprise-grade compliance</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>24/7 VIP support</span>
                    </li>
                    <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Unlimited AI tool integrations</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Integrations Section */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center space-y-4">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.5-1.5 3.5 0 5s3.5 1.5 5 0l3.5-3.5c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0l-.5.5" />
                  <path d="M19.5 7.5c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0L11 6c-1.5 1.5-1.5 3.5 0 5s3.5 1.5 5 0l.5-.5" />
                </svg>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">INTEGRATIONS</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white whitespace-nowrap">
                The infrastructure{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  behind your deployments
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-zinc-400 max-w-2xl text-balance">
                W3Deploy is powered by leading protocols for storage, naming, automation, and governance — working together to keep your apps live and unstoppable.
              </p>
            </div>

            <div className="border-t border-border pt-12">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
                  Powered by
                </h3>
                <p className="text-sm text-muted-foreground">
                  These protocols and services power AlgoFlow, creating a fully decentralized deployment stack.
                </p>
              </div>

              {/* Integration Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pinata */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Pinata</h4>
                    <p className="text-sm text-muted-foreground">IPFS Pinning</p>
                  </div>
                </motion.div>

                {/* web3.storage */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">web3.storage</h4>
                    <p className="text-sm text-muted-foreground">Decentralized Storage</p>
                  </div>
                </motion.div>

                {/* Filebase */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Filebase</h4>
                    <p className="text-sm text-muted-foreground">S3-Compatible Storage</p>
                  </div>
                </motion.div>

                {/* Gnosis Safe */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Gnosis Safe</h4>
                    <p className="text-sm text-muted-foreground">Multi-sig Governance</p>
                  </div>
                </motion.div>

                {/* ENS */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">ENS</h4>
                    <p className="text-sm text-muted-foreground">Naming Protocol</p>
                  </div>
                </motion.div>

                {/* GitHub Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-6 flex items-start gap-4 hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-800 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">GitHub Actions</h4>
                    <p className="text-sm text-muted-foreground">CI/CD Automation</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center space-y-4">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">TESTIMONIALS</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white whitespace-nowrap">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                  developers & Teams
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-zinc-400 max-w-2xl text-balance">
                Real feedback from developers and teams deploying faster, staying live, and owning their infrastructure with W3Deploy.
              </p>
            </div>

            {/* Animated Testimonials Carousel */}
            <div className="relative overflow-hidden w-full py-4">
              {/* Gradients for fade effect on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
              
              <div
                className="flex animate-marquee"
                style={{
                  width: "max-content",
                }}
              >
                {/* First set of testimonials */}
                <TestimonialCard 
                  testimonial={{
                    name: "Sarah Chen",
                    role: "Frontend Developer",
                    avatar: "S",
                    gradient: "from-blue-500 to-purple-600",
                    feedback: "AlgoFlow made deploying to IPFS incredibly simple. What used to take hours of configuration now happens with a single push to GitHub. The ENS integration is seamless.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Marcus Rodriguez",
                    role: "Full Stack Developer", 
                    avatar: "M",
                    gradient: "from-green-500 to-teal-600",
                    feedback: "The MCP integration is a game-changer. I can deploy directly from my IDE with AI assistance. The automatic pinning and fallback systems give me confidence in production.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Alex Thompson",
                    role: "DevOps Engineer",
                    avatar: "A", 
                    gradient: "from-pink-500 to-red-600",
                    feedback: "Finally, a deployment platform that truly understands decentralization. The GitHub Actions integration works flawlessly, and the deployment history is incredibly detailed.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Lisa Park",
                    role: "Web3 Developer",
                    avatar: "L",
                    gradient: "from-orange-500 to-yellow-600", 
                    feedback: "The ENS dashboard makes managing custom domains effortless. IPNS updates happen automatically, and the whole process is transparent and reliable.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "David Kim",
                    role: "Startup Founder",
                    avatar: "D",
                    gradient: "from-indigo-500 to-blue-600",
                    feedback: "AlgoFlow eliminated our hosting costs and censorship concerns. Our dApp is truly unstoppable now, and the deployment process is faster than traditional hosting.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Rachel Green", 
                    role: "Product Manager",
                    avatar: "R",
                    gradient: "from-purple-500 to-pink-600",
                    feedback: "The team loves how simple it is to deploy. No more complex server configurations or vendor lock-in. AlgoFlow just works, and our sites are always available.",
                    rating: 5
                  }}
                />

                {/* Second set of testimonials (duplicate for seamless loop) */}
                <TestimonialCard 
                  testimonial={{
                    name: "Sarah Chen",
                    role: "Frontend Developer",
                    avatar: "S",
                    gradient: "from-blue-500 to-purple-600",
                    feedback: "AlgoFlow made deploying to IPFS incredibly simple. What used to take hours of configuration now happens with a single push to GitHub. The ENS integration is seamless.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Marcus Rodriguez",
                    role: "Full Stack Developer", 
                    avatar: "M",
                    gradient: "from-green-500 to-teal-600",
                    feedback: "The MCP integration is a game-changer. I can deploy directly from my IDE with AI assistance. The automatic pinning and fallback systems give me confidence in production.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Alex Thompson",
                    role: "DevOps Engineer",
                    avatar: "A", 
                    gradient: "from-pink-500 to-red-600",
                    feedback: "Finally, a deployment platform that truly understands decentralization. The GitHub Actions integration works flawlessly, and the deployment history is incredibly detailed.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Lisa Park",
                    role: "Web3 Developer",
                    avatar: "L",
                    gradient: "from-orange-500 to-yellow-600", 
                    feedback: "The ENS dashboard makes managing custom domains effortless. IPNS updates happen automatically, and the whole process is transparent and reliable.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "David Kim",
                    role: "Startup Founder",
                    avatar: "D",
                    gradient: "from-indigo-500 to-blue-600",
                    feedback: "AlgoFlow eliminated our hosting costs and censorship concerns. Our dApp is truly unstoppable now, and the deployment process is faster than traditional hosting.",
                    rating: 5
                  }}
                />
                <TestimonialCard 
                  testimonial={{
                    name: "Rachel Green", 
                    role: "Product Manager",
                    avatar: "R",
                    gradient: "from-purple-500 to-pink-600",
                    feedback: "The team loves how simple it is to deploy. No more complex server configurations or vendor lock-in. AlgoFlow just works, and our sites are always available.",
                    rating: 5
                  }}
                />
              </div>
            </div>
          </div>

          {/* CSS Animation Styles */}
          <style jsx global>{`
            @keyframes marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-marquee {
              animation: marquee 30s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
        </section>

        {/* Glossy Purple CTA Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-12 md:p-20 text-center shadow-2xl"
            >
              {/* Glossy overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

              {/* Glow effects */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>

              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                  Let See AlgoFlow in Action
                </h2>
                <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                  Book a Call Today and Start Automating
                </p>
                <div className="pt-4">
                  <Button
                    size="lg"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    Book a free call
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="bg-zinc-950 text-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Brand Column */}
              <div className="space-y-4">
                <Logo className="h-6 w-auto" />
                <p className="text-zinc-400 text-sm leading-relaxed">
                  AlgoFlow — Automate Smarter, Optimize Faster, and Grow Stronger.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300 font-semibold">Join our newsletter</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>

              {/* Links Column */}
              <div>
                <h3 className="text-white font-semibold mb-4">Links</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Services</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Process</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Case studies</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Benefits</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                </ul>
              </div>

              {/* Pages Column */}
              <div>
                <h3 className="text-white font-semibold mb-4">Pages</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Home</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">About</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Blog</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Contact</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">404</a></li>
                </ul>
              </div>

              {/* Socials Column */}
              <div>
                <h3 className="text-white font-semibold mb-4">Socials</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Linkedin</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Github</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">Twitter</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-zinc-500 text-sm">
                © 2024 AlgoFlow. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

// TestimonialCard Component
function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <div className="px-4 flex-shrink-0" style={{ width: "450px" }}>
      <div className="relative group transition-all duration-500 h-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 hover:border-purple-500/30 rounded-3xl overflow-hidden backdrop-blur-sm p-8 space-y-6" style={{ minHeight: "280px" }}>
        <div className="absolute top-0 right-0 p-6 text-zinc-700 group-hover:text-purple-500/20 transition-colors">
          <svg className="w-12 h-12 rotate-180" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
          </svg>
        </div>

        <div className="flex items-center space-x-4 relative z-10">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg`}>
            {testimonial.avatar}
          </div>
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">{testimonial.name}</h4>
            <p className="text-xs font-medium uppercase tracking-widest text-purple-400/70">{testimonial.role}</p>
          </div>
        </div>

        <p className="text-zinc-300 text-base leading-relaxed text-pretty flex-grow group-hover:text-zinc-200 transition-colors italic relative z-10">
          &quot;{testimonial.feedback}&quot;
        </p>

        <div className="flex justify-between items-center mt-auto pt-6 border-t border-zinc-800 relative z-10">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-4 w-4 ${star <= (testimonial.rating || 5) ? "fill-yellow-400 text-yellow-400" : "fill-none text-zinc-600"}`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-zinc-800/50 text-zinc-400 border border-zinc-700 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-all">
            Developer
          </span>
        </div>
      </div>
    </div>
  );
}

export default ModernDarkHeroSection;