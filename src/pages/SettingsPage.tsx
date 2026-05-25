import { motion } from "framer-motion";
import {
  User,
  Lock,
  Globe,
  Brain,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Moon,
  Sun,
  Palette,
  Wallet,
  Smartphone,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeGet, safeSet, storageKey } from "@/lib/storage";
import type { LearnAIMode, LearnAILanguage } from "@/features/learn-ai/types";

const AVATAR_COLORS = [
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
];

type AiDefaults = { mode: LearnAIMode; language: LearnAILanguage };

const CARD_BORDER = { border: "1px solid rgba(56,189,248,0.12)" };
const DANGER_BORDER = { border: "1px solid rgba(239,68,68,0.3)" };

function getInitials(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { preferences, setTheme, setLanguage: setPrefLanguage, setCurrency } = usePreferences();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { profile, isLoading: profileLoading, isSaving, refresh, save } = useProfile();

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(() =>
    safeGet(storageKey("avatar-color"), "#0EA5E9"),
  );

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isPwSaving, setIsPwSaving] = useState(false);

  // Language preference
  const [appLanguage, setAppLanguage] = useState<string>(() =>
    safeGet(storageKey("language"), preferences.language ?? "en"),
  );

  // AI defaults
  const [aiDefaults, setAiDefaults] = useState<AiDefaults>(() =>
    safeGet<AiDefaults>(storageKey("ai-defaults"), { mode: "fiae_algorithms", language: "de" }),
  );

  // PWA install
  const installPromptRef = useRef<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e as typeof installPromptRef.current;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptRef.current) return;
    await installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    if (outcome === "accepted") {
      installPromptRef.current = null;
      setCanInstall(false);
    }
  };

  // Danger zone
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? "");
  }, [profile]);

  const initials = getInitials(displayName, user?.email ?? "");

  const handleSaveProfile = async () => {
    safeSet(storageKey("avatar-color"), avatarColor);
    const saved = await save({ displayName });
    if (saved) toast.success("Profile updated");
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    if (!user?.email) return;

    setIsPwSaving(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (verifyErr) {
        setPwError("Current password is incorrect.");
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) throw updateErr;
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setPwError(msg);
    } finally {
      setIsPwSaving(false);
    }
  };

  const handleSaveLanguage = () => {
    safeSet(storageKey("language"), appLanguage);
    setPrefLanguage(appLanguage);
    toast.success("Language preference saved");
  };

  const handleSaveAiDefaults = () => {
    safeSet(storageKey("ai-defaults"), aiDefaults);
    toast.success("AI defaults saved");
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await supabase.rpc("delete_account");
    } catch {
      // fall through — sign out even if rpc fails
    }
    try {
      await signOut();
    } finally {
      setIsDeleting(false);
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Profile */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your name and avatar color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 select-none"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select avatar color ${c}`}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none ${avatarColor === c ? "ring-2 ring-white ring-offset-1" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setAvatarColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                disabled={profileLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly disabled className="opacity-60" />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving || profileLoading}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save profile
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPw">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPw"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowCurrentPw((v) => !v)}
                >
                  {showCurrentPw ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPw">New password</Label>
              <div className="relative">
                <Input
                  id="newPw"
                  type={showNewPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowNewPw((v) => !v)}
                >
                  {showNewPw ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPw">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPw"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowConfirmPw((v) => !v)}
                >
                  {showConfirmPw ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {pwError && <p className="text-sm text-destructive">{pwError}</p>}

            <Button
              onClick={handleChangePassword}
              disabled={isPwSaving || !currentPw || !newPw || !confirmPw}
            >
              {isPwSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Change password
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Language
            </CardTitle>
            <CardDescription>Interface and AI response language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={appLanguage} onValueChange={setAppLanguage}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fa">فارسی</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSaveLanguage}>Save</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {preferences.theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Light, dark, or system</p>
                </div>
              </div>
              <Select
                value={preferences.theme}
                onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Currency
            </CardTitle>
            <CardDescription>Default currency for totals</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={preferences.currency ?? "USD"} onValueChange={setCurrency}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="IRR">IRR</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Learn with AI Defaults */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Learn with AI
            </CardTitle>
            <CardDescription>Default mode and language for the AI tutor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiMode">Default mode</Label>
              <Select
                value={aiDefaults.mode}
                onValueChange={(v) =>
                  setAiDefaults((prev) => ({ ...prev, mode: v as LearnAIMode }))
                }
              >
                <SelectTrigger id="aiMode" className="w-full sm:w-64">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiae_algorithms">FIAE Algorithms</SelectItem>
                  <SelectItem value="wiso">WiSo</SelectItem>
                  <SelectItem value="general_it">General IT</SelectItem>
                  <SelectItem value="planner">Planner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiLanguage">Response language</Label>
              <Select
                value={aiDefaults.language}
                onValueChange={(v) =>
                  setAiDefaults((prev) => ({ ...prev, language: v as LearnAILanguage }))
                }
              >
                <SelectTrigger id="aiLanguage" className="w-full sm:w-64">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fa">فارسی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveAiDefaults}>Save defaults</Button>
          </CardContent>
        </Card>

        {/* Install App */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install App
            </CardTitle>
            <CardDescription>Add DailyFlow to your home screen for a native-like experience</CardDescription>
          </CardHeader>
          <CardContent>
            {isStandalone ? (
              <p className="text-sm text-emerald-400">DailyFlow is already installed on this device.</p>
            ) : canInstall ? (
              <Button onClick={handleInstall} className="gap-2">
                <Download className="w-4 h-4" />
                Install DailyFlow
              </Button>
            ) : isIos ? (
              <p className="text-sm text-muted-foreground">
                To install on iOS: tap the <strong>Share</strong> button in Safari, then select{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open this page in Chrome or Edge to install the app on your device.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card style={CARD_BORDER}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Signed in as</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card style={CARD_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm">1.0.0</span>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                DailyFlow — Your Personal Life Organizer
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Barakzai.Cloud 2024 © All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card style={DANGER_BORDER}>
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete my account
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete account dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setDeleteText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data. This action cannot be
              undone. Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type DELETE"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteText !== "DELETE" || isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
