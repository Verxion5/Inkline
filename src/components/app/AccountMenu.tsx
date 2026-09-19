import { Link, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const email = user?.email ?? "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "IN";

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Account"
          className="grid h-9 w-9 place-items-center rounded-full violet-gradient text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email || "Not signed in"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Icons.Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/export">
            <Icons.Share2 className="mr-2 h-4 w-4" /> Export & Publish
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <Icons.LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
