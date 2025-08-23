"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/app/AuthContext";
import { useRouter } from "next/navigation";
const Header = () => {
  const { isLoggedIn, loading, username, setIsLoggedIn, setUsername, idCesta } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    router.push("/login");
  };
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <div className="flex items-center">
        <Link href="/">
          <span className="text-xl font-bold">Logo</span>
        </Link>
      </div>
      <nav>
        <div className="flex items-center space-x-4">
        <Button asChild variant="ghost" className="ml-4">
            <Link href={`/cesta/${idCesta}`}>Cesta</Link>
          </Button>
          <Button asChild variant="ghost" className="ml-4">
            <Link href="/products">Productos</Link>
          </Button>

          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium">
                <Link href={`/dashboard/${username}`}>{username}</Link>
              </span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
