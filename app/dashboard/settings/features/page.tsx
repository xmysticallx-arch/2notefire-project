'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Shield,
  LayoutDashboard,
  Users,
  Disc3,
  Music,
  Calculator,
  DollarSign,
  BarChart3,
  FileText,
  Bell,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FeatureSetting {
  id: string
  feature_key: string
  feature_name: string
  description: string | null
  enabled: boolean
  visible_to_roles: string[]
  sidebar_order: number
  icon: string | null
  route: string | null
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Disc3,
  Music,
  Calculator,
  DollarSign,
  BarChart3,
  FileText,
  Bell,
  Settings,
}

const availableRoles = ['admin', 'user', 'artist']

export default function FeatureSettingsPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<FeatureSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingFeature, setEditingFeature] = useState<FeatureSetting | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFeature, setNewFeature] = useState<Partial<FeatureSetting>>({
    feature_key: '',
    feature_name: '',
    description: '',
    enabled: true,
    visible_to_roles: ['admin'],
    sidebar_order: features.length + 1,
    icon: 'Settings',
    route: '/dashboard/',
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'admin') {
        setIsAdmin(true)
        fetchFeatures()
      } else {
        router.push('/dashboard/settings')
      }
    }
  }

  const fetchFeatures = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('feature_settings')
      .select('*')
      .order('sidebar_order', { ascending: true })

    if (!error && data) {
      setFeatures(data)
    }
    setIsLoading(false)
  }

  const toggleFeature = async (id: string, enabled: boolean) => {
    const supabase = createClient()
    await supabase
      .from('feature_settings')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id)

    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled } : f))
  }

  const toggleRoleVisibility = async (id: string, role: string, visible: boolean) => {
    const feature = features.find(f => f.id === id)
    if (!feature) return

    const newRoles = visible
      ? [...feature.visible_to_roles, role]
      : feature.visible_to_roles.filter(r => r !== role)

    const supabase = createClient()
    await supabase
      .from('feature_settings')
      .update({ visible_to_roles: newRoles, updated_at: new Date().toISOString() })
      .eq('id', id)

    setFeatures(prev => prev.map(f => f.id === id ? { ...f, visible_to_roles: newRoles } : f))
  }

  const saveFeatureEdit = async () => {
    if (!editingFeature) return
    
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('feature_settings')
      .update({
        feature_name: editingFeature.feature_name,
        description: editingFeature.description,
        sidebar_order: editingFeature.sidebar_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingFeature.id)

    if (!error) {
      setFeatures(prev => prev.map(f => f.id === editingFeature.id ? editingFeature : f))
      setEditDialogOpen(false)
      setEditingFeature(null)
    }
    setIsSaving(false)
  }

  const createFeature = async () => {
    if (!newFeature.feature_key || !newFeature.feature_name) return
    
    setIsSaving(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('feature_settings')
      .insert([newFeature])
      .select()
      .single()

    if (!error && data) {
      setFeatures(prev => [...prev, data])
      setCreateDialogOpen(false)
      setNewFeature({
        feature_key: '',
        feature_name: '',
        description: '',
        enabled: true,
        visible_to_roles: ['admin'],
        sidebar_order: features.length + 2,
        icon: 'Settings',
        route: '/dashboard/',
      })
    }
    setIsSaving(false)
  }

  const deleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('feature_settings')
      .delete()
      .eq('id', id)

    if (!error) {
      setFeatures(prev => prev.filter(f => f.id !== id))
    }
  }

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Settings
    return iconMap[iconName] || Settings
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Feature Settings</h1>
            <p className="text-muted-foreground">
              Manage application features and sidebar visibility per role
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
              <DialogDescription>
                Add a new feature to the application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_feature_key">Feature Key</Label>
                <Input
                  id="new_feature_key"
                  placeholder="e.g., reports"
                  value={newFeature.feature_key}
                  onChange={(e) => setNewFeature({...newFeature, feature_key: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_feature_name">Display Name</Label>
                <Input
                  id="new_feature_name"
                  placeholder="e.g., Reports"
                  value={newFeature.feature_name}
                  onChange={(e) => setNewFeature({...newFeature, feature_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_description">Description</Label>
                <Input
                  id="new_description"
                  placeholder="Feature description"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_route">Route</Label>
                <Input
                  id="new_route"
                  placeholder="/dashboard/reports"
                  value={newFeature.route}
                  onChange={(e) => setNewFeature({...newFeature, route: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_icon">Icon</Label>
                <Input
                  id="new_icon"
                  placeholder="Settings"
                  value={newFeature.icon}
                  onChange={(e) => setNewFeature({...newFeature, icon: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_sidebar_order">Sidebar Order</Label>
                <Input
                  id="new_sidebar_order"
                  type="number"
                  min={1}
                  value={newFeature.sidebar_order}
                  onChange={(e) => setNewFeature({...newFeature, sidebar_order: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createFeature} disabled={isSaving || !newFeature.feature_key || !newFeature.feature_name}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Create Feature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Application Features
          </CardTitle>
          <CardDescription>
            Enable or disable features and control which roles can see them in the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-center">User</TableHead>
                <TableHead className="text-center">Artist</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => {
                const IconComponent = getIcon(feature.icon)
                return (
                  <TableRow key={feature.id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        {feature.sidebar_order}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{feature.feature_name}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">{feature.route}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                      />
                    </TableCell>
                    {availableRoles.map((role) => (
                      <TableCell key={role} className="text-center">
                        <Checkbox
                          checked={feature.visible_to_roles.includes(role)}
                          onCheckedChange={(checked) => 
                            toggleRoleVisibility(feature.id, role, checked as boolean)
                          }
                          disabled={!feature.enabled}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Dialog open={editDialogOpen && editingFeature?.id === feature.id} onOpenChange={(open) => {
                          setEditDialogOpen(open)
                          if (open) setEditingFeature(feature)
                          else setEditingFeature(null)
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Feature</DialogTitle>
                            <DialogDescription>
                              Update feature display name, description, and order
                            </DialogDescription>
                          </DialogHeader>
                          {editingFeature && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="feature_name">Display Name</Label>
                                <Input
                                  id="feature_name"
                                  value={editingFeature.feature_name}
                                  onChange={(e) => setEditingFeature({
                                    ...editingFeature,
                                    feature_name: e.target.value
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                  id="description"
                                  value={editingFeature.description || ''}
                                  onChange={(e) => setEditingFeature({
                                    ...editingFeature,
                                    description: e.target.value
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="sidebar_order">Sidebar Order</Label>
                                <Input
                                  id="sidebar_order"
                                  type="number"
                                  min={1}
                                  value={editingFeature.sidebar_order}
                                  onChange={(e) => setEditingFeature({
                                    ...editingFeature,
                                    sidebar_order: parseInt(e.target.value) || 1
                                  })}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditDialogOpen(false)
                                    setEditingFeature(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={saveFeatureEdit} disabled={isSaving}>
                                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feature?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the feature &quot;{feature.feature_name}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFeature(feature.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Role-Based Access Control
          </CardTitle>
          <CardDescription>
            Summary of feature visibility per role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {availableRoles.map((role) => {
              const visibleFeatures = features.filter(f => f.enabled && f.visible_to_roles.includes(role))
              return (
                <Card key={role} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{role}</CardTitle>
                    <CardDescription>
                      {visibleFeatures.length} features visible
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {visibleFeatures.map((feature) => (
                        <Badge key={feature.id} variant="secondary" className="text-xs">
                          {feature.feature_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
