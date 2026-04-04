import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingState({
  message = "Loading...",
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} bg-primary/20 blur-xl rounded-full animate-pulse`}
        />
      </div>
      <p className="text-lg font-bold text-foreground">{message}</p>
    </div>
  );
}
