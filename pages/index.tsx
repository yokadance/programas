"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "https://programas-congresos.fly.dev/congress/neuropediatria2025";
  }, []);

  return <p>Cargando...</p>;
}
