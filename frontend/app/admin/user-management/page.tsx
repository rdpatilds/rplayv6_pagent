"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, UserPlus, Trash2 } from "lucide-react"
import { BulkImportDialog } from "@/components/bulk-import-dialog"
import { CSVTemplateDownload } from "@/components/csv-template-download"
import Link from "next/link"
import { usersApi } from "@/lib/api"

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "learner",
    jobRole: "",
  })

  useEffect(() => {
    if (isAuthenticated && (user?.role === "super_admin" || user?.role === "company_admin")) {
      fetchUsers()
    } else if (isAuthenticated && user?.role !== "super_admin" && user?.role !== "company_admin") {
      router.push("/dashboard")
    }
  }, [isAuthenticated, user, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll()
      setUsers(response.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      await usersApi.create({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: formData.accountType,
        jobRole: formData.jobRole,
      })

      toast({
        title: "Success",
        description: "User added successfully",
      })

      setIsAddUserOpen(false)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        accountType: "learner",
        jobRole: "",
      })
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    const nameParts = (user.name || "").split(" ")
    setFormData({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: user.email,
      password: "",
      accountType: user.role,
      jobRole: user.job_role || "",
    })
    setIsEditUserOpen(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await usersApi.update(selectedUser.id, {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: formData.accountType,
        jobRole: formData.jobRole,
        ...(formData.password ? { password: formData.password } : {}),
      })

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setIsEditUserOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await usersApi.delete(userToDelete.id)

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format account type for display
  const formatAccountType = (accountType) => {
    switch (accountType) {
      case "super_admin":
        return "Super Admin"
      case "company_admin":
        return "Company Admin"
      case "trainer":
        return "Trainer"
      case "learner":
        return "Learner"
      default:
        return accountType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  // Get badge color based on account type
  const getAccountTypeBadgeColor = (accountType) => {
    switch (accountType) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-300"
      case "company_admin":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "trainer":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "learner":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Check if current user can delete the target user
  const canDeleteUser = (targetUser) => {
    // Super admins can delete anyone except themselves
    if (user?.role === "super_admin") {
      return targetUser.id !== user.id
    }

    // Company admins can only delete learners and trainers
    if (user?.role === "company_admin") {
      return targetUser.role === "learner" || targetUser.role === "trainer"
    }

    return false
  }

  if (!isAuthenticated || (user?.role !== "super_admin" && user?.role !== "company_admin")) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <CSVTemplateDownload />

          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account. All fields except Role are required.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      name="accountType"
                      value={formData.accountType}
                      onValueChange={(value) => handleSelectChange("accountType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                        {user?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobRole">Role (Optional)</Label>
                    <Input
                      id="jobRole"
                      name="jobRole"
                      placeholder="e.g. Sales Manager"
                      value={formData.jobRole}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">The user's job title or role at their company</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <BulkImportDialog onSuccess={fetchUsers} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and permissions.
            <span className="block mt-1">
              To add multiple users at once, download the CSV template, fill it out, and use the Bulk Import feature.
              <Link href="/admin/user-management/help" className="ml-1 text-blue-600 hover:underline">
                View import instructions
              </Link>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getAccountTypeBadgeColor(user.role)}>
                          {formatAccountType(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.job_role || "—"}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          {canDeleteUser(user) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input
                      id="edit-firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input
                      id="edit-lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    Password <span className="text-muted-foreground">(Leave blank to keep current)</span>
                  </Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountType">Account Type</Label>
                  <Select
                    name="accountType"
                    value={formData.accountType}
                    onValueChange={(value) => handleSelectChange("accountType", value)}
                  >
                    <SelectTrigger id="edit-accountType">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                      {user?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-jobRole">Role (Optional)</Label>
                  <Input
                    id="edit-jobRole"
                    name="jobRole"
                    placeholder="e.g. Sales Manager"
                    value={formData.jobRole}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">The user's job title or role at their company</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              {userToDelete && (
                <span className="font-medium">
                  {" "}
                  {userToDelete.name} ({userToDelete.email})
                </span>
              )}{" "}
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
