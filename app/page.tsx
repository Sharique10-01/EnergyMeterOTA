import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Zap, Activity, Bell, BarChart3, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Grid Background */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Content */}
        <div className="container relative mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo/Brand */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border bg-card px-6 py-3 shadow-sm">
              <Zap className="size-5 text-primary" />
              <span className="text-sm font-semibold">Energy Meter OTA</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Protect Your Home from <span className="text-primary">Electrical Hazards</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Advanced IoT solution for real-time power monitoring, consumption tracking, and intelligent protection
              against electrical faults. Enterprise-grade safety for residential and commercial applications.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link href="/auth/login">
                  Access Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[160px] bg-transparent">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Transmission Tower Visual */}
        <div className="pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 opacity-[0.03] lg:block">
          <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M200 50L180 150H220L200 50Z"
              stroke="currentColor"
              strokeWidth="3"
              fill="currentColor"
              fillOpacity="0.1"
            />
            <path d="M140 180H260M120 250H280M100 320H300" stroke="currentColor" strokeWidth="4" />
            <path d="M200 150L200 550" stroke="currentColor" strokeWidth="6" />
            <path d="M160 400L200 550L240 400" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Comprehensive Protection & Monitoring
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
              Our advanced system combines real-time monitoring with intelligent protection mechanisms to safeguard your
              electrical infrastructure.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Shield className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Electrical Hazard Protection</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Intelligent detection and prevention of electrical faults, overloads, and short circuits with instant
                automatic disconnection.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Activity className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Real-Time Monitoring</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Live voltage, current, and power readings with high-precision sensors and millisecond-level data
                updates.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <BarChart3 className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Power Consumption Analytics</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Detailed consumption tracking, cost analysis, and predictive insights to optimize energy usage and
                reduce bills.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Bell className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Intelligent Alert System</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Instant notifications for critical events via mobile, email, and SMS with customizable threshold
                settings.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Zap className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">OTA Firmware Updates</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Remote firmware updates for continuous improvements, security patches, and new feature deployments
                without site visits.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Lock className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Enterprise Security</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bank-grade encryption, secure authentication, and role-based access control for complete data
                protection.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">&lt;50ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Data Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Secure Your Electrical System?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-muted-foreground">
              Access the management dashboard to monitor your devices, view analytics, and manage firmware updates.
            </p>
            <Button asChild size="lg">
              <Link href="/auth/login">
                Sign In to Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Energy Meter OTA. Professional IoT Electrical Protection System.</p>
        </div>
      </footer>
    </main>
  )
}
