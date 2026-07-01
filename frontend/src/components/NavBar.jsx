import { Link, useLocation } from "react-router-dom";
import { Apple, Image as ImageIcon, FileText } from "lucide-react";

const NavBar = () => {
  const location = useLocation();

  const isFruitPage = location.pathname.startsWith("/fruit");
  const isDocumentPage = location.pathname.startsWith("/documents");
  const isVisualPage = location.pathname.startsWith("/visuals");

  const navItems = [
    { name: "Fruits", path: "/fruit", icon: Apple },
    { name: "Visuals", path: "/visuals", icon: ImageIcon },
    { name: "Documents", path: "/documents", icon: FileText },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b"
      style={isFruitPage ? {
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottomColor: "rgba(255, 255, 255, 0.35)",
        boxShadow: "0 1px 24px -4px rgba(34, 130, 70, 0.10), 0 0 0 1px rgba(255,255,255,0.18) inset",
      } : {
        background: "rgba(5, 5, 5, 0.60)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
             <div
               className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500"
               style={isFruitPage ? {
                 background: "linear-gradient(135deg, #1a5c35, #27ae60)",
                 boxShadow: "0 0 16px rgba(39, 174, 96, 0.35)",
               } : isDocumentPage ? {
                 background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                 boxShadow: "0 0 20px rgba(99,102,241,0.35)",
               } : {
                 background: "linear-gradient(135deg, #22d3ee, #a855f7)",
                 boxShadow: "0 0 20px rgba(34,211,238,0.3)",
               }}
             >
                <span className="text-white font-bold text-xl italic drop-shadow-md">V</span>
             </div>
             <span className={`font-display font-black text-2xl tracking-tighter transition-colors duration-500 ${
               isFruitPage ? "text-[#0d3320]" : "text-white"
             }`}>
                VECTOR<span className={isFruitPage ? "text-[#27ae60]" : isDocumentPage ? "text-indigo-400" : "text-cyan-400"}>SEARCH</span>
             </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300"
                  style={
                    isActive
                      ? isFruitPage
                        ? {
                            background: "linear-gradient(135deg, #1a5c35 0%, #27ae60 60%, #52c041 100%)",
                            color: "#fff",
                            boxShadow: "0 4px 16px -2px rgba(34,140,70,0.4), 0 0 0 2px rgba(82,192,65,0.2)",
                          }
                        : isDocumentPage
                        ? {
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)",
                            color: "#fff",
                            boxShadow: "0 4px 16px -2px rgba(99,102,241,0.4), 0 0 0 2px rgba(124,58,237,0.2)",
                          }
                        : { background: "#fff", color: "#000", boxShadow: "0 0 30px rgba(255,255,255,0.1)" }
                      : isFruitPage
                        ? {}
                        : {}
                  }
                  data-inactive-fruit={!isActive && isFruitPage ? "true" : undefined}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                  <span
                    className="hidden sm:inline uppercase"
                    style={
                      !isActive && isFruitPage
                        ? { color: "#4a7a5a" }
                      : !isActive && !isFruitPage
                        ? { color: "rgba(255,255,255,0.4)" }
                        : {}
                    }
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
