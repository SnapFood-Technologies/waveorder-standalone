// src/components/site/About.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Heart, Target, Shield, Users, Globe, Zap, Award, TrendingUp } from 'lucide-react'

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Customer-First",
      description: "Every feature we build starts with understanding what restaurants and their customers need for a seamless ordering experience."
    },
    {
      icon: Zap,
      title: "Simplicity",
      description: "We believe powerful tools should be easy to use. Complex features hidden behind simple, intuitive interfaces."
    },
    {
      icon: Shield,
      title: "Reliability",
      description: "Your business depends on orders flowing smoothly. We build robust systems that work when you need them most."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "WhatsApp ordering should be available to every business, regardless of size or technical expertise."
    }
  ]

  const stats = [
    { number: "500+", label: "Businesses Using WaveOrder" },
    { number: "50K+", label: "Orders Processed Monthly" },
    { number: "25+", label: "Countries Served" },
    { number: "99.9%", label: "Uptime Reliability" }
  ]

  const team = [
    {
      name: "Alex Rodriguez",
      role: "Founder & CEO",
      description: "Former restaurant owner who experienced firsthand the challenges of managing WhatsApp orders manually.",
      background: "15 years in restaurant operations"
    },
    {
      name: "Sarah Chen",
      role: "Head of Product", 
      description: "Product strategist focused on creating intuitive experiences for business owners and their customers.",
      background: "10 years in SaaS product development"
    },
    {
      name: "Marcus Johnson",
      role: "Head of Engineering",
      description: "Technical architect ensuring WaveOrder scales reliably as more businesses join the platform.",
      background: "12 years building scalable systems"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Making WhatsApp Ordering Super Easy
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We believe every restaurant and business should be able to leverage WhatsApp for orders 
              without technical complexity or expensive setup costs. WaveOrder makes this vision a reality.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                To democratize WhatsApp ordering by providing powerful, affordable tools that help 
                businesses of all sizes create professional ordering experiences for their customers.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We started WaveOrder after seeing countless restaurant owners struggling with manual WhatsApp 
                order management - losing orders in chat threads, spending hours creating digital menus, 
                and missing out on the convenience their customers wanted.
              </p>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">5 min</div>
                  <div className="text-sm text-gray-600">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">$0</div>
                  <div className="text-sm text-gray-600">API Costs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">24/7</div>
                  <div className="text-sm text-gray-600">Order Processing</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-8 rounded-2xl">
              <div className="text-center">
                <Target className="w-16 h-16 text-teal-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Built for Restaurant Success
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every feature is designed with restaurant operations in mind - from handling 
                  rush hour orders to managing complex menu variations and team collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we build and every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Growing Together
            </h2>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              We're proud to support businesses worldwide in their WhatsApp ordering journey
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-teal-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Our Story
            </h2>
            
            <div className="prose prose-lg prose-gray mx-auto">
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                WaveOrder began when our founder, a restaurant owner, spent countless hours manually 
                managing WhatsApp orders. Orders were getting lost in chat threads, creating digital 
                menus was expensive, and there had to be a better way.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                After researching existing solutions, we found they were either too expensive, too 
                complex, or required technical expertise that most restaurant owners didn't have. 
                We decided to build the solution we wished existed.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Today, WaveOrder helps hundreds of businesses streamline their WhatsApp orders with 
                beautiful catalogs, seamless order management, and tools that actually work for 
                real restaurant operations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-8 rounded-2xl border border-teal-100">
              <div className="text-center">
                <Award className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Committed to Your Success
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We measure our success by your success. Every feature we build, every update we release, 
                  and every support interaction is focused on helping your business grow through better WhatsApp ordering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Restaurant operators and technology experts working together to solve real business challenges
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-teal-600 font-medium mb-4">{member.role}</div>
                <p className="text-gray-600 mb-4 leading-relaxed">{member.description}</p>
                <div className="text-sm text-gray-500">{member.background}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Become part of the WaveOrder family and transform how your business handles WhatsApp orders. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-teal-600 text-teal-600 text-lg font-semibold rounded-lg hover:bg-teal-50 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}