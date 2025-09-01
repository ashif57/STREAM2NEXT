"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Search,
  Zap,
  UploadCloud,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Github,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';

type Status = 'idle' | 'analyzing' | 'converting' | 'pushing' | 'completed' | 'error';
type Repo = { id: string; name: string };

const steps: { [key in Exclude<Status, 'idle' | 'error'>]: { text: string; icon: React.ElementType } } = {
  analyzing: { text: 'Analyzing repository', icon: Search },
  converting: { text: 'Converting files with AI', icon: Zap },
  pushing: { text: 'Pushing to new branch', icon: UploadCloud },
  completed: { text: 'Completed', icon: CheckCircle2 },
};

export function StreamNextConverter() {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [sourceFramework, setSourceFramework] = useState<'streamlit'>('streamlit'); // Default to Streamlit
  const [targetFramework, setTargetFramework] = useState<'nextjs' | 'react-fastapi'>('nextjs');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [convertedBranchUrl, setConvertedBranchUrl] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRepos = async () => {
    setReposLoading(true);
    setReposError(null);
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to fetch repositories.');
      }
      const data = await res.json();
      setRepos(data);
    } catch (e: any) {
      setReposError(e.message);
      toast({
        variant: 'destructive',
        title: 'Could not fetch repositories',
        description: e.message,
      });
    } finally {
      setReposLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const isConverting = useMemo(() => status !== 'idle' && status !== 'completed' && status !== 'error', [status]);

  const handleSourceFrameworkChange = (value: string) => {
    setSourceFramework(value as 'streamlit');
  };

  const handleTargetFrameworkChange = (value: string) => {
    setTargetFramework(value as 'nextjs' | 'react-fastapi');
  };

  const handleConvert = async () => {
    if (!selectedRepo) {
      toast({
        variant: 'destructive',
        title: 'No repository selected',
        description: 'Please select a repository to convert.',
      });
      return;
    }
    
    try {
      setStatus('analyzing');
      setProgress(25);
      
      // The fetch call now handles multiple stages. We can update progress based on fetch duration,
      // but for now let's just jump to converting.
      setStatus('converting'); 
      setProgress(50);

      const convertResponse = await fetch('/api/github/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoId: selectedRepo, sourceFramework, targetFramework }),
      });

      if (!convertResponse.ok) {
          const { error } = await convertResponse.json();
          throw new Error(error || 'Failed during conversion step.');
      }
      
      setStatus('pushing');
      setProgress(90);

      const result = await convertResponse.json();
      
      setStatus('completed');
      setProgress(100);
      setConvertedBranchUrl(result.branchUrl);

    } catch (e: any) {
      setStatus('error');
      setProgress(0);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: e.message || "An unexpected error occurred. Please try again.",
      });
    }
  };
  
  const handleReset = () => {
    setStatus('idle');
    setSelectedRepo('');
    setProgress(0);
    setConvertedBranchUrl('');
    fetchRepos();
  };

  const currentStepIndex = Object.keys(steps).indexOf(status);

  return (
    <Card className="w-full max-w-2xl shadow-2xl shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2">
          <Github />
          Repository Conversion
        </CardTitle>
        <CardDescription>
          Select the source and target frameworks for conversion.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[14rem] flex flex-col justify-center">
        {status === 'idle' && (
          <div className="space-y-6">
            {reposLoading ? (
              <div className="flex items-center justify-center text-muted-foreground">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Loading your repositories...
              </div>
            ) : reposError ? (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Error fetching repositories</AlertTitle>
                <AlertDescription>
                  {reposError}
                  <Button variant="secondary" size="sm" onClick={fetchRepos} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
                <div className="space-y-4">
                  <Select onValueChange={setSelectedRepo} value={selectedRepo}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a repository..." />
                      </SelectTrigger>
                      <SelectContent>
                          {repos.map(repo => (
                          <SelectItem key={repo.id} value={repo.id}>
                              {repo.name}
                          </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>

                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="from-framework">From</Label>
                      <Select onValueChange={handleSourceFrameworkChange} value={sourceFramework} disabled>
                        <SelectTrigger id="from-framework">
                          <SelectValue placeholder="Select source framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="streamlit">Streamlit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="to-framework">To</Label>
                      <Select onValueChange={handleTargetFrameworkChange} value={targetFramework}>
                        <SelectTrigger id="to-framework">
                          <SelectValue placeholder="Select target framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nextjs">Next.js</SelectItem>
                          <SelectItem value="react-fastapi">React + FastAPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90" onClick={handleConvert} disabled={!selectedRepo || !sourceFramework || !targetFramework || isConverting}>
                      <Zap className="mr-2 h-5 w-5" />
                      Convert
                  </Button>
                </div>
            )}
          </div>
        )}

        {isConverting && (
          <div className="flex flex-col gap-6">
            <Progress value={progress} className="w-full" />
            <ul className="space-y-4">
              {Object.entries(steps).map(([key, { text, icon: Icon }], index) => {
                  if (key === 'completed') return null;
                  const stepIndex = currentStepIndex;
                  const isCompleted = index < stepIndex;
                  const isActive = index === stepIndex;
                  const isPending = index > stepIndex;

                  return (
                      <li key={key} className="flex items-center gap-4 transition-opacity duration-300" style={{opacity: isPending ? 0.5 : 1}}>
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                              isCompleted && "bg-accent/80 text-accent-foreground",
                              isActive && "bg-primary text-primary-foreground",
                              isPending && "bg-muted text-muted-foreground"
                          )}>
                              {isCompleted ? <CheckCircle2 size={20} /> : isActive ? <LoaderCircle size={20} className="animate-spin" /> : <Icon size={20} />}
                          </div>
                          <span className={cn("text-lg font-medium transition-colors duration-300",
                              isActive && "text-primary",
                              isPending && "text-muted-foreground"
                          )}>
                              {text}
                          </span>
                      </li>
                  );
              })}
            </ul>
          </div>
        )}
        
        {status === 'completed' && (
           <Alert className="bg-green-50 border-green-200 text-green-900">
             <CheckCircle2 className="h-5 w-5 text-green-500" />
            <AlertTitle className="font-bold text-lg">Conversion Successful!</AlertTitle>
            <AlertDescription className="mt-2">
              Your new Next.js project is ready.
              <Button variant="outline" size="sm" asChild className="mt-4 w-full border-green-300 hover:bg-green-100">
                  <a href={convertedBranchUrl} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
           <Alert variant="destructive">
             <XCircle className="h-5 w-5" />
            <AlertTitle>Conversion Failed</AlertTitle>
            <AlertDescription>
                An unexpected error occurred. Please try converting the repository again.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
      {(status === 'completed' || status === 'error') && (
        <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={handleReset}>
                Convert Another Repository
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
