import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

const categories = [
  {
    id: 1,
    name: "South Indian",
    image: "/placeholder.svg?height=80&width=80",
    slug: "south-indian",
  },
  {
    id: 2,
    name: "Chinese",
    image: "/placeholder.svg?height=80&width=80",
    slug: "chinese",
  },
  {
    id: 3,
    name: "Snacks",
    image: "/placeholder.svg?height=80&width=80",
    slug: "snacks",
  },
  {
    id: 4,
    name: "Beverages",
    image: "/placeholder.svg?height=80&width=80",
    slug: "beverages",
  },
  {
    id: 5,
    name: "North Indian",
    image: "/placeholder.svg?height=80&width=80",
    slug: "north-indian",
  },
]

export default function FoodCategories() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {categories.map((category) => (
        <Link href={`/category/${category.slug}`} key={category.id}>
          <Card className="card-hover overflow-hidden h-full">
            <CardContent className="flex h-36 flex-col items-center justify-center p-4 text-center">
              <div className="mb-3 rounded-full bg-secondary/10 p-2">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
              <h3 className="text-center text-sm font-medium truncate w-full">{category.name}</h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
