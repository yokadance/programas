import React from "react";

type LoaderProps = {
  src?: string;
  alt?: string;
  size?: number;
  fallbackSrc?: string;
  text?: string;
};

const Loader: React.FC<LoaderProps> = ({ text = "Cargando..." }) => {
  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center gap-3 bg-white">
      <LoadingDots />
      <p className="text-sm text-gray-500 font-medium">{text}</p>
    </div>
  );
};

const LoadingDots: React.FC = () => (
  <div className="flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

export default Loader;
