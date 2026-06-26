import FinancialSummary from "@/components/FinancialSummary";
import QuickActions from "@/components/QuickActions";
import StatsGrid from "@/components/StatsGrid";
import RecentDeals from "@/components/RecentDeals";
import TopHustles from "@/components/TopHustles";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Alex
              </span>{" "}
              👋
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Your AI-powered financial survival companion. Optimize your money, find the best
              deals, and grow your wealth with M0neyPundit.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Stats Grid */}
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Summary */}
            <FinancialSummary />

            {/* Quick Actions */}
            <QuickActions />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Deals */}
            <RecentDeals />

            {/* Top Hustles */}
            <TopHustles />
          </div>
        </div>
      </div>
    </div>
  );
}