"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Users, UserPlus, Trash2, Phone, IndianRupee, Star, TrendingUp,
  ChevronRight, Award, Edit3, Plus, History,
} from "lucide-react";

interface SalaryIncrement {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface StaffProfile {
  id: string;
  phone: string;
  salary: number;
  performancePoints: number;
  joiningDate: string;
  notes: string;
  increments: SalaryIncrement[];
}

interface StaffMember {
  id: string;
  name: string;
  createdAt: string;
  staffProfile: StaffProfile | null;
}

const emptyForm = {
  name: "", phone: "", salary: "", joiningDate: "", notes: "",
};

export default function StaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Selected staff for detail panel
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState("");
  const [incrementAmount, setIncrementAmount] = useState("");
  const [incrementReason, setIncrementReason] = useState("");
  const [incrementDialogOpen, setIncrementDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", salary: "", notes: "" });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user?.role !== "OWNER") router.push("/");
    else if (status === "authenticated") fetchStaff();
  }, [status, session]);

  async function fetchStaff() {
    try {
      const res = await fetch("/api/staff");
      const result = await res.json();
      if (result.success) {
        setStaff(result.data);
        // Refresh selected if open
        if (selected) {
          const updated = result.data.find((s: StaffMember) => s.id === selected.id);
          if (updated) setSelected(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary: parseFloat(formData.salary) || 0,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Failed to add staff");
      toast({ title: "✓ Staff added", description: `${formData.name} has been added to your team.` });
      setFormData(emptyForm);
      setAddDialogOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your team? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Staff removed" });
      if (selected?.id === id) setSelected(null);
      fetchStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleAddPoints() {
    if (!selected || !pointsToAdd) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addPoints: parseInt(pointsToAdd) }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: `✓ +${pointsToAdd} points added!`, description: `${selected.name}'s performance updated.` });
      setPointsToAdd("");
      setPointsDialogOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddIncrement() {
    if (!selected || !incrementAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addIncrement: { amount: parseFloat(incrementAmount), reason: incrementReason },
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: `✓ Salary increment applied!`, description: `+₹${incrementAmount} added to salary.` });
      setIncrementAmount("");
      setIncrementReason("");
      setIncrementDialogOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditSave() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          setSalary: parseFloat(editForm.salary),
          notes: editForm.notes,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "✓ Details updated!" });
      setEditDialogOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  function openEdit(s: StaffMember) {
    setSelected(s);
    setEditForm({
      name: s.name,
      phone: s.staffProfile?.phone || "",
      salary: s.staffProfile?.salary?.toString() || "0",
      notes: s.staffProfile?.notes || "",
    });
    setEditDialogOpen(true);
  }

  const getPointsLevel = (points: number) => {
    if (points >= 500) return { label: "Elite", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" };
    if (points >= 200) return { label: "Senior", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
    if (points >= 100) return { label: "Experienced", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
    if (points >= 50) return { label: "Growing", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" };
    return { label: "Newcomer", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Staff Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {staff.length} team member{staff.length !== 1 ? "s" : ""} • Track performance and salary
            </p>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Add New Staff Member
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="staffName">Full Name *</Label>
                  <Input id="staffName" placeholder="Enter staff name" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="staffPhone" placeholder="+91 9876543210" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="staffSalary">Monthly Salary (₹)</Label>
                    <Input id="staffSalary" type="number" min="0" placeholder="0"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffJoining">Joining Date</Label>
                    <Input id="staffJoining" type="date" value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffNotes">Notes (optional)</Label>
                  <Input id="staffNotes" placeholder="e.g. Handles morning shift" value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="h-11" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Staff Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className={`grid gap-6 ${selected ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Staff List */}
          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : staff.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No staff members yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first team member above</p>
                </CardContent>
              </Card>
            ) : (
              staff.map((s) => {
                const points = s.staffProfile?.performancePoints || 0;
                const level = getPointsLevel(points);
                const isActive = selected?.id === s.id;
                return (
                  <Card
                    key={s.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary shadow-md" : ""}`}
                    onClick={() => setSelected(isActive ? null : s)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-base">{s.name}</p>
                              <Badge className={`text-xs border-0 ${level.color}`}>
                                {level.label}
                              </Badge>
                            </div>
                            {s.staffProfile?.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {s.staffProfile.phone}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {s.staffProfile?.salary?.toLocaleString("en-IN") || 0}/mo
                              </span>
                              <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.name); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isActive ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="space-y-4">
              {/* Performance Card */}
              <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    Performance — {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                        {selected.staffProfile?.performancePoints || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Total Points</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-sm px-3 py-1 border-0 ${getPointsLevel(selected.staffProfile?.performancePoints || 0).color}`}>
                        {getPointsLevel(selected.staffProfile?.performancePoints || 0).label}
                      </Badge>
                      {/* Points threshold guide */}
                      <p className="text-xs text-muted-foreground mt-1">50→100→200→500 pts</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-amber-200/50 dark:bg-amber-900/30 rounded-full h-2">
                      <div
                        className="bg-amber-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${Math.min((selected.staffProfile?.performancePoints || 0) / 500 * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Progress to Elite level (500 pts)</p>
                  </div>

                  <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 w-full border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                        <Plus className="h-3.5 w-3.5" />
                        Add Performance Points
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Add Points — {selected.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Points to Add</Label>
                          <Input type="number" min="1" placeholder="e.g. 10"
                            value={pointsToAdd}
                            onChange={(e) => setPointsToAdd(e.target.value)}
                            className="h-11" />
                        </div>
                        <div className="flex gap-2">
                          {[5, 10, 25, 50].map(p => (
                            <Button key={p} variant="outline" size="sm" className="flex-1"
                              onClick={() => setPointsToAdd(p.toString())}>
                              +{p}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full gap-2" onClick={handleAddPoints} disabled={!pointsToAdd || actionLoading}>
                          <Star className="h-4 w-4" />
                          {actionLoading ? "Adding..." : `Add ${pointsToAdd || 0} Points`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Salary Card */}
              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    Salary & Increments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        ₹{selected.staffProfile?.salary?.toLocaleString("en-IN") || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Current Monthly Salary</p>
                    </div>
                    {(selected.staffProfile?.increments?.length || 0) > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          +₹{selected.staffProfile!.increments.reduce((s, i) => s + i.amount, 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">Total increments</p>
                      </div>
                    )}
                  </div>

                  <Dialog open={incrementDialogOpen} onOpenChange={setIncrementDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 w-full border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Add Salary Increment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Salary Increment — {selected.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Increment Amount (₹)</Label>
                          <Input type="number" min="1" placeholder="e.g. 2000"
                            value={incrementAmount}
                            onChange={(e) => setIncrementAmount(e.target.value)}
                            className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Input placeholder="e.g. Annual appraisal, Performance bonus"
                            value={incrementReason}
                            onChange={(e) => setIncrementReason(e.target.value)}
                            className="h-11" />
                        </div>
                        {incrementAmount && (
                          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current salary</span>
                              <span>₹{(selected.staffProfile?.salary || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">After increment</span>
                              <span className="font-bold text-green-700 dark:text-green-400">
                                ₹{((selected.staffProfile?.salary || 0) + parseFloat(incrementAmount || "0")).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button className="w-full gap-2" onClick={handleAddIncrement} disabled={!incrementAmount || actionLoading}>
                          <TrendingUp className="h-4 w-4" />
                          {actionLoading ? "Applying..." : "Apply Increment"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Increment History */}
                  {(selected.staffProfile?.increments?.length || 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <History className="h-3 w-3" /> Increment History
                      </p>
                      {selected.staffProfile!.increments.slice(0, 5).map((inc) => (
                        <div key={inc.id} className="flex justify-between items-center text-sm py-1.5 border-t">
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">+₹{inc.amount.toLocaleString("en-IN")}</p>
                            {inc.reason && <p className="text-xs text-muted-foreground">{inc.reason}</p>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(inc.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selected.staffProfile?.notes && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{selected.staffProfile.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-11 pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base Monthly Salary (₹)</Label>
              <Input type="number" min="0" value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="h-11" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
