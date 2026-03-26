import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const color =
    score >= 80
      ? "text-green-600 border-green-200 bg-green-50"
      : score >= 50
      ? "text-yellow-600 border-yellow-200 bg-yellow-50"
      : "text-red-600 border-red-200 bg-red-50";

  const ringColor =
    score >= 80
      ? "stroke-green-500"
      : score >= 50
      ? "stroke-yellow-500"
      : "stroke-red-500";

  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-20 h-20 text-xl",
    lg: "w-32 h-32 text-4xl",
  };

  const strokeWidth = size === "lg" ? 4 : size === "md" ? 5 : 6;
  const radius = size === "lg" ? 58 : size === "md" ? 34 : 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}>
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={cn(ringColor, "transition-all duration-1000 ease-out")}
        />
      </svg>
      <span className={cn("font-bold z-10", color)}>{score}</span>
    </div>
  );
}
