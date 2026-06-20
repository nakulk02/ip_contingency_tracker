"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotes() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.data || []);
    setLoading(false);
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-1">Quick notes and reminders</p>
        </div>
        <Link href="/notes/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <StickyNote className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No notes yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Create your first note</p>
            <Link href="/notes/new" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/notes/${note.id}`} className="text-primary hover:underline font-medium">
                        {note.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {note.body ? note.body.slice(0, 80) + (note.body.length > 80 ? "..." : "") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
