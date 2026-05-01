"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Send, Search, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  email: string;
  name: string;
  sent: boolean;
  skipped: boolean;
}

export default function BulkBlastPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalSent, setTotalSent] = useState(0);
  const [totalSkipped, setTotalSkipped] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/send-bulk-email");
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
        setTotalSent(data.totalSent);
        setTotalSkipped(data.totalSkipped || 0);
      }
    } catch (error) {
      toast.error("Failed to fetch user list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    if (selectedEmails.length === filteredUsers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredUsers.map(u => u.email));
    }
  };

  const selectNext = (count: number) => {
    const nextUnsent = filteredUsers
      .filter(u => !u.sent && !u.skipped)
      .slice(0, count)
      .map(u => u.email);
    setSelectedEmails(nextUnsent);
  };

  const handleSkip = async (email: string) => {
    // Optimistic Update
    setUsers(prev => prev.map(u => u.email === email ? { ...u, skipped: true } : u));
    setTotalSkipped(prev => prev + 1);

    try {
      await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testMode: false, 
          skipEmails: [email] 
        }),
      });
    } catch (error) {
      toast.error("Failed to sync skip to server");
      fetchUsers();
    }
  };

  const handleSendSelected = async () => {
    if (selectedEmails.length === 0) return;
    
    setSending(true);
    const emailsToProcess = [...selectedEmails];
    
    toast.loading(`Preparing to send ${emailsToProcess.length} emails...`, { id: "sending-toast" });

    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testMode: false, 
          specificEmails: emailsToProcess 
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully sent ${result.sentThisRun} emails`, { id: "sending-toast" });
      } else if (result.sentThisRun > 0) {
        toast.warning(`Sent ${result.sentThisRun} emails, but ${result.errors?.length || "some"} failed. Check terminal for details.`, { id: "sending-toast", duration: 5000 });
      } else {
        toast.error(result.message || "Failed to send emails", { id: "sending-toast" });
      }

      // Update local state for the ones that DID succeed
      if (result.sentThisRun > 0) {
        // We need to know WHICH ones succeeded. For now, let's assume we skip the ones in result.errors
        const failedEmails = (result.errors || []).map((e: any) => e.email);
        const successfulEmails = emailsToProcess.filter(email => !failedEmails.includes(email));

        setUsers(prev => prev.map(u => 
          successfulEmails.includes(u.email) ? { ...u, sent: true } : u
        ));
        setTotalSent(prev => prev + result.sentThisRun);
      }
      
      setSelectedEmails([]);
    } catch (error) {
      toast.error("Network error during sending", { id: "sending-toast" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Free Delivery Reminder</h1>
          <p className="text-gray-600 mt-1">Manage and track the May 2nd Free Delivery reminder blast.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            {totalSent} Sent
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-orange-50 text-orange-700 border-orange-200">
            {totalSkipped} Skipped
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1B6013]" /> 
              Recipient Control
            </CardTitle>
            <CardDescription>
              Select specific users to message. Processed users (Sent or Skipped) are ignored by auto-select.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectNext(10)}>
                  Select Next 10
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectNext(20)}>
                  Select Next 20
                </Button>
              </div>
              <Button 
                onClick={handleSendSelected} 
                disabled={sending || selectedEmails.length === 0}
                className="bg-[#1B6013] hover:bg-[#154d0f]"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to {selectedEmails.length} Selected
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedEmails.length === (filteredUsers.filter(u => !u.sent && !u.skipped).length) && selectedEmails.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Loading recipient list...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                        No customers found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.email} className={(user.sent || user.skipped) ? "bg-gray-50/50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedEmails.includes(user.email)}
                            onCheckedChange={() => toggleSelect(user.email)}
                            disabled={user.sent || user.skipped}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-600">{user.email}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          {user.sent ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                            </Badge>
                          ) : user.skipped ? (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                              Skipped
                            </Badge>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-gray-400 hover:text-red-600"
                                onClick={() => handleSkip(user.email)}
                              >
                                Skip
                              </Button>
                              <Badge variant="outline" className="text-gray-400 border-gray-200">
                                Not Sent
                              </Badge>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Pro Tip:</strong> We recommend sending in batches of 20-30 to maintain high deliverability and avoid SMTP timeouts.
        </p>
      </div>
    </div>
  );
}
