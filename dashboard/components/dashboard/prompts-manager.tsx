'use client'

import React from "react"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Star, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Prompt {
  id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
}

interface PromptsManagerProps {
  initialPrompts: Prompt[]
}

export function PromptsManager({ initialPrompts }: PromptsManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const content = formData.get('content') as string

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        user_id: user.id,
        name,
        content,
        is_default: prompts.length === 0,
      })
      .select()
      .single()

    if (!error && data) {
      setPrompts([data, ...prompts])
      setIsCreateOpen(false)
    }

    setIsLoading(false)
    router.refresh()
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPrompt) return
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const content = formData.get('content') as string

    const supabase = createClient()
    const { data, error } = await supabase
      .from('prompts')
      .update({ name, content })
      .eq('id', editingPrompt.id)
      .select()
      .single()

    if (!error && data) {
      setPrompts(prompts.map((p) => (p.id === data.id ? data : p)))
      setEditingPrompt(null)
    }

    setIsLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('prompts').delete().eq('id', id)

    if (!error) {
      setPrompts(prompts.filter((p) => p.id !== id))
    }
    router.refresh()
  }

  const handleSetDefault = async (id: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // First, remove default from all prompts
    await supabase
      .from('prompts')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Then set the new default
    const { error } = await supabase
      .from('prompts')
      .update({ is_default: true })
      .eq('id', id)

    if (!error) {
      setPrompts(
        prompts.map((p) => ({
          ...p,
          is_default: p.id === id,
        }))
      )
    }
    router.refresh()
  }

  const handleDuplicate = async (prompt: Prompt) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        user_id: user.id,
        name: `${prompt.name} (Copy)`,
        content: prompt.content,
        is_default: false,
      })
      .select()
      .single()

    if (!error && data) {
      setPrompts([data, ...prompts])
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white/40 p-4 rounded-3xl border border-slate-100 backdrop-blur-md shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 ml-2">Your Prompts</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Prompt</DialogTitle>
                <DialogDescription>
                  Create a custom prompt for AI reply generation
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Friendly Reply"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Prompt Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="You are a helpful assistant that writes friendly Twitter replies..."
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{{tweet}}'} to include the original tweet content in your prompt
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Prompt'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {prompts.length === 0 ? (
        <Card className="border border-slate-100 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-slate-500 font-medium mb-6 text-center text-lg">
              You don&apos;t have any custom prompts yet
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-full shadow-md shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 font-semibold px-8 py-6 h-auto text-base">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="rounded-3xl border border-slate-100 bg-white/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 leading-snug">
                    {prompt.name}
                    {prompt.is_default && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-bold border-none">
                        <Star className="mr-1 h-3 w-3 fill-blue-600" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wide">
                    Created {new Date(prompt.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-600 line-clamp-3 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {prompt.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Dialog
                    open={editingPrompt?.id === prompt.id}
                    onOpenChange={(open) =>
                      setEditingPrompt(open ? prompt : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <form onSubmit={handleUpdate}>
                        <DialogHeader>
                          <DialogTitle>Edit Prompt</DialogTitle>
                          <DialogDescription>
                            Update your prompt content
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              name="name"
                              defaultValue={prompt.name}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-content">Prompt Content</Label>
                            <Textarea
                              id="edit-content"
                              name="content"
                              defaultValue={prompt.content}
                              className="min-h-[200px]"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(prompt)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Duplicate
                  </Button>

                  {!prompt.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(prompt.id)}
                    >
                      <Star className="mr-2 h-3 w-3" />
                      Set Default
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{prompt.name}&quot;? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(prompt.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
