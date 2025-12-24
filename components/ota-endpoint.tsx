"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, PlayCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function OtaEndpoint() {
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/ota` : "/api/ota"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/ota")
      const data = await response.json()
      setTestResult({ success: response.ok, data })
    } catch (error) {
      setTestResult({ success: false, error: "Network error" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESP32 OTA Endpoint</CardTitle>
        <CardDescription>API endpoint for ESP32 firmware updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">{endpoint}</code>
          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 bg-transparent">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy URL"}
          </Button>
          <Button variant="default" size="sm" onClick={handleTest} disabled={testing} className="shrink-0">
            <PlayCircle className="size-4" />
            {testing ? "Testing..." : "Test Endpoint"}
          </Button>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? "Success" : "Error"}
                </Badge>
                <span className="text-sm">
                  {testResult.success ? "Endpoint is working correctly" : "Endpoint test failed"}
                </span>
              </div>
              {testResult.data && (
                <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
