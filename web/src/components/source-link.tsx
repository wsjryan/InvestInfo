"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SourceLinkProps {
  name: string;
  url?: string;
}

export function SourceLink({ name, url }: SourceLinkProps) {
  if (!url) {
    return (
      <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto shrink-0">
        {name}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline ml-auto shrink-0 cursor-pointer"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        {name}
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="text-xs">Click to open source</span>
      </TooltipContent>
    </Tooltip>
  );
}
