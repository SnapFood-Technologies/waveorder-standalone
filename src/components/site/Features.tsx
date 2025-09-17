export default function Features() {
  const features = [
    {
      title: "WhatsApp Native",
      description: "Leverages the platform customers already use - no new apps required"
    },
    {
      title: "Beautiful Catalogs",
      description: "Create stunning product catalogs with your branding"
    },
    {
      title: "Multi-User Accounts",
      description: "Team collaboration with multiple users per business"
    },
    {
      title: "Flexible Setup",
      description: "Manual, CSV import, or API integration options"
    },
    {
      title: "Order Management",
      description: "Track orders, manage inventory, and analytics"
    },
    {
      title: "Payment Flexibility",
      description: "Support for local payment methods and gateways"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose WaveOrder?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
