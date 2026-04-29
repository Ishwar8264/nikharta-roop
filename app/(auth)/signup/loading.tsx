import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 px-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-rose-500" />
        <p className="text-lg font-medium text-stone-700">OTP भेज रहे हैं...</p>
      </div>
    </div>
  );
}
