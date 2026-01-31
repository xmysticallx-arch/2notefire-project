"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, FileText, Download, Calendar, DollarSign, User } from "lucide-react"
import Link from "next/link"
import type { Contract, Artist } from "@/lib/types"

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<Contract & { artist?: Artist } | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchContract() {
      const supabase = createClient()
      const { data } = await supabase
        .from("contracts")
        .select("*, artist:artists(*)")
        .eq("id", params.id)
        .single()

      if (data) setContract(data as Contract & { artist?: Artist })
      setLoading(false)
    }

    fetchContract()
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("contracts").delete().eq("id", params.id)
    if (!error) {
      router.push("/dashboard/contracts")
    } else {
      alert("Failed to delete contract")
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "approved": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "pending_approval": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "expired": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "cancelled": return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Contract not found</p>
        <Link href="/dashboard/contracts">
          <Button variant="link">Back to Contracts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <p className="text-muted-foreground capitalize">{contract.contract_type} Contract</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/contracts/${contract.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this contract? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Artist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.artist ? (
              <Link href={`/dashboard/artists/${contract.artist.id}`} className="text-primary hover:underline">
                {contract.artist.stage_name || contract.artist.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">No artist assigned</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span>{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "Not set"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {contract.value ? `$${Number(contract.value).toLocaleString()}` : "Not specified"}
            </p>
            <Badge className={`mt-2 ${getStatusColor(contract.status)}`}>
              {contract.status.replace("_", " ")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {contract.terms && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{contract.terms}</p>
          </CardContent>
        </Card>
      )}

      {contract.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{contract.notes}</p>
          </CardContent>
        </Card>
      )}

      {contract.file_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={contract.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Download className="h-4 w-4" />
              Download Document
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
