import { Link } from "react-router-dom";
import { MessageSquare, Settings } from "lucide-react";

const Navbar = ({ isAuthenticated }) => {
  return (
    <header className="bg-gradient-to-r from-pink-400 to-pink-600 fixed w-full top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-all">
          <div className="size-9 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageSquare className="size-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">ChatMate</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
            <Link
              to="/settings"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm sm:text-base"
            >
              <Settings className="size-4 sm:size-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
