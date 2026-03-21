
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants, TargetAndTransition } from "framer-motion";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import LightRays from "../components/LightRays";

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
        transition: { type: "spring", stiffness: 300, damping: 20 },
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
        transition: { type: "spring", stiffness: 300, damping: 20 },
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
        transition: { type: "spring", stiffness: 400, damping: 10 },
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
        transition: { type: "spring", stiffness: 200, damping: 15 },
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
        transition: { type: "spring", stiffness: 300, damping: 8 },
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
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto">
        <path d="M3 0H5V18H3V0ZM13 0H15V18H13V0ZM18 3V5H0V3H18ZM0 15V13H18V15H0Z" fill="url(#logo-gradient)" />
        <defs>
          <linearGradient id="logo-gradient" x1="10" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9B99FE" />
            <stop offset="1" stopColor="#2BC8B7" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-semibold text-xl text-foreground tracking-tight">w3deploy</span>
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
        type: "spring",
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
                      type: "spring",
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
                    W3Deploy uses AI to convert, optimize, and deploy your apps to IPFS with verifiable on-chain ownership.
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
                    W3Deploy
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

        {/* How It Works Section */}
        <section className="bg-black py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            <div className="mb-16 space-y-6">
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                How It Works
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-3xl">
                The stack stays simple even when the infrastructure does not.
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl">
                W3Deploy keeps deployment readable: redundant pinning, a censorship-resistant routing layer, and one place to manage updates.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Reliability Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <p className="text-xs text-zinc-400 uppercase tracking-wider">
                  Reliability
                </p>
                <div className="text-6xl md:text-7xl font-bold text-pink-600 dark:text-pink-500">
                  3
                </div>
                <p className="text-xl font-semibold text-white">
                  pinning providers
                </p>
              </motion.div>

              {/* Availability Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <p className="text-xs text-zinc-400 uppercase tracking-wider">
                  Availability
                </p>
                <div className="text-6xl md:text-7xl font-bold text-pink-600 dark:text-pink-500">
                  100%
                </div>
                <p className="text-xl font-semibold text-white">
                  censorship-resistant
                </p>
              </motion.div>

              {/* Control Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <p className="text-xs text-zinc-400 uppercase tracking-wider">
                  Control
                </p>
                <div className="text-6xl md:text-7xl font-bold text-pink-600 dark:text-pink-500">
                  1
                </div>
                <p className="text-xl font-semibold text-white">
                  dashboard to manage
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Process Section */}
        <section className="bg-black py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <p className="text-sm text-zinc-400 uppercase tracking-wider mb-4">
                How It Works
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl mx-auto">
                Simple steps to deploy unstoppable sites
              </h2>
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
                  Weather Data Intelligence
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  We use the OpenWeather API to fetch accurate, real-time weather data—forecasts, air quality, and alerts—personalized to the user's location.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="w-32 h-32 mx-auto mb-4 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-900/20 blur-xl"></div>
                      <div className="relative w-full h-full rounded-full border border-purple-500/30 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-t-4 border-purple-500 animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-zinc-400">Analyzing current workflow...</p>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>System check</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Process check</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Speed check</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Manual work</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300 text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Repetative task</span>
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
                  AI-Powered Response Generation
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  We use Google Gemini 2.0 Flash to understand user input and generate intelligent, context-aware responses—allowing natural interaction with the weather agent.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-4 text-zinc-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">AutomationTrigger</span>
                    </div>
                    <div className="space-y-2 text-zinc-400">
                      <div><span className="text-purple-400">class</span> <span className="text-blue-400">AutomationTrigger</span>:</div>
                      <div className="pl-4"><span className="text-purple-400">def</span> <span className="text-yellow-400">__init__</span>(self, threshold):</div>
                      <div className="pl-8">self.threshold = threshold</div>
                      <div className="pl-8">self.status = <span className="text-green-400">"inactive"</span></div>
                      <div className="pl-4 mt-3"><span className="text-purple-400">def</span> <span className="text-yellow-400">check_trigger</span>(self, value):</div>
                      <div className="pl-8"><span className="text-purple-400">if</span> val &gt;= self.threshold:</div>
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
                  Seamless Integration
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  We integrate your weather assistant with Gmail and Slack, enabling automatic delivery of weather updates via email and instant messaging.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center gap-12">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-xl">
                      <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-400">Our solution</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-0.5 bg-zinc-700"></div>
                    <div className="w-24 h-0.5 bg-zinc-700"></div>
                    <div className="w-24 h-0.5 bg-zinc-700"></div>
                  </div>

                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-xl">
                      <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-400">Your stack</p>
                  </div>
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
                  Continuous Adaptation
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  We optimize the assistant through regular data syncing, behavior tuning, and interaction analysis to keep your alerts timely, relevant, and user-friendly.
                </p>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <div>
                        <p className="text-white text-sm font-semibold">Chatbot system</p>
                        <p className="text-zinc-500 text-xs">Efficiency will increase by 20%</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-white text-sm font-semibold">Workflow system</p>
                        <p className="text-zinc-500 text-xs">Update available.</p>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="text-white text-sm font-semibold">Sales system</p>
                        <p className="text-zinc-500 text-xs">Up to date</p>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Deployment Paths Section */}
        <section className="bg-background py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            <div className="mb-16 space-y-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Deployment Paths
              </p>
              <div className="grid lg:grid-cols-2 gap-8 items-end">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                  Deploy your own way
                </h2>
                <p className="text-lg text-muted-foreground">
                  Start from GitHub, automate through Actions, or manage custom ENS routing directly. The tooling changes, the ownership model does not.
                </p>
              </div>
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
                  Connect your repo and deploy on every push. Each project gets a stable random subdomain under pushx.eth.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  Best for zero-config starts
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
                  Automate deploys on every push to main with Pinata-first uploads and backup pinning when needed.
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                  Best for CI-driven teams
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
                  Use custom ENS with a one-time setup, then let every deploy move IPNS and IPFS records automatically.
                </p>
                <p className="text-sm text-pink-600 dark:text-pink-400 font-semibold">
                  Best for custom domains
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-black py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Pricing Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
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
                className="bg-gradient-to-b from-purple-900/50 to-purple-950/30 border border-purple-700/50 rounded-3xl p-8 space-y-6 relative"
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
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6"
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
        <section className="bg-background py-24 md:py-32 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            <div className="mb-16 space-y-6">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground max-w-4xl">
                Your gateway to the decentralized web
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Envision a web where sites are unstoppable, identities are on-chain, and no company holds the keys.
              </p>
            </div>

            <div className="border-t border-border pt-12">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
                  Key Integrations
                </h3>
                <p className="text-sm text-muted-foreground">
                  These protocols and services power W3Deploy, creating a fully decentralized deployment stack.
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

        {/* Glossy Purple CTA Section */}
        <section className="bg-black py-24 md:py-32">
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
                  Let See W3Deploy in Action
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
                  W3Deploy — Automate Smarter, Optimize Faster, and Grow Stronger.
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
                © 2024 W3Deploy. All rights reserved.
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

export default ModernDarkHeroSection;