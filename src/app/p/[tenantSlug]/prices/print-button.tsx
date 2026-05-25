'use client';

export function PrintButton() {
  return (
    <div className="text-center print:hidden">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
