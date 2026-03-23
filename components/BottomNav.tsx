import React from "react";
import { useRouter } from "next/router";
import { CalendarDays, Users, Printer } from "lucide-react";

type BottomNavProps = {
  agendaHref: string;
  speakersHref: string;
  primaryBg: string;
  primaryText: string;
  onPrint?: () => void;
};

const BottomNav: React.FC<BottomNavProps> = ({
  agendaHref,
  speakersHref,
  primaryBg,
  primaryText,
  onPrint,
}) => {
  const router = useRouter();

  const navItems = [
    { label: "Agenda",   href: agendaHref,   icon: <CalendarDays className="w-5 h-5" /> },
    { label: "Speakers", href: speakersHref,  icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <nav className="flex-shrink-0 flex border-t border-gray-200 bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const isActive = router.pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isActive ? primaryText : "text-gray-400 hover:text-gray-600"
            }`}>
            <span className={isActive ? primaryText : ""}>{item.icon}</span>
            <span className={`text-[11px] font-semibold tracking-wide ${isActive ? primaryText : "text-gray-400"}`}>
              {item.label}
            </span>
            {isActive && <span className={`w-4 h-0.5 rounded-full ${primaryBg} mt-0.5`} />}
          </button>
        );
      })}

      {onPrint && (
        <button
          onClick={onPrint}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-gray-600 transition-colors">
          <Printer className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-wide text-gray-400">PDF</span>
        </button>
      )}
    </nav>
  );
};

export default BottomNav;
