import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, LogOut } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadMessages } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    console.log("Fetching users...");
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) return <SidebarSkeleton />;

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id) && user._id !== authUser?._id)
    : users.filter((user) => user._id !== authUser?._id);

  console.log("Total users:", users.length);
  console.log("Filtered users:", filteredUsers.length);
  console.log("Online users:", onlineUsers);

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 bg-gradient-to-r from-teal-500 to-pink-500 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">People</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-white-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              console.log("Selecting user ID:", user._id);
              setSelectedUser(user);
            }}
            className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
              selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
            }`}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>
            <div className="hidden lg:flex flex-1 items-center gap-2 text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              {unreadMessages[user._id] > 0 && (
                <span className="badge badge-primary badge-sm">{unreadMessages[user._id]}</span>
              )}
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No one is online</div>
        )}
      </div>

      <div className="border-t border-base-300 bg-gradient-to-r from-teal-500 to-pink-500 w-full p-2">
        <Link to="/profile" className="w-full flex items-center gap-3 px-3 py-2">
          <div className="relative">
            <img
              src={authUser?.profilePic || "/avatar.png"}
              alt={authUser?.fullName}
              className="size-12 object-cover rounded-full"
            />
            {onlineUsers.includes(authUser?._id) && (
              <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
            )}
          </div>
          <div className="hidden lg:flex flex-1 items-center gap-2 text-left min-w-0">
            <span className="font-medium truncate">{authUser?.fullName} (you)</span>
          </div>
        </Link>
        <button
          className="btn btn-sm btn-outline mt-2 w-full flex items-center gap-2"
          onClick={logout}
        >
          <LogOut className="size-5" />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;