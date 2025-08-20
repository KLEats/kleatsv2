"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, GraduationCap, Users, Shield } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginSelectPage() {
  const loginOptions = [
    {
      title: "Student Login",
      description: "Access your account to order food and track orders",
      icon: GraduationCap,
      href: "/login",
      color: "bg-green-100 text-green-600",
      hoverColor: "hover:bg-green-50 hover:text-green-700",
    },
    {
      title: "Worker Portal",
      description: "Manage orders and menu items for your canteen",
      icon: Users,
      href: "/worker-login",
      color: "bg-blue-100 text-blue-600",
      hoverColor: "hover:bg-blue-50 hover:text-blue-700",
    },
    {
      title: "Admin Portal",
      description: "System administration and platform management",
      icon: Shield,
      href: "/admin-login",
      color: "bg-red-100 text-red-600",
      hoverColor: "hover:bg-red-50 hover:text-red-700",
    },
  ]

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="absolute left-4 top-4 flex items-center text-sm text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold text-primary mb-4">KL-Eats</h1>
          <p className="text-xl text-muted-foreground">Choose your login type to continue</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {loginOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={option.href}>
                <Card
                  className={`cursor-pointer transition-all duration-200 ${option.hoverColor} hover:shadow-lg hover:scale-105`}
                >
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${option.color}`}
                    >
                      <option.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="inline-flex items-center text-sm font-medium text-primary">
                        Continue
                        <ArrowLeft className="ml-1 h-4 w-4 rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up as a student
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
