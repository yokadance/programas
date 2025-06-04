import React from "react";

type LoaderProps = {
  src: string;
  alt?: string;
  size?: number;
};

const Loader: React.FC<LoaderProps> = ({
  src,
  alt = "Cargando...",
  size = 128,
}) => {
  return (
    <div
      className="fixed inset-0 flex justify-center items-center"
      style={{ perspective: "600px" }}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="animate-flip"
        style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
      />
      <style jsx>{`
        @keyframes flip {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        .animate-flip {
          animation: flip 1.5s linear infinite;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default Loader;
