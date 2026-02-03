import * as React from "react";
import { motion, type Variants, type HTMLMotionProps, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Motion Components - ReklamAI Design System
 * 
 * Subtle, professional entrance animations for cards and sections.
 * Designed to feel premium without being distracting.
 */

// Animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
};

// Stagger container for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Default transition
const defaultTransition: Transition = {
  duration: 0.4,
  ease: "easeOut",
};

// Motion Card - Animated card wrapper
interface MotionCardProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ ...defaultTransition, delay }}
      className={cn(className)}
      {...props}
    />
  )
);
MotionCard.displayName = "MotionCard";

// Motion Section - For larger content blocks
interface MotionSectionProps extends HTMLMotionProps<"section"> {
  delay?: number;
}

export const MotionSection = React.forwardRef<HTMLElement, MotionSectionProps>(
  ({ className, delay = 0, ...props }, ref) => (
    <motion.section
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...defaultTransition, delay }}
      className={cn(className)}
      {...props}
    />
  )
);
MotionSection.displayName = "MotionSection";

// Motion Div - Generic animated div
interface MotionDivProps extends HTMLMotionProps<"div"> {
  variant?: "fadeIn" | "fadeUp" | "fadeDown" | "scaleIn" | "slideInLeft" | "slideInRight";
  delay?: number;
}

const variantMap = {
  fadeIn,
  fadeUp,
  fadeDown,
  scaleIn,
  slideInLeft,
  slideInRight,
};

export const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(
  ({ className, variant = "fadeUp", delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ ...defaultTransition, delay }}
      className={cn(className)}
      {...props}
    />
  )
);
MotionDiv.displayName = "MotionDiv";

// Motion List - Staggered list container
interface MotionListProps extends HTMLMotionProps<"div"> {
  fast?: boolean;
}

export const MotionList = React.forwardRef<HTMLDivElement, MotionListProps>(
  ({ className, fast = false, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fast ? staggerContainerFast : staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={cn(className)}
      {...props}
    />
  )
);
MotionList.displayName = "MotionList";

// Motion Item - For use inside MotionList
interface MotionItemProps extends HTMLMotionProps<"div"> {
  variant?: "fadeIn" | "fadeUp" | "scaleIn";
}

export const MotionItem = React.forwardRef<HTMLDivElement, MotionItemProps>(
  ({ className, variant = "fadeUp", ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={variantMap[variant]}
      transition={defaultTransition}
      className={cn(className)}
      {...props}
    />
  )
);
MotionItem.displayName = "MotionItem";

// Motion Header - For page/section headers
export const MotionHeader = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    />
  )
);
MotionHeader.displayName = "MotionHeader";

export { motion };
