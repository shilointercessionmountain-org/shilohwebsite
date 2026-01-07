import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Church, Eye, EyeOff, Clock, LogOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = authSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AuthErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type RequestStatus = "none" | "pending" | "approved" | "rejected";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("none");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { signIn, signUp, signOut, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Check request status for logged-in non-admin users
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (user && !isAdmin) {
        setIsCheckingStatus(true);
        const { data } = await supabase
          .from("admin_requests")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setRequestStatus(data.status as RequestStatus);
        } else {
          setRequestStatus("none");
        }
        setIsCheckingStatus(false);
      }
    };
    checkRequestStatus();
  }, [user, isAdmin]);

  // Redirect if already logged in and is admin
  if (user && isAdmin) {
    navigate("/admin");
    return null;
  }

  // Show pending status page for logged-in users awaiting approval
  if (user && !isAdmin && !isCheckingStatus && requestStatus === "pending") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Awaiting Approval
          </h1>
          <p className="text-muted-foreground mb-6">
            Your admin access request is pending. An administrator will review your request shortly.
          </p>
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user.email}</p>
            </CardContent>
          </Card>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
            <Button variant="destructive" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected status page
  if (user && !isAdmin && !isCheckingStatus && requestStatus === "rejected") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <Church className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Request Declined
          </h1>
          <p className="text-muted-foreground mb-6">
            Your admin access request was not approved. Please contact the church administrator for more information.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
            <Button variant="destructive" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const clearErrors = () => setErrors({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message);
      }
    } else {
      // Store session persistence preference
      if (rememberMe) {
        localStorage.setItem("session_persistent", "true");
        sessionStorage.removeItem("session_active");
      } else {
        localStorage.removeItem("session_persistent");
        sessionStorage.setItem("session_active", "true");
      }
      toast.success("Welcome back!");
      navigate("/admin");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const result = signUpSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      if (fieldErrors.confirmPassword) {
        toast.error(fieldErrors.confirmPassword);
      }
      return;
    }

    setIsLoading(true);
    const { error, userId } = await signUp(email.trim(), password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered");
      } else {
        toast.error(error.message);
      }
    } else {
      // Create admin request for the new user
      if (userId) {
        const { error: requestError } = await supabase
          .from("admin_requests")
          .insert({
            user_id: userId,
            email: email.trim().toLowerCase(),
            status: "pending",
          });

        if (requestError) {
          console.error("Failed to create admin request:", requestError);
        }
      }
      toast.success("Account created! Your request is pending admin approval.");
      setConfirmPassword("");
      setRequestStatus("pending");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Church className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Portal
          </h1>
          <p className="text-muted-foreground">
            Shiloh Intercession Mountain
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your church website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="admin@church.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@church.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                      className={errors.email ? "border-destructive" : ""}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                        className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
                        className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Note: New accounts require admin privileges to access the dashboard.
        </p>
      </div>
    </div>
  );
}
