"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, Loader2 } from "lucide-react"
import { CreateUserDialog } from "@/components/create-user-dialog"

interface User {
  id: number
  username: string
  fullName: string | null
  role: string
  canCreateUsers: boolean
  createdAt: string
  lastLogin: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to load users")
        return
      }

      setUsers(data.users)
    } catch (err) {
      setError("An error occurred while loading users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    setDeleteLoading(id)

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete user")
        return
      }

      setUsers(users.filter((u) => u.id !== id))
    } catch (err) {
      alert("An error occurred while deleting the user")
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleUserCreated = () => {
    setDialogOpen(false)
    fetchUsers()
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            Create User
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>All registered users and their access levels</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "master" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.canCreateUsers ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            Can Manage Users
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Standard Access</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== "master" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteLoading === user.id}
                          >
                            {deleteLoading === user.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} onUserCreated={handleUserCreated} />
    </main>
  )
}
