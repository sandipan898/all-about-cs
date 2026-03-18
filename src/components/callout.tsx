// src/components/callout.tsx
import { ReactNode } from "react";
import { Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

const config = {
  info:    { icon: Info,          classes: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100" },
  warning: { icon: AlertTriangle, classes: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100" },
  error:   { icon: XCircle,       classes: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100" },
  success: { icon: CheckCircle,   classes: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100" },
};

interface CalloutProps {
  type?: keyof typeof config;
  children: ReactNode;
}

export function Callout({ type = "info", children }: CalloutProps) {
  const { icon: Icon, classes } = config[type];
  return (
    <div className={`not-prose my-6 flex gap-3 rounded-lg border p-4 ${classes}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm leading-relaxed [&>p]:m-0">{children}</div>
    </div>
  );
}