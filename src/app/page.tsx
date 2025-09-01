'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Code, ArrowRight } from 'lucide-react';
import { StreamNextConverter } from '@/components/StreamNextConverter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const { user } = await res.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleSignIn = async () => {
    try {
        const res = await fetch('/api/auth/github/url');
        const { url } = await res.json();
        window.location.href = url;
    } catch (error) {
        console.error('Error getting GitHub auth URL:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-background text-foreground">
        <header className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="container mx-auto flex justify-between items-center">
             <h1 className="text-2xl font-bold text-primary font-headline">StreamNext</h1>
             <Button onClick={handleSignIn} className="bg-primary hover:bg-primary/90">
                <Github className="mr-2 h-4 w-4" />
                Sign In
             </Button>
          </div>
        </header>
        <main className="flex min-h-screen flex-col items-center justify-center p-8 pt-20 text-center overflow-hidden">
            <div className="relative mb-6">
                <div className="absolute -top-10 -left-24 text-primary/10 -z-0">
                    <Code size={150} strokeWidth={0.5} />
                </div>
                <div className="absolute -bottom-16 -right-24 text-accent/30 -z-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2Z"/></svg>
                </div>
                <h2 className="text-5xl md:text-6xl font-extrabold font-headline text-foreground tracking-tight">
                    From <span className="text-primary">Streamlit</span> to <span className="text-primary">Next.js</span>
                </h2>
                <h3 className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                    Automatically convert your Python Streamlit apps into modern, production-ready Next.js projects.
                </h3>
            </div>
          
            <Button size="lg" onClick={handleSignIn} className="mt-8 bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                
                    <Github className="mr-3 h-6 w-6" />
                    Connect with GitHub & Start Converting
                    <ArrowRight className="ml-3 h-5 w-5" />
                
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">100% free. Powered by generative AI.</p>
        </main>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <header className="absolute top-0 left-0 right-0 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary font-headline">StreamNext</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL!} alt={user.displayName!} data-ai-hint="male avatar" />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex-grow flex items-center justify-center w-full pt-16 sm:pt-0">
         <StreamNextConverter />
      </div>
    </main>
  );
}
