"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BaseProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "md" | "lg";
  className?: string;
  icon?: ReactNode;
}

interface ButtonAsLink extends BaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface ButtonAsButton extends BaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variants = {
  primary:
    "bg-royal-700 text-white hover:bg-royal-800 shadow-sm hover:shadow-md",
  secondary:
    "bg-white text-royal-800 border border-royal-200 hover:border-royal-400 hover:bg-royal-50",
  ghost: "bg-transparent text-royal-800 hover:bg-royal-50",
  gold: "bg-gold-400 text-ink hover:bg-gold-300 shadow-sm hover:shadow-md",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/** Shared CTA button. Renders a Next Link when `href` is passed, else a <button>. */
export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    className,
    icon,
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-200 cursor-pointer",
    variants[variant],
    sizes[size],
    className,
  );

  const content = (
    <motion.span
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2"
    >
      {children}
      {icon}
    </motion.span>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { onClick, type = "button" } = props as ButtonAsButton;

  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
