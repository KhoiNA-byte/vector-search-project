import { motion } from "framer-motion";
import { useEffect } from "react";

// Definitions of transitions with a slower, more relaxed tempo (0.6s to 0.9s)
const variantsMap = {
  // 1. Classic Relaxed Fade + Slide Up
  "fade-slide": {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] }
    }
  },

  // 2. Elegant Scale-Up / Zoom
  "scale-up": {
    initial: { opacity: 0, scale: 0.96 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] }
    }
  },

  // 3. Luxurious Glass Reveal (Blur fade)
  "glass-reveal": {
    initial: { opacity: 0, filter: "blur(12px)", scale: 1.02 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
      opacity: 0,
      filter: "blur(8px)",
      scale: 0.98,
      transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] }
    }
  },

  // 4. Slide from Right
  "slide-right": {
    initial: { opacity: 0, x: 50 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    }
  },

  // 5. Slide from Left
  "slide-left": {
    initial: { opacity: 0, x: -50 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
    },
    exit: {
      opacity: 0,
      x: 50,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    }
  },

  // 6. Premium Circular Clip-Path Reveal (Center-out expansion)
  "reveal": {
    initial: {
      clipPath: "circle(0% at 50% 50%)",
      opacity: 0.9,
      scale: 0.98
    },
    animate: {
      clipPath: "circle(150% at 50% 50%)",
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.9, 
        ease: [0.25, 1, 0.3, 1] // Super relaxed, custom cubic-bezier
      }
    },
    exit: {
      clipPath: "circle(0% at 50% 50%)",
      opacity: 0.9,
      scale: 0.98,
      transition: { 
        duration: 0.7, 
        ease: [0.76, 0, 0.24, 1] 
      }
    }
  }
};

const PageTransition = ({ children, variant = "fade-slide" }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const currentVariant = variantsMap[variant] || variantsMap["fade-slide"];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={currentVariant}
      style={{ width: "100%", minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
