import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">🎯 DeepFlow</div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
          Your Life OS for
          <span className="text-blue-600"> Goals That Matter</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Connect daily tasks to life goals. See how every action moves you forward.
          Built for professionals who think in systems.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Start Free →
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-lg"
          >
            See Features
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Free plan available. No credit card required.
        </p>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          From Big Dreams to Daily Action
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Life Goals</h3>
                  <p className="text-gray-600">Define what truly matters. Career, health, relationships — your north stars.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  📁
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Projects</h3>
                  <p className="text-gray-600">Break goals into actionable projects with deadlines and milestones.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  ✅
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Daily Tasks</h3>
                  <p className="text-gray-600">Every task links back to a goal. See the impact of your daily work.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 rounded-2xl p-8 text-center">
              <div className="space-y-3 text-left">
                <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500">
                  <div className="text-sm font-medium">🎯 Financial Freedom</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm ml-6 border-l-4 border-green-500">
                  <div className="text-sm font-medium">📁 Launch SaaS Product</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm ml-12 border-l-4 border-purple-500">
                  <div className="text-sm font-medium">✅ Build landing page</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm ml-12 border-l-4 border-purple-500">
                  <div className="text-sm font-medium">✅ Set up payments</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              emoji="🔗"
              title="Goal Hierarchy"
              description="Tasks → Projects → Goals. Always see how your work connects to the bigger picture."
            />
            <FeatureCard
              emoji="📥"
              title="Quick Capture"
              description="Inbox for quick thoughts. Organize later. Never lose an idea."
            />
            <FeatureCard
              emoji="📊"
              title="Progress Tracking"
              description="Visual progress on every goal. Celebrate wins, spot blockers."
            />
            <FeatureCard
              emoji="📅"
              title="Today View"
              description="Focus on what matters today. See which goals your tasks serve."
            />
            <FeatureCard
              emoji="🌐"
              title="Web + Mobile"
              description="Plan on desktop, execute on mobile. Seamless sync everywhere."
            />
            <FeatureCard
              emoji="⚡"
              title="Brutally Simple"
              description="No endless customization. Structure that guides you forward."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple Pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">Start free, upgrade when you need more</p>
          
          <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li>✓ 3 Goals</li>
                <li>✓ 5 Projects</li>
                <li>✓ Unlimited Tasks</li>
                <li>✓ Basic Progress View</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full py-3 text-center border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="flex-1 bg-blue-600 rounded-2xl p-8 text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$6.99</span>
                <span className="text-blue-200">/month</span>
              </div>
              <p className="text-blue-200 text-sm">or $49.99/year (save 40%)</p>
              <ul className="mt-6 space-y-3 text-blue-100">
                <li>✓ Unlimited Goals</li>
                <li>✓ Unlimited Projects</li>
                <li>✓ Full Analytics Dashboard</li>
                <li>✓ Weekly Review</li>
                <li>✓ Mobile App Sync</li>
                <li>✓ Priority Support</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full py-3 text-center bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
              >
                Start 7-Day Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to achieve your goals?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of professionals who use DeepFlow to turn big dreams into daily reality.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 DeepFlow. Built with ❤️ for goal-achievers.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="text-3xl mb-4">{emoji}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}
