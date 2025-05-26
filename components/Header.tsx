type HeadersButtonsProps = {
  labels: string[]; // Ej: ['Día 1', 'Día 2', 'Día 3']
  onClick?: (label: string) => void;
};

export default function Header({ labels, onClick }: HeadersButtonsProps) {
  return (
    <div className="flex items-center justify-center mt-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4  w-fit mx-auto">
        {labels.map((label, index) => (
          <button
            key={index}
            onClick={() => onClick?.(label)}
            className="flex items-center min-w-[200px] px-8 py-4 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition shadow-sm">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
