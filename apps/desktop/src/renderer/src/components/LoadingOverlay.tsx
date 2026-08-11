import { Loader2 } from 'lucide-react';

type LoadingOverlayProps = {
  message: string;
};

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-lg">
        <Loader2 className="animate-spin text-amber-700" size={28} />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
