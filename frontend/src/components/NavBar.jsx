import { Link, useLocation } from "react-router-dom";
import { Apple, Image as ImageIcon } from "lucide-react";

const NavBar = () => {
  const location = useLocation();

  const isFruitPage = location.pathname === "/fruit" || location.pathname === "/";
  const isVisualPage = location.pathname === "/visual-entity";

  const navItems = [
    { name: "Fruits", path: "/fruit", icon: Apple },
    { name: "Visual Feed", path: "/visual-entity", icon: ImageIcon },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b backdrop-blur-xl ${
      isFruitPage 
        ? "bg-[#e1e8ce]/90 border-black/5" 
        : "bg-[#050505]/60 border-white/5"
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
             <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${
               isFruitPage 
                 ? "bg-primary shadow-primary/20" 
                 : "bg-linear-to-br from-cyan-400 to-purple-600 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
             }`}>
                <span className="text-white font-bold text-xl italic drop-shadow-md">V</span>
             </div>
             <span className={`font-display font-black text-2xl tracking-tighter transition-colors duration-500 ${
               isFruitPage ? "text-foreground" : "text-white"
             }`}>
                VECTOR<span className={isFruitPage ? "text-primary" : "text-cyan-400"}>SEARCH</span>
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
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-500 ${
                    isActive
                      ? isFruitPage
                        ? "bg-primary text-white shadow-md"
                        : "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                      : isFruitPage
                        ? "text-muted-foreground hover:text-primary hover:bg-black/5"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline uppercase">{item.name}</span>
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
