import React from "react";

/**
 * HeroLoading
 *
 * Loading hero component displayed while the main application is initializing.
 * Used in Index.tsx to show a branded loading experience before the full hero content.
 *
 * Features:
 * - Matches the visual style of the main hero section
 * - Animated placeholder elements (pulse animations)
 * - Responsive layout with mobile-first design
 * - Customizable subtitle prop for different loading contexts
 * - Mock scheduling interface preview on the right side
 *
 * Design principles:
 * - Uses skeleton loading patterns to indicate content is coming
 * - Maintains brand consistency with gradient backgrounds
 * - Provides visual feedback that the app is working
 * - Smooth transition preparation for the actual hero content
 */
const HeroLoading = ({ subtitle }: { subtitle?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent">
      <div className="max-w-5xl w-full px-6 py-16 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground mb-4">
            Availo
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto md:mx-0">
            {subtitle || 'Loading your scheduling workspace — hang tight.'}
          </p>

          <div className="mt-8 flex justify-center md:justify-start gap-4">
            <div className="h-12 w-40 rounded-lg bg-gradient-to-r from-primary to-secondary animate-pulse" />
            <div className="h-12 w-40 rounded-lg border border-input bg-white/0" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/60 shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-48 mb-2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-32 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-8 bg-muted rounded animate-pulse" />
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">Loading availability…</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroLoading;
