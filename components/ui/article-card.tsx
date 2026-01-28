'use client'; 

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Props interface
export interface ArticleCardProps extends HTMLMotionProps<'div'> {
  imageUrl: string;
  imageAlt: string;
  title: string;
  description: string;
  authorName?: string;
  authorImageUrl?: string;
  date?: string;
  onShareClick?: () => void;
  fullWidth?: boolean; 
  showAuthor?: boolean;
}

/**
 * An animated, responsive card component for displaying articles.
 * Uses framer-motion for hover and entry animations.
 */
const ArticleCard = React.forwardRef<HTMLDivElement, ArticleCardProps>(
  (
    {
      className,
      imageUrl,
      imageAlt,
      title,
      description,
      authorName,
      authorImageUrl,
      date,
      onShareClick,
      fullWidth = false,
      showAuthor = true,
      ...props
    },
    ref
  ) => {
    // Animation variants for the card container
    const cardVariants = {
      initial: { opacity: 0, y: 20 },
      whileInView: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeInOut' as const },
      },
      whileHover: {
        scale: 1.01, // Subtle scale
        boxShadow: '0px 20px 40px rgba(0,0,0,0.3)', 
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="initial"
        whileInView="whileInView"
        whileHover="whileHover"
        viewport={{ once: true, amount: 0.1 }}
        className={cn(
          'group flex max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/10 transition-all duration-500 md:flex-row h-full',
          fullWidth && 'max-w-none md:flex-col lg:flex-row', 
          className
        )}
        {...props}
      >
        {/* Image Section */}
        <div className={cn("md:w-2/5 relative overflow-hidden", fullWidth && "md:w-full lg:w-2/5 min-h-[350px]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-center p-8 md:w-3/5 bg-[#0f0f0f] text-white">
          <div className="flex-1 flex flex-col justify-center">
            {/* Title */}
            <h2 className={cn(
               "mb-6 font-black leading-[1.1] tracking-tighter text-white group-hover:text-primary transition-colors",
               fullWidth ? "text-3xl md:text-5xl" : "text-2xl"
            )}>
              {title}
            </h2>
            {/* Description */}
            <div className={cn(
               "text-white/60 leading-relaxed whitespace-pre-line font-medium",
               fullWidth ? "text-lg md:text-xl line-clamp-8" : "text-sm line-clamp-4"
            )}>
              {description}
            </div>
          </div>

          {/* Footer Section with Author and Share Icon */}
          {showAuthor && authorName && (
             <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
               <div className="flex items-center space-x-4">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img
                   src={authorImageUrl}
                   alt={authorName}
                   className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                 />
                 <div>
                   <p className="text-sm font-black text-white uppercase tracking-wider">
                     {authorName}
                   </p>
                   <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mt-0.5">{date}</p>
                 </div>
               </div>

               {/* Share Button */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onShareClick?.();
                 }}
                 aria-label="Share article"
                 className="rounded-full p-2.5 bg-white/5 text-white/40 transition-all hover:bg-primary hover:text-black active:scale-95"
               >
                 <Share2 className="h-4 w-4" />
               </button>
             </div>
          )}
        </div>
      </motion.div>
    );
  }
);
ArticleCard.displayName = 'ArticleCard';

export { ArticleCard };
