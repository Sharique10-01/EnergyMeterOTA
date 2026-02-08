import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrentFirmware } from "@/components/current-firmware"
import { OtaUpload } from "@/components/ota-upload"
import { FirmwareHistory } from "@/components/firmware-history"
import { OtaEndpoint } from "@/components/ota-endpoint"
import { MonitoringTab } from "@/components/monitoring-tab"
import { DatabaseTab } from "@/components/database-tab"
import { SettingsTab } from "@/components/settings-tab"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="ota">OTA Updates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring">
            <MonitoringTab />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseTab />
          </TabsContent>

          <TabsContent value="ota" className="space-y-6">
            <CurrentFirmware />
            <OtaUpload />
            <FirmwareHistory />
            <OtaEndpoint />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
