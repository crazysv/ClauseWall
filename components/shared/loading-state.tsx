import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading...",
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6 md:py-8 lg:py-12">
      <div className="relative">
        <Loader2
          className={`${sizeClasses[size]} text-indigo-600 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} bg-indigo-500/20 blur-xl rounded-full animate-pulse`}
        />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}