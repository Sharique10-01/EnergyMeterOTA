import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrentFirmware } from "@/components/current-firmware"
import { OtaUpload } from "@/components/ota-upload"
import { FirmwareHistory } from "@/components/firmware-history"
import { OtaEndpoint } from "@/components/ota-endpoint"
import { PlaceholderTab } from "@/components/placeholder-tab"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ota" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="ota">OTA Updates</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="ota" className="space-y-6">
            <CurrentFirmware />
            <OtaUpload />
            <FirmwareHistory />
            <OtaEndpoint />
          </TabsContent>

          <TabsContent value="monitoring">
            <PlaceholderTab
              title="Real-Time Monitoring"
              description="Coming Soon"
              features={[
                "Real-time voltage/current graphs",
                "Power consumption metrics",
                "Relay state monitoring",
                "Device connection status",
                "Live data streaming",
              ]}
            />
          </TabsContent>

          <TabsContent value="database">
            <PlaceholderTab
              title="Energy Data & Analytics"
              description="Coming Soon"
              features={[
                "Historical energy consumption",
                "Daily/weekly/monthly reports",
                "Cost calculations",
                "Data export (CSV/JSON)",
                "Usage trends and predictions",
              ]}
            />
          </TabsContent>

          <TabsContent value="settings">
            <PlaceholderTab
              title="Configuration"
              description="Coming Soon"
              features={[
                "Device management",
                "API key configuration",
                "Notification preferences",
                "Data retention policies",
                "User access control",
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
