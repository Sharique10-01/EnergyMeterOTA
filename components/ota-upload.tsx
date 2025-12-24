"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, CheckCircle2, XCircle } from "lucide-react"

export function OtaUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [version, setVersion] = useState("")
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".bin")) {
        setMessage({ type: "error", text: "Please select a .bin file" })
        return
      }
      setFile(selectedFile)
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !version) {
      setMessage({ type: "error", text: "Please select a file and enter a version" })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("version", version)
      formData.append("notes", notes)

      const response = await fetch("/api/upload-firmware", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: `Firmware ${data.version} uploaded successfully!` })
        setFile(null)
        setVersion("")
        setNotes("")
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Firmware</CardTitle>
        <CardDescription>Upload a .bin file to create a new GitHub release</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="firmware-file">Firmware File</Label>
          <div className="flex items-center gap-2">
            <Input id="firmware-file" type="file" accept=".bin" onChange={handleFileChange} disabled={uploading} />
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version Tag</Label>
          <Input
            id="version"
            placeholder="v1.2.4"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Release Notes</Label>
          <Textarea
            id="notes"
            placeholder="Bug fixes and improvements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={uploading}
            className="min-h-24"
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading || !file || !version} className="w-full">
          <Upload className="size-4" />
          {uploading ? "Uploading..." : "Upload to GitHub Releases"}
        </Button>
      </CardContent>
    </Card>
  )
}
