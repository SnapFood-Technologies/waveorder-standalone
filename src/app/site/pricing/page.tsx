export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "5 products",
        "1 category", 
        "Basic catalog",
        "WhatsApp orders",
        "Email support"
      ]
    },
    {
      name: "Basic",
      price: "$9",
      period: "per month",
      features: [
        "Unlimited products",
        "Unlimited categories",
        "Custom branding",
        "Order management",
        "Analytics",
        "Priority support"
      ]
    },
    {
      name: "Premium",
      price: "$29",
      period: "per month",
      features: [
        "Everything in Basic",
        "Multiple users",
        "API access",
        "Custom domain",
        "Advanced analytics",
        "Wholesale pricing"
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div key={index} className="border rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-gray-600">/{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-gray-700">{feature}</li>
              ))}
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
