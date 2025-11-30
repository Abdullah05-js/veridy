import { toast as sonnerToast } from "sonner"

// Wrapper to style toasts as requested
export const toast = {
  ...sonnerToast,
  success: (message: string | React.ReactNode, options?: any) => 
    sonnerToast.success(message, {
      ...options,
      className: "bg-neutral-900 border-l-4 border-high-viz-yellow text-white rounded-none",
    }),
  error: (message: string | React.ReactNode, options?: any) => 
    sonnerToast.error(message, {
      ...options,
      className: "bg-neutral-900 border-l-4 border-red-500 text-white rounded-none",
    }),
  warning: (message: string | React.ReactNode, options?: any) => 
    sonnerToast.warning(message, {
      ...options,
      className: "bg-neutral-900 border-l-4 border-orange-500 text-white rounded-none",
    }),
  info: (message: string | React.ReactNode, options?: any) => 
    sonnerToast.info(message, {
      ...options,
      className: "bg-neutral-900 border-l-4 border-blue-500 text-white rounded-none",
    }),
}

export { Toaster } from "sonner"

