'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function EditUserModal({ isOpen, onClose, user, onUserUpdated }: { isOpen: boolean, onClose: () => void, user: any, onUserUpdated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [roles, setRoles] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetch('/api/roles')
        .then(res => res.json())
        .then(data => setRoles(data))
        .catch(console.error)
    }
  }, [isOpen])

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRoleId(user.roleId)
      setIsActive(user.isActive)
      setPassword('')
      setError('')
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!roleId) {
      return setError('Please select a role')
    }

    setIsLoading(true)

    try {
      const payload: any = { name, email, roleId, isActive }
      if (password) {
        payload.password = password
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update user')
      }

      onUserUpdated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-lg font-semibold">Edit User: {user.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Change Password (optional)</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Leave blank to keep current password" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select required value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
                <option value="">Select a role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select value={isActive ? "true" : "false"} onChange={e => setIsActive(e.target.value === "true")} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {isLoading && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
