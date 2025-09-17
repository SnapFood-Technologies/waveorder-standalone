export default function FAQPage() {
  const faqs = [
    {
      question: "How does WhatsApp ordering work?",
      answer: "Customers browse your catalog on our platform, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted message containing their order details."
    },
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! Our platform works with your regular WhatsApp or WhatsApp Business number. No expensive API required."
    },
    {
      question: "Can I customize my catalog?",
      answer: "Yes! You can customize colors, upload your logo, and brand your catalog to match your business identity."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support cash on delivery, bank transfers, and various local payment methods depending on your region."
    },
    {
      question: "Can multiple team members access the dashboard?",
      answer: "Yes! Our premium plans support multiple users per business account with different permission levels."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
      
      <div className="space-y-8">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
            <p className="text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
