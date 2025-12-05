'use client'

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        document.cookie = "token=; path=/; max-age=0";
        router.push('/auth');
        toast.success("Logout successful", {
          description: "You have been logged out.",
        });
    };

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetch('api/auth/me', { method: 'GET' });
                setUser(data.user);
            } catch (err) {
                console.log(err);
                router.push('/auth');
            }
        }
        load();

    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen flex item-center justify-center text-slate-300">
                Loading Dashboard...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col item-center justify-center text-slate-100 p-6">
            <div className="flex items-center justify-between w-full">
                <h1 className="text-3xl font-semibold">Dashboard</h1>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 text-sm rounded-md hover:bg-red-500 w-20"
                >
                    Logout
                </button>
            </div>
            <p className="text-slate-400 mt-2">Welcome back, {user?.firstName}{user?.lastName}!</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800 rounded-lg text-slate-50">
                    <p className="text-xs text-slate-400">Logged in as</p>
                    <p className="text-lg font-semibold">{user?.firstName} {user?.lastName}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg text-slate-50">
                    <p className="text-xs text-slate-400">Role</p>
                    <p className="text-lg font-semibold">{user.role}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg text-slate-50">
                    <p className="text-xs text-slate-400">Last Login</p>
                    <p className="text-lg font-semibold">{new Date(user.lastLogin).toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
}